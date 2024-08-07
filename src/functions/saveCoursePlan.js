const https = require("https");
const { sessionHasExpired } = require("./sessionHasExpired");

async function saveCoursePlan(cookies, reqBody) {
    const mojaviCookie = cookies.Mojavi;
    const siakngCookie = cookies.siakng_cc;

    if (!mojaviCookie || !siakngCookie) {
        throw new Error("Mojavi or siakng_cc cookie not found");
    }

    const res_1 = await new Promise((resolve, reject) => {
        const req = https.request(
            "https://academic.ui.ac.id/main/CoursePlan/CoursePlanSave",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Cookie: `Mojavi=${mojaviCookie}; siakng_cc=${siakngCookie}`,
                },
            },
            (res) => resolve(res)
        );
        req.on("error", (err) => reject(err));
        req.write(reqBody, "utf-8");
        req.end();
        req.setTimeout(5000, () => reject(new Error("Request timed out")));
    });

    res_1.resume();

    if (sessionHasExpired(res_1)) {
        throw new Error("Session has expired");
    }
}

module.exports = { saveCoursePlan };
