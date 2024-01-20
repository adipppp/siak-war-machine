require("dotenv").config();
const { getInfo } = require("./src/getConfig");
const { launch } = require("./src/launch");
const { login } = require("./src/login");
const { logout } = require("./src/logout");

async function main() {
  const cookies = await login();
  console.log("logged in");

  try {
    const data = await getInfo();
    console.log("config read successful");
    await launch(cookies, data);
    console.log("requests sent");
  } finally {
    await logout(cookies);
    console.log("logged out");
    console.log();
  }
}

main();
