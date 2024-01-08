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
  
  let browser = await puppeteer.launch({
    headless: false,  
    executablePath: process.env.PATH_TO_CHROME_EXE,
  });
  let page = (await browser.pages())[0];

  console.log('Enter "l" to login to SIAK-NG, "i" to navigate to IRS page, "r" to reload page, "lg" to logout, "x" to exit this program');
  console.log("------------------------------------------------------------------------------------------------------------------------");

  const options = new Set(["x", "l", "i", "r", "lg"]);
  let blocked = false; // blocking algorithm

  rl.on("line", async input => {
    if (input === "x") {
      process.exit();
    }
    
    process.stdout.moveCursor(0, -1);
    process.stdout.clearLine(0);

    if (!options.has(input)) {
      return;
    }

    if (blocked) {
      return;
    }

    blocked = true;

    if (!browser.isConnected()) {
      browser = await puppeteer.launch({
        headless: false,
        executablePath: process.env.PATH_TO_CHROME_EXE,
      });
    }
    if (page.isClosed()) {
      page = (await browser.pages())[0];
    }

    blocked = false;

    switch (input) {
      case "l":
        loginToSIAK(page);
        break;
      case "i":
        page
          .goto("https://academic.ui.ac.id/main/CoursePlan/CoursePlanEdit")
          .catch(e => null);
        break;
      case "r":
        page.reload();
        break;
      case "lg":
        page
          .goto("https://academic.ui.ac.id/main/Authentication/Logout")
          .catch(e => null);
        break;
    }
  });
}

main();
