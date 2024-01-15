require("dotenv").config();
const puppeteer = require("puppeteer-core");
const readline = require("readline");
const { loginToSIAK } = require("./functions");

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  process.once("exit", () => rl.close());

  const options = new Set(["x", "l", "i", "r", "lg"]);

  let blockCmd = false; // io-blocking flags
  let blockStdio = false;

  let browser = await puppeteer.launch({
    headless: false,  
    executablePath: process.env.PATH_TO_CHROME_EXE,
  });
  let page = (await browser.pages())[0];

  console.log("---------------------------");
  console.log("Enter:");
  console.log('"l" to login to SIAK-NG');
  console.log('"i" to navigate to IRS page');
  console.log('"r" to reload page');
  console.log('"lg" to logout');
  console.log('"x" to exit this program');
  console.log("---------------------------");
  console.log("Status: Ready");
  console.log("---------------------------");

  rl.on("line", async (input) => {
    if (input === "x") {
      await browser.close();
      process.exit();
    }
    
    process.stdout.moveCursor(0, -1);
    process.stdout.clearLine(0);

    if (!options.has(input)) {
      return;
    }

    if (blockCmd) {
      return;
    }

    blockCmd = true;

    if (!browser.isConnected()) {
      browser = await puppeteer.launch({
        headless: false,  
        executablePath: process.env.PATH_TO_CHROME_EXE,
      });
    }
    if (page.isClosed()) {
      const pages = await browser.pages();
      if (pages.length > 0) {
        page = pages[0];
      } else {
        page = await browser.newPage();
      }
    }

    blockCmd = false;

    if (!blockStdio) {
      process.stdout.moveCursor(0, -2);
      process.stdout.clearLine(0);
      console.log("Status: Processing...");
      process.stdout.moveCursor(0, 1);
    }

    blockStdio = true;

    switch (input) {
      case "l":
        await loginToSIAK(page);
        break;
      case "i":
        await page
          .goto("https://academic.ui.ac.id/main/CoursePlan/CoursePlanEdit")
          .catch(e => null);
        break;
      case "r":
        await page.reload();
        break;
      case "lg":
        await page
          .goto("https://academic.ui.ac.id/main/Authentication/Logout")
          .catch(e => null);
        break;
    }

    if (blockStdio) {
      process.stdout.moveCursor(0, -2)
      process.stdout.clearLine(0);
      console.log("Status: Ready");
      process.stdout.moveCursor(0, 1);
    }

    blockStdio = false;
  });
}

main();
