import EventEmitter, { once } from "events";
import { Writable } from "stream";
import { Client } from "undici";
import { IncomingHttpHeaders } from "undici/types/header";
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
        throw new Error("Mojavi or siakng_cc cookie not found");
    }

    const emitter = new EventEmitter();

    const stream = client.stream(
        {
            path: "/main/CoursePlan/CoursePlanEdit",
            method: "GET",
            opaque: [],
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
            emitter.emit("headers", statusCode, headers);
            const bufs = opaque as Buffer[];
            return new Writable({
                write: (chunk, encoding, callback) => {
                    bufs.push(chunk);
                    callback();
                },
            });
        }
    );

    const [statusCode, headers] = (await once(emitter, "headers")) as [
        number,
        IncomingHttpHeaders
    ];
    const location = headers["location"] as string | undefined;

    if (sessionHasExpired(statusCode, location)) {
        throw new Error("Session has expired");
    }

    const bufs = (await stream).opaque as Buffer[];
    const htmlString = Buffer.concat(bufs).toString("utf-8");

    // get tokens
    const re =
        /<input +type *= *"hidden" *name *= *"tokens" *value *= *"([0-9]+)" *\/?>/i;
    const match = htmlString.match(re);

    if (!match) {
        throw new Error("tokens not found");
    }

    let reqBody = `tokens=${match[1]}&`;

    for (const course of courses) {
        const re = new RegExp(
            `c\\[${course.code}_([0-9\\-.]+)\\]" *value *= *"([0-9]+)-([0-9])"[\\s\\S\\n]+<a +.*href *= *"ClassInfo\\?cc=\\2".*>.*[ \\-]${course.class}<\\/a *>`,
            "i"
        );
        const match = htmlString.match(re);

        if (!match) {
            throw new Error("Pattern not found");
        }

        const curriculum = match[1];
        const classId = match[2];
        const credit = match[3];

        reqBody +=
            encodeURIComponent(`c[${course.code}_${curriculum}]`) +
            "=" +
            encodeURIComponent(`${classId}-${credit}`) +
            "&";
    }

    reqBody += "comment=&submit=Simpan+IRS";

    return reqBody;
}
