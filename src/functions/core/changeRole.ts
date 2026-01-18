import { CustomError, CustomErrorCode } from "../../errors";
import { ImpersonatedResponse, SiakCookies } from "../../types";
import { impersonatedFetch, sessionHasExpired } from "../utils";

const SIAKNG_HOST = process.env.SIAKNG_HOST;

export async function changeRole(
    cookies: SiakCookies,
): Promise<ImpersonatedResponse> {
    if (SIAKNG_HOST === undefined) {
        throw new CustomError(
            CustomErrorCode.ENV_VARIABLE_NOT_FOUND,
            "Environment variable SIAKNG_HOST not found",
        );
    }

    const mojaviCookie = cookies.Mojavi;
    const siakngCookie = cookies.siakng_cc;

    if (!mojaviCookie || !siakngCookie) {
        throw new CustomError(
            CustomErrorCode.SESSION_COOKIES_NOT_FOUND,
            "Mojavi or siakng_cc cookie not found",
        );
    }

    const reqHeaders = {
        Priority: "u=0, i",
        Cookie: `Mojavi=${mojaviCookie}; siakng_cc=${siakngCookie}`,
    };

    const response = await impersonatedFetch(
        `https://${SIAKNG_HOST}/main/Authentication/ChangeRole`,
        {
            method: "GET",
            headers: reqHeaders,
            waitForBody: false,
        },
    );

    const { statusCode, headers } = response;
    const location = headers.get("location");

    if (sessionHasExpired(statusCode, location)) {
        throw new CustomError(
            CustomErrorCode.SESSION_EXPIRED,
            "Session has expired",
        );
    }

    return response;
}
