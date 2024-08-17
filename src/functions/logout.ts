import EventEmitter, { once } from "events";
import { Writable } from "stream";
import { Client } from "undici";
import { Cookies } from "../types";

export async function logout(client: Client, cookies: Cookies) {
    const mojaviCookie = cookies.Mojavi;
    const siakngCookie = cookies.siakng_cc;

    if (!mojaviCookie || !siakngCookie) {
        throw new Error("Mojavi or siakng_cc cookie not found");
    }

    const emitter = new EventEmitter();

    client.stream(
        {
            path: "/main/Authentication/Logout",
            method: "GET",
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
        () => {
            emitter.emit("headers");
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
    ])) as [] | [Error];

    if (result[0] instanceof Error) {
        const error = result[0];
        throw error;
    }
}
