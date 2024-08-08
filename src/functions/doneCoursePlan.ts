import { IncomingMessage } from "http";
import https from "https";
import { sessionHasExpired } from "./sessionHasExpired";
import { Cookies } from "../types";

export async function doneCoursePlan(cookies: Cookies) {
    const mojaviCookie = cookies.Mojavi;
    const siakngCookie = cookies.siakng_cc;

    const res_1 = await new Promise<IncomingMessage>((resolve, reject) => {
        const req = https.get(
            "https://academic.ui.ac.id/main/CoursePlan/CoursePlanDone",
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

    res_1.resume();

    if (sessionHasExpired(res_1)) {
        throw new Error("Session has expired");
    }
}
