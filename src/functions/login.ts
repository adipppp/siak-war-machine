import EventEmitter, { once } from "events";
import { Writable } from "stream";
import { Client } from "undici";
import { IncomingHttpHeaders } from "undici/types/header";
import { Cookies } from "../types";

export async function login(client: Client) {
    if (
        !process.env.USERNAME_SSO ||
        !process.env.PASSWORD_SSO ||
        !process.env.SIAKNG_HOST
    ) {
        throw new Error(
            "Environment variable USERNAME_SSO, PASSWORD_SSO or SIAKNG_HOST not found"
        );
    }

    const emitter = new EventEmitter();

    client.stream(
        {
            path: "/main/Authentication/Index",
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
            ],
            body: `u=${process.env.USERNAME_SSO}&p=${process.env.PASSWORD_SSO}`,
        },
        ({ headers }) => {
            emitter.emit("headers", headers);
            const writable = new Writable({
                write: (chunk, encoding, callback) => callback(),
            });
            writable.on("error", () => writable.destroy());
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
    ])) as [IncomingHttpHeaders] | [Error];

    if (result[0] instanceof Error) {
        const error = result[0];
        throw error;
    }

    const headers = result[0];
    const setCookieValues = headers["set-cookie"];

    if (setCookieValues === undefined) {
        throw new Error("No cookies found");
    }

    const cookies = {} as Cookies;
    const re = /^(.+)=(.+); path|$/;

    for (const value of setCookieValues) {
        const result = value.match(re);

        if (!result) {
            throw new Error("No cookies found");
        }

        switch (result[1]) {
            case "Mojavi":
                cookies.Mojavi = result[2];
                break;
            case "siakng_cc":
                cookies.siakng_cc = result[2];
                break;
            default:
                console.log("An unidentified cookie has appeared!");
        }
    }

    if (!cookies.Mojavi || !cookies.siakng_cc) {
        throw new Error("Mojavi or siakng_cc cookie not found");
    }

    return cookies;
}
