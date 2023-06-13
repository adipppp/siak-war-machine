module.exports = {
  async loginToSIAK(page) {
    try {
      await page.goto("https://academic.ui.ac.id/main/Authentication/");
      await page.$eval(
        "#u",
        (u, username) => (u.value = username),
        process.env.USERNAME
      );
      await page.$eval(
        "#login > form > p:nth-child(2) > input",
        (pwInput, password) => (pwInput.value = password),
        process.env.PASSWORD
      );
      await page.$eval("#submit > input[type=submit]", (loginButton) =>
        loginButton.click()
      );
    } catch (err) {
      // console.log();
      // console.error(err);
    }
  },
};
