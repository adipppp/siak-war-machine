import { once } from "events";
import { IncomingMessage } from "http";
import https from "https";
import { sessionHasExpired } from "./sessionHasExpired";
import { Cookies, Course } from "../types";
// const { Client } = require("undici");
// const { Writable } = require("stream");

export async function scrapeCoursePlanView(
    cookies: Cookies,
    courses: Course[]
) {
    const mojaviCookie = cookies.Mojavi;
    const siakngCookie = cookies.siakng_cc;

    if (!mojaviCookie || !siakngCookie) {
        throw new Error("Mojavi or siakng_cc cookie not found");
    }

    const res_1 = await new Promise<IncomingMessage>((resolve, reject) => {
        const req = https.get(
            "https://academic.ui.ac.id/main/Schedule/Index?period=2024-1",
            {
                headers: {
                    Cookie: `Mojavi=${mojaviCookie}; siakng_cc=${siakngCookie}`,
                },
            },
            (res) => resolve(res)
        );
        req.on("error", (err) => reject(err));
        req.setTimeout(5000, () => reject(new Error("Request timed out")));
    });

    // const bufs = [];

    // const client = new Client("https://academic.ui.ac.id");
    // await client.stream(
    //     {
    //         path: "/main/Schedule/Index?period=2024-1",
    //         method: "GET",
    //         headers: [
    //             "Cookie",
    //             `Mojavi=${mojaviCookie}; siakng_cc=${siakngCookie}`,
    //         ],
    //         opaque: { bufs },
    //     },
    //     ({ statusCode, headers, opaque: { bufs } }) => {
    //         if (
    //             Math.trunc(statusCode / 300) === 1 &&
    //             headers.location !== undefined &&
    //             headers.location === "/main/Authentication/"
    //         ) {
    //             throw new Error("Session has expired");
    //         }
    //         return new Writable({
    //             write(chunk, encoding, callback) {
    //                 bufs.push(chunk);
    //                 callback();
    //             },
    //         });
    //     }
    // );

    let htmlString = "";
    // const htmlString = Buffer.concat(bufs).toString("utf-8");

    res_1.on("data", (chunk) => (htmlString += chunk.toString()));
    await once(res_1, "end");

    if (sessionHasExpired(res_1)) {
        throw new Error("Session has expired");
    }

    for (const course of courses) {
        const re = new RegExp(
            `${course.code} -.+\\(([0-9]) SKS.+Kurikulum ([0-9\\-.]+)<\\/th>`,
            "i"
        );
        const match = htmlString.match(re);

        if (!match) {
            throw new Error("Pattern not found");
        }

        const credit = match[1];
        const curriculum = match[2];

        console.log(
            `Course ${course.name}${
                course.class ? " " + course.class : ""
            } has ${credit} SKS and belongs to curriculum ${curriculum}`
        );
    }
}
