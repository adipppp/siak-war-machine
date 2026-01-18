import { CustomError, CustomErrorCode } from "../../errors";
import { Course, SiakCookies } from "../../types";
import { impersonatedFetch, sessionHasExpired } from "../utils";

const SIAKNG_HOST = process.env.SIAKNG_HOST;

const TOKEN_REGEX =
    /<input +type *= *"hidden" *name *= *"tokens" *value *= *"([0-9]{10})" *\/?>/i;

async function findTokenInStream(
    stream: NodeJS.ReadableStream,
): Promise<string | null> {
    let buffer = "";

    for await (const chunk of stream) {
        buffer += (chunk as Buffer).toString("utf-8");
        const match = buffer.match(TOKEN_REGEX);
        if (match) {
            return match[1];
        }
        // Keep only the last 200 chars to handle tokens split across chunks
        if (buffer.length > 500) {
            buffer = buffer.slice(-200);
        }
    }

    return null;
}

export async function scrapeCoursePlanEdit(
    cookies: SiakCookies,
    courses: Course[],
) {
    if (SIAKNG_HOST === undefined) {
        throw new CustomError(
            CustomErrorCode.ENV_VARIABLE_NOT_FOUND,
            "Environment variable SIAKNG_HOST not found",
        );
    }

    const mojaviCookie = cookies.Mojavi;
    const siakngCookie = cookies.siakng_cc;

    if (!mojaviCookie || !siakngCookie) {
        throw new CustomError(
            CustomErrorCode.SESSION_COOKIES_NOT_FOUND,
            "Mojavi or siakng_cc cookie not found",
        );
    }

    const reqHeaders = {
        Priority: "u=0, i",
        Cookie: `Mojavi=${mojaviCookie}; siakng_cc=${siakngCookie}`,
    };

    const response = await impersonatedFetch(
        `https://${SIAKNG_HOST}/main/CoursePlan/CoursePlanEdit`,
        {
            method: "GET",
            headers: reqHeaders,
            waitForBody: false,
        },
    );

    const { statusCode, headers, stream } = response;
    const location = headers.get("location");

    if (sessionHasExpired(statusCode, location)) {
        throw new CustomError(
            CustomErrorCode.SESSION_EXPIRED,
            "Session has expired",
        );
    }

    const token = await findTokenInStream(stream);
    if (token === null) {
        throw new CustomError(
            CustomErrorCode.TOKENS_NOT_FOUND,
            "tokens not found",
        );
    }

    let reqBody = `tokens=${token}&`;

    for (const course of courses) {
        const { curriculum, classId, credit } = course;
        reqBody +=
            encodeURIComponent(`c[${course.code}_${curriculum}]`) +
            "=" +
            encodeURIComponent(`${classId}-${credit}`) +
            "&";
    }

    reqBody += "comment=&submit=Simpan+IRS";

    return reqBody;
}
