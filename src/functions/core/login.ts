import { impersonatedFetch } from "../utils";
import { CustomError, CustomErrorCode } from "../../errors";

const USERNAME_SSO = process.env.USERNAME_SSO;
const PASSWORD_SSO = process.env.PASSWORD_SSO;
const SIAKNG_HOST = process.env.SIAKNG_HOST;

const reqHeaders = {
    "Content-Type": "application/x-www-form-urlencoded",
    Priority: "u=0, i",
};

export async function login() {
    if (
        USERNAME_SSO === undefined ||
        PASSWORD_SSO === undefined ||
        SIAKNG_HOST === undefined
    ) {
        throw new CustomError(
            CustomErrorCode.ENV_VARIABLE_NOT_FOUND,
            "Environment variable USERNAME_SSO, PASSWORD_SSO or SIAKNG_HOST not found",
        );
    }

    return await impersonatedFetch(
        `https://${SIAKNG_HOST}/main/Authentication/Index/`,
        {
            method: "POST",
            headers: reqHeaders,
            body: `u=${USERNAME_SSO}&p=${PASSWORD_SSO}`,
            waitForBody: false,
        },
    );
}
