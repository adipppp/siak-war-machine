import EventEmitter, { once } from "events";
import { Writable } from "stream";
import { Client } from "undici";
import { IncomingHttpHeaders } from "undici/types/header";
import { CustomError, CustomErrorCode } from "../errors";
import { sessionHasExpired } from "./sessionHasExpired";
import { Cookies } from "../types";

export async function saveCoursePlan(
    client: Client,
    cookies: Cookies,
    reqBody: string
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
            path: "/main/CoursePlan/CoursePlanSave",
            method: "POST",
            idempotent: true,
            bodyTimeout: 5000,
            headersTimeout: 3000,
            throwOnError: true,
            headers: [
                "Priority",
                "u=0",
                "Content-Type",
                "application/x-www-form-urlencoded",
                "Cookie",
                `Mojavi=${mojaviCookie}; siakng_cc=${siakngCookie}`,
            ],
            body: reqBody,
        },
        ({ statusCode, headers }) => {
            emitter.emit("headers", statusCode, headers);
            return new Writable({
                write: (chunk, encoding, callback) => {
                    callback();
                },
            });
        },
        (err) => {
            if (err === null) return;
            emitter.emit("error", err);
        }
    );

    const result = (await Promise.race([
        once(emitter, "headers"),
        once(emitter, "error"),
    ])) as [number, IncomingHttpHeaders] | [Error];

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
}
