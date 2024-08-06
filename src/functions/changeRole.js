const https = require("https");

module.exports = {
    async changeRole(cookies) {
        const mojaviCookie = cookies.Mojavi;
        const siakngCookie = cookies.siakng_cc;

        if (!mojaviCookie || !siakngCookie) {
            throw new Error("Mojavi or siakng_cc cookie not found");
        }

        const res_1 = await new Promise((resolve, reject) => {
            const req = https.get(
                "https://academic.ui.ac.id/main/Authentication/ChangeRole",
                {
                    headers: {
                        Cookie: `Mojavi=${mojaviCookie};siakng_cc=${siakngCookie}`,
                    },
                },
                (res) => resolve(res)
            );
            req.on("error", (err) => reject(err));
            req.setTimeout(5000, () => reject(new Error("Request timed out")));
        });

        res_1.resume();

        if (
            Math.trunc(res_1.statusCode / 300) === 1 &&
            res_1.headers.location &&
            res_1.headers.location === "/main/Authentication/"
        ) {
            throw new Error("Session has expired");
        }
    },
};
