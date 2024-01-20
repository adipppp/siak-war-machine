const https = require("https");

module.exports = {
  async logout(cookies) {
    const mojaviCookie = cookies.Mojavi;
    const siakngCookie = cookies.siakng_cc;

    const res = await new Promise((resolve, reject) => {
      const req = https.get(
        "https://academic.ui.ac.id/main/Authentication/Logout",
        { headers: { "Cookie": `Mojavi=${mojaviCookie}; siakng_cc=${siakngCookie}` } },
        (res) => resolve(res)
      );
      req.on("error", (err) => reject(err));
    });

    res.resume();
  },
};
