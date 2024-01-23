const { once } = require("events");
const https = require("https");

module.exports = {
  async launch(cookies, data) {
    const mojaviCookie = cookies.Mojavi;
    const siakngCookie = cookies.siakng_cc;

    const res_1 = await new Promise((resolve, reject) => {
      const req = https.get(
        "https://academic.ui.ac.id/main/CoursePlan/CoursePlanEdit",
        { headers: { "Cookie": `Mojavi=${mojaviCookie}; siakng_cc=${siakngCookie}` } },
        (res) => resolve(res)
      );
      req.on("error", (err) => reject(err));
    });

    let htmlString = "";

    res_1.on("data", (chunk) => htmlString += chunk.toString());
    await once(res_1, "end");

    // get tokens
    const re = /<input +type *= *"hidden" *name *= *"tokens" *value *= *"([0-9]+)" *\/?>/i;
    const match = htmlString.match(re);

    if (!match) {
      throw new Error("tokens not found");
    }

    let reqBody = `tokens=${match[1]}&`;

    const courses = data.courses;
    
    for (const course of courses) {
      if (!course.code) {
        throw new Error("Course code not found in the course object");
      }

      if (!course.class) {
        throw new Error(`Course class not found in the course object with code: ${course.code}`);
      }

      const re = new RegExp(
        `c\\[${course.code}_([0-9\\-.]+)\\]" *value *= *"([0-9]+)-([0-9])"[\\s\\S\\n]+<a +.*href *= *"ClassInfo\\?cc=\\2".*>.*[ \\-]${course.class} *.*<\\/a *>`,
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

    const res_2 = await new Promise((resolve, reject) => {
      const req = https.request(
        "https://academic.ui.ac.id/main/CoursePlan/CoursePlanSave",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Cookie": `Mojavi=${mojaviCookie}; siakng_cc=${siakngCookie}`,
          },
        },
        (res) => resolve(res)
      );
      req.on("error", (err) => reject(err));
      req.write(reqBody, "utf-8");
      req.end();
    });

    res_2.resume();

    const res_3 = await new Promise((resolve, reject) => {
      const req = https.get(
        "https://academic.ui.ac.id/main/CoursePlan/CoursePlanDone",
        { headers: { "Cookie": `Mojavi=${mojaviCookie}; siakng_cc=${siakngCookie}` } },
        (res) => resolve(res)
      );
      req.on("error", (err) => reject(err));
    });

    res_3.resume();
  },
};
