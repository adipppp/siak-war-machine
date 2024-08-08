import { IncomingMessage } from "http";
import https from "https";
import { Cookies } from "../types";

export async function logout(cookies: Cookies) {
    const mojaviCookie = cookies.Mojavi;
    const siakngCookie = cookies.siakng_cc;

    if (!mojaviCookie || !siakngCookie) {
        throw new Error("Mojavi or siakng_cc cookie not found");
    }

    const res_1 = await new Promise<IncomingMessage>((resolve, reject) => {
        const req = https.get(
            "https://academic.ui.ac.id/main/Authentication/Logout",
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
}
