import { SiakCookies } from "../../types";
import { impersonatedFetch } from "../utils";

const SIAKNG_HOST = process.env.SIAKNG_HOST;

export async function logout(cookies: SiakCookies) {
    if (SIAKNG_HOST === undefined) {
        throw new Error("Environment variable SIAKNG_HOST not found");
    }

    const mojaviCookie = cookies.Mojavi;
    const siakngCookie = cookies.siakng_cc;

    if (!mojaviCookie || !siakngCookie) {
        throw new Error("Mojavi or siakng_cc cookie not found");
    }

    return await impersonatedFetch(
        `https://${SIAKNG_HOST}/main/Authentication/Logout`,
        {
            method: "GET",
            headers: {
                Priority: "u=0, i",
                Cookie: `Mojavi=${mojaviCookie}; siakng_cc=${siakngCookie}`,
            },
            waitForBody: false,
        },
    );
}
