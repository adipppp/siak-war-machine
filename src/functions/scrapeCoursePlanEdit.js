const { once } = require("events");
const https = require("https");

module.exports = {
  async scrapeCoursePlanEdit(cookies, courses) {
    const mojaviCookie = cookies.Mojavi;
    const siakngCookie = cookies.siakng_cc;

    if (!mojaviCookie || !siakngCookie) {
      throw new Error("Mojavi or siakng_cc cookie not found");
    }

    const res_1 = await new Promise((resolve, reject) => {
      const req = https.get(
        "https://academic.ui.ac.id/main/CoursePlan/CoursePlanEdit",
        { headers: { "Cookie": `Mojavi=${mojaviCookie}; siakng_cc=${siakngCookie}` } },
        (res) => resolve(res)
      );
      req.on("error", (err) => reject(err));
      req.setTimeout(5000, () => reject(new Error("Request timed out")));
    });

    let htmlString = "";

    res_1.on("data", (chunk) => htmlString += chunk.toString());
    await once(res_1, "end");

    if (
      Math.trunc(res_1.statusCode / 300) === 1 &&
      res_1.headers.location &&
      res_1.headers.location === "/main/Authentication/"
    ) {
      throw new Error("Session has expired");
    }

    // get tokens
    const re = /<input +type *= *"hidden" *name *= *"tokens" *value *= *"([0-9]+)" *\/?>/i;
    const match = htmlString.match(re);

    if (!match) {
      throw new Error("tokens not found");
    }

    let reqBody = `tokens=${match[1]}&`;
    
    for (let i = 0; i < courses.length; i++) {
      const course = courses[i];

      const re = new RegExp(
        `c\\[${course.code}_([0-9\\-.]+)\\]" *value *= *"([0-9]+)-([0-9])"[\\s\\S\\n]+<a +.*href *= *"ClassInfo\\?cc=\\2".*>.*[ \\-]${course.class}<\\/a *>`,
        "i"
      );
      const match = htmlString.match(re);

      if (!match) {
        throw new Error("Pattern not found");
      }

      const curriculum = match[1];
      const classId = match[2];
      const credit = match[3];

      reqBody +=
        encodeURIComponent(`c[${course.code}_${curriculum}]`) +
        "=" +
        encodeURIComponent(`${classId}-${credit}`) +
        "&";
    }

    reqBody += "comment=&submit=Simpan+IRS";

    return reqBody;
  },
};
