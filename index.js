require("dotenv").config();
const { changeRole } = require("./src/changeRole");
const { doneCoursePlan } = require("./src/doneCoursePlan");
const { getConfig } = require("./src/getConfig");
const { login } = require("./src/login");
const { logout } = require("./src/logout");
const { saveCoursePlan } = require("./src/saveCoursePlan");
const { scrapeCoursePlanEdit } = require("./src/scrapeCoursePlanEdit");

async function main() {
  if (!process.env.USERNAME_SSO || !process.env.PASSWORD_SSO) {
    throw new Error("Environment variable $USERNAME_SSO or $PASSWORD_SSO not found");
  }

  let configData;
  let cookies;
  let reqBody;

  let progress = 0;

  while (true) {
    let start;
    let end;
    
    if (progress === 0) {
      start = Date.now();

      console.log("Reading config.json...");

      configData = await getConfig();

      end = Date.now();
      console.log(`Done (${end - start} ms)`);

      progress++;
    }

    if (progress === 1) {
      start = Date.now();

      console.log("Logging in...");

      try {
        cookies = await login();
      } catch (err) {
        switch (err.message) {
          case "Mojavi or siakng_cc cookie not found":
            console.error(err);
            break;
          default:
            console.error(err);
            console.log("Reattempting to log in...");
            continue;
        }
        break;
      }

      end = Date.now();
      console.log(`Done (${end - start} ms)`);

      progress++;
    }

    if (progress === 2) {
      start = Date.now();

      try {
        await changeRole(cookies);
      } catch (err) {
        switch (err.message) {
          case "Mojavi or siakng_cc cookie not found":
            progress = 1;
            console.error(err);
            console.log("Reattempting to log in...");
            continue;
          case "Session has expired":
            progress = 1;
            console.error(err);
            console.log("Reattempting to log in...");
            continue;
          default:
            console.error(err);
            console.log("Reattempting to change role...");
            continue;
        }
      }

      end = Date.now();
      console.log(`Done (${end - start} ms)`);
      console.log(`Logged in as: ${process.env.USERNAME_SSO}`);

      progress++;
    }

    if (progress === 3) {
      start = Date.now();

      console.log("Sending requests...");

      try {
        reqBody = await scrapeCoursePlanEdit(cookies, configData);
      } catch (err) {
        switch (err.message) {
          case "tokens not found":
            console.error(err);
            break;
          case "Pattern not found":
            console.error(err);
            break;
          case "Mojavi or siakng_cc cookie not found":
            progress = 1;
            console.error(err);
            console.log("Reattempting to log in...");
            continue;
          case "Session has expired":
            progress = 1;
            console.error(err);
            console.log("Reattempting to log in...");
            continue;
          default:
            console.error(err);
            console.log("Reattempting to send requests...");
            continue;
        }
        break;
      }
      
      end = Date.now();
      console.log(`Done (${end - start} ms)`);

      progress++;
    }

    if (progress === 4) {
      start = Date.now();

      console.log("Saving course plan...");

      try {
        await saveCoursePlan(cookies, reqBody);
      } catch (err) {
        switch (err.message) {
          case "Mojavi or siakng_cc cookie not found":
            progress = 1;
            console.error(err);
            console.log("Reattempting to log in...");
            continue;
          case "Session has expired":
            progress = 1;
            console.error(err);
            console.log("Reattempting to log in...");
            continue;
          default:
            console.error(err);
            console.log("Reattempting to save course plan...");
            continue;
        }
      }
      
      end = Date.now();
      console.log(`Done (${end - start} ms)`);

      progress++;
    }

    if (progress === 5) {
      start = Date.now();

      try {
        await doneCoursePlan(cookies, reqBody);
      } catch (err) {
        switch (err.message) {
          case "Mojavi or siakng_cc cookie not found":
            progress = 1;
            console.error(err);
            console.log("Reattempting to log in...");
            continue;
          case "Session has expired":
            progress = 1;
            console.error(err);
            console.log("Reattempting to log in...");
            continue;
          default:
            console.error(err);
            console.log("Reattempting to send request...");
            continue;
        }
      }
    
      end = Date.now();
      console.log(`Done (${end - start} ms)`);

      progress++;
    }

    break;
  }

  if (progress < 2) {
    return;
  }

  console.log("Logging out...");

  start = Date.now();

  try {
    await logout(cookies);
  } catch (err) {
    console.error(err);
  }

  end = Date.now();
  console.log(`Done (${end - start} ms)`);
}

main();
