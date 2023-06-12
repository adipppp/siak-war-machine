module.exports = {
  async loginToSIAK(page) {
    try {
      await page.goto("https://academic.ui.ac.id/main/Authentication/");
      const u = await page.waitForSelector("#u");
      await u.type(process.env.USERNAME);
      const p = await page.waitForSelector(
        "#login > form > p:nth-child(2) > input"
      );
      await p.type(process.env.PASSWORD);
      await page.$eval("#submit > input[type=submit]", (loginButton) =>
        loginButton.click()
      );
    } catch (err) {
      console.error(err);
    }
  },
};
