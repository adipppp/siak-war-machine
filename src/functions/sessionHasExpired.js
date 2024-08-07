function sessionHasExpired(res) {
    return (
        Math.trunc(res.statusCode / 300) === 1 &&
        res.headers.location !== undefined &&
        res.headers.location === "/main/Authentication/"
    );
}

module.exports = { sessionHasExpired };
