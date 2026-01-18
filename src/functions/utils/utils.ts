import { SiakCookies } from "../../types";

export function sessionHasExpired(
    statusCode: number,
    location?: string | null,
) {
    return (
        Math.trunc(statusCode / 300) === 1 &&
        location !== undefined &&
        location !== null &&
        location === "/main/Authentication/"
    );
}

function hasRequiredCookies(
    cookies: Record<string, string>,
): cookies is SiakCookies {
    const { Mojavi, siakng_cc } = cookies;
    return typeof Mojavi === "string" && typeof siakng_cc === "string";
}

export function parseCookies(setCookieHeaders: string | string[]): SiakCookies {
    const headers = Array.isArray(setCookieHeaders)
        ? setCookieHeaders
        : [setCookieHeaders];
    const cookies: Record<string, string> = {};

    for (const header of headers) {
        const [key, value] = header.split(";")[0].split("=");
        if (typeof key === "string" && typeof value === "string") {
            cookies[key.trim()] = value.trim();
        }
    }

    if (!hasRequiredCookies(cookies)) {
        throw new Error("Required cookies not found in the provided headers");
    }

    return cookies;
}
