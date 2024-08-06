const https = require("https");

module.exports = {
    async login() {
        const res_1 = await new Promise((resolve, reject) => {
            const req = https.request(
                "https://academic.ui.ac.id/main/Authentication/Index",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                },
                (res) => resolve(res)
            );
            req.on("error", (err) => reject(err));
            req.write(
                `u=${process.env.USERNAME_SSO}&p=${process.env.PASSWORD_SSO}`,
                "utf-8"
            );
            req.end();
            req.setTimeout(5000, () => reject(new Error("Request timed out")));
        });

        res_1.resume();

        const cookies = {};

        const setCookieValues = res_1.headers["set-cookie"];
        const re = /^(.+)=(.+); path|$/;

        for (const value of setCookieValues) {
            const result = value.match(re);

            switch (result[1]) {
                case "Mojavi":
                    cookies.Mojavi = result[2];
                    break;
                case "siakng_cc":
                    cookies.siakng_cc = result[2];
                    break;
                default:
                    console.log("An unidentified cookie has appeared!");
            }
        }

        if (!cookies.Mojavi || !cookies.siakng_cc) {
            throw new Error("Mojavi or siakng_cc cookie not found");
        }

        return cookies;
    },
};
