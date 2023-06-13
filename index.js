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

  console.log('Press "l" to login to SIAK-NG, "i" to navigate to IRS page, "r" to reload page, "c" to clear console, "x" to exit this program');
  console.log("------------------------------------------------------------------------------------------------------------------------------");

  let cursorLine = 0; // Cursor position counter on the y-axis

  rl.on("line", async (input) => {
    if (input === "x") process.exit();
    else if (input === "c") {
      for (let i = cursorLine - 1; i >= 0; i--) {
        process.stdout.moveCursor(0, -1);
        process.stdout.clearLine(0);
      }
      cursorLine = 0;
      return;
    }

    cursorLine++;

    if (!browser.isConnected())
      browser = await puppeteer.launch({
        headless: false,
        executablePath: process.env.PATH_TO_CHROMIUM_BIN
      });
    if (page.isClosed()) page = await browser.newPage();

    if (input === "l") await loginToSIAK(page);
    else if (input === "i") await page.goto("https://academic.ui.ac.id/main/CoursePlan/CoursePlanEdit");
    else if (input === "r") await page.reload();
  });
}
