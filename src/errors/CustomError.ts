import { CustomErrorCode } from "./";

export class CustomError extends Error {
    readonly code: CustomErrorCode;

    constructor(code: CustomErrorCode, message?: string) {
        super(message);
        this.code = code;
    }
}
