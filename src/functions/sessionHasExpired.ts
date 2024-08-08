import { IncomingMessage } from "http";

export function sessionHasExpired(res: IncomingMessage) {
    return (
        res.statusCode !== undefined &&
        Math.trunc(res.statusCode / 300) === 1 &&
        res.headers.location !== undefined &&
        res.headers.location === "/main/Authentication/"
    );
}
