const https = require("https");
const { sessionHasExpired } = require("./sessionHasExpired");

async function doneCoursePlan(cookies) {
    const mojaviCookie = cookies.Mojavi;
    const siakngCookie = cookies.siakng_cc;

    const res_1 = await new Promise((resolve, reject) => {
        const req = https.get(
            "https://academic.ui.ac.id/main/CoursePlan/CoursePlanDone",
            {
                headers: {
                    Cookie: `Mojavi=${mojaviCookie}; siakng_cc=${siakngCookie}`,
                },
            },
            (res) => resolve(res)
        );
        req.on("error", (err) => reject(err));
        req.setTimeout(5000, () => reject(new Error("Request timed out")));
    });

    res_1.resume();

    if (sessionHasExpired(res_1)) {
        throw new Error("Session has expired");
    }
}

module.exports = { doneCoursePlan };
