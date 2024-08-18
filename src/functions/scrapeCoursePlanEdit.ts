import EventEmitter, { on, once } from "events";
import { Writable } from "stream";
import { Client } from "undici";
import { IncomingHttpHeaders } from "undici/types/header";
import { CustomError, CustomErrorCode } from "../errors";
import { sessionHasExpired } from "./sessionHasExpired";
import { Cookies, Course } from "../types";

export async function scrapeCoursePlanEdit(
    client: Client,
    cookies: Cookies,
    courses: Course[]
) {
    const mojaviCookie = cookies.Mojavi;
    const siakngCookie = cookies.siakng_cc;

    if (!mojaviCookie || !siakngCookie) {
        throw new CustomError(
            CustomErrorCode.SESSION_COOKIES_NOT_FOUND,
            "Mojavi or siakng_cc cookie not found"
        );
    }

    const emitter = new EventEmitter();

    client.stream(
        {
            path: "/main/CoursePlan/CoursePlanEdit",
            method: "GET",
            opaque: emitter,
            bodyTimeout: 5000,
            headersTimeout: 3000,
            throwOnError: true,
            headers: [
                "Priority",
                "u=0",
                "Cookie",
                `Mojavi=${mojaviCookie}; siakng_cc=${siakngCookie}`,
            ],
        },
        ({ statusCode, headers, opaque }) => {
            const emitter = opaque as EventEmitter;
            emitter.emit("headers", statusCode, headers);
            return new Writable({
                final: (callback) => {
                    emitter.emit("end");
                    callback();
                },
                write: (chunk, encoding, callback) => {
                    emitter.emit("data", chunk);
                    callback();
                },
            });
        },
        (err, data) => {
            const emitter = data.opaque as EventEmitter;
            if (err === null) return;
            emitter.emit("error", err);
        }
    );

    const headersListener = once(emitter, "headers");
    const errorListener = once(emitter, "error");
    const dataListener = on(emitter, "data", { close: ["end"] });

    const result = (await Promise.race([headersListener, errorListener])) as
        | [number, IncomingHttpHeaders]
        | [Error];

    if (result[0] instanceof Error) {
        const error = result[0];
        throw error;
    }

    const [statusCode, headers] = result;
    const location = headers!["location"] as string | undefined;

    if (sessionHasExpired(statusCode, location)) {
        throw new CustomError(
            CustomErrorCode.SESSION_EXPIRED,
            "Session has expired"
        );
    }

    let token;
    let htmlString = "";
    const re =
        /<input +type *= *"hidden" *name *= *"tokens" *value *= *"([0-9]{10})" *\/?>/i;

    for await (const data of dataListener) {
        const chunk = data[0] as Buffer;
        htmlString += chunk.toString("utf-8");
        const match = htmlString.match(re);
        if (match !== null) {
            token = match[1];
            break;
        }
    }

    if (token === undefined) {
        throw new CustomError(
            CustomErrorCode.TOKENS_NOT_FOUND,
            "tokens not found"
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
