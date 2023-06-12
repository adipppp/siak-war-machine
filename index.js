require("dotenv").config();
const puppeteer = require("puppeteer-core");
const readline = require("readline");
const { loginToSIAK } = require("./functions");

main();

async function main() {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: process.env.PATH_TO_CHROMIUM_BIN,
  });
  const page = await browser.newPage();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  process.once("exit", () => {
    rl.close();
    console.log();
  });

  console.log('Press "l" to login to SIAK-NG, "i" to navigate to IRS page, "r" to reload page, "x" to exit this program');
  console.log("--------------------------------------------------------------------------------------------------------");

  rl.on("line", async (input) => {
    process.stdout.moveCursor(input.length * -1, -1);
    process.stdout.clearLine(0);
    
    switch (input) {
      case "x":
        process.exit();
      case "l":
        await loginToSIAK(page);
        break;
      case "i":
        await page.goto("https://academic.ui.ac.id/main/CoursePlan/CoursePlanEdit");
        break;
      case "r":
        await page.reload();
        break;
    }
  });
}
