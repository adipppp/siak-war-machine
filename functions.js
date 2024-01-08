module.exports = {
  async loginToSIAK(page) {
    try {
      await page.goto("https://academic.ui.ac.id/main/Authentication/");
      const p1 = page.$eval(
        "#u",
        (u, username) => u.value = username,
        process.env.USERNAME_SSO
      );
      const p2 = page.$eval(
        "#login > form > p:nth-child(2) > input",
        (pwInput, password) => pwInput.value = password,
        process.env.PASSWORD_SSO
      );
      await Promise.allSettled([p1, p2]);
      await page.$eval(
        "#submit > input[type=submit]",
        (loginButton) => loginButton.click()
      );
    } catch (err) {
      // console.log();
      // console.error(err);
    }
  },
};
