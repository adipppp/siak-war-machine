import { CustomError, CustomErrorCode } from "../../errors";
import { ImpersonatedResponse, SiakCookies } from "../../types";
import { impersonatedFetch, sessionHasExpired } from "../utils";

const SIAKNG_HOST = process.env.SIAKNG_HOST;

export async function saveCoursePlan(
    cookies: SiakCookies,
    reqBody: string,
): Promise<ImpersonatedResponse> {
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

    const response = await impersonatedFetch(
        `https://${SIAKNG_HOST}/main/CoursePlan/CoursePlanSave`,
        {
            method: "POST",
            headers: {
                Priority: "u=0, i",
                "Content-Type": "application/x-www-form-urlencoded",
                Cookie: `Mojavi=${mojaviCookie}; siakng_cc=${siakngCookie}`,
            },
            body: reqBody,
            waitForBody: false,
        },
    );

    const { statusCode, headers } = response;
    const location = headers.get("location");

    if (sessionHasExpired(statusCode, location)) {
        throw new CustomError(
            CustomErrorCode.SESSION_EXPIRED,
            "Session has expired",
        );
    }

    return response;
}
