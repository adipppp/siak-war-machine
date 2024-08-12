export function sessionHasExpired(statusCode: number, location?: string) {
    return (
        Math.trunc(statusCode / 300) === 1 &&
        location !== undefined &&
        location === "/main/Authentication/"
    );
}
