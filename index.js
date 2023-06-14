require("dotenv").config();
const puppeteer = require("puppeteer-core");
const readline = require("readline");
const { loginToSIAK } = require("./functions");

main();

async function main() {
  let browser = await puppeteer.launch({
    headless: false,
    executablePath: process.env.PATH_TO_CHROMIUM_EXE,
  });
  let page = await browser.newPage();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  process.once("exit", () => rl.close());

  console.log('Press "l" to login to SIAK-NG, "i" to navigate to IRS page, "r" to reload page, "x" to exit this program');
  console.log("--------------------------------------------------------------------------------------------------------");

  rl.on("line", async (input) => {
    process.stdout.moveCursor(0, -1);
    process.stdout.clearLine(0);

    if (input === "x") process.exit();

    if (!browser.isConnected())
      browser = await puppeteer.launch({
        headless: false,
        executablePath: process.env.PATH_TO_CHROMIUM_EXE,
      });
    if (page.isClosed()) page = await browser.newPage();

    if (input === "l") loginToSIAK(page);
    else if (input === "i")
      page
        .goto("https://academic.ui.ac.id/main/CoursePlan/CoursePlanEdit")
        .catch(e => null);
    else if (input === "r") page.reload();
  });
}
