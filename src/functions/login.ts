import EventEmitter, { once } from "events";
import { Writable } from "stream";
import { Client } from "undici";
import { IncomingHttpHeaders } from "undici/types/header";
import { CustomError, CustomErrorCode } from "../errors";
import { Cookies } from "../types";

export async function login(client: Client) {
    if (
        !process.env.USERNAME_SSO ||
        !process.env.PASSWORD_SSO ||
        !process.env.SIAKNG_HOST
    ) {
        throw new CustomError(
            CustomErrorCode.ENV_VARIABLE_NOT_FOUND,
            "Environment variable USERNAME_SSO, PASSWORD_SSO or SIAKNG_HOST not found"
        );
    }

    const emitter = new EventEmitter();

    client.stream(
        {
            path: "/main/Authentication/Index",
            method: "POST",
            idempotent: true,
            opaque: emitter,
            bodyTimeout: 5000,
            headersTimeout: 3000,
            throwOnError: true,
            headers: [
                "Priority",
                "u=0",
                "Content-Type",
                "application/x-www-form-urlencoded",
            ],
            body: `u=${process.env.USERNAME_SSO}&p=${process.env.PASSWORD_SSO}`,
        },
        ({ headers, opaque }) => {
            const emitter = opaque as EventEmitter;
            emitter.emit("headers", headers);
            return new Writable({
                write: (chunk, encoding, callback) => {
                    callback();
                },
            });
        },
        (err, data) => {
            if (err === null) return;
            const emitter = data.opaque as EventEmitter;
            emitter.emit("error", err);
        }
    );

    const headersListener = once(emitter, "headers");
    const errorListener = once(emitter, "error");

    const result = (await Promise.race([headersListener, errorListener])) as
        | [IncomingHttpHeaders]
        | [Error];

    if (result[0] instanceof Error) {
        const error = result[0];
        throw error;
    }

    const headers = result[0];
    const setCookieValues = headers["set-cookie"];

    if (setCookieValues === undefined) {
        throw new CustomError(
            CustomErrorCode.NO_COOKIES_RETURNED,
            "No cookies found"
        );
    }

    const cookies = {} as Cookies;
    const re = /^(.+)=(.+); path|$/;

    for (const value of setCookieValues) {
        const result = value.match(re);

        if (!result) {
            throw new CustomError(
                CustomErrorCode.NO_COOKIES_RETURNED,
                "No cookies found"
            );
        }

        switch (result[1]) {
            case "Mojavi":
                cookies.Mojavi = result[2];
                break;
            case "siakng_cc":
                cookies.siakng_cc = result[2];
                break;
            default:
                console.log(
                    `An unidentified cookie has appeared: ${result[1]}`
                );
        }
    }

    if (!cookies.Mojavi || !cookies.siakng_cc) {
        throw new CustomError(
            CustomErrorCode.SESSION_COOKIES_NOT_FOUND,
            "Mojavi or siakng_cc cookie not found"
        );
    }

    return cookies;
}
