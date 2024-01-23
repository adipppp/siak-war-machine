require("dotenv").config();
const { getInfo } = require("./src/getConfig");
const { launch } = require("./src/launch");
const { login } = require("./src/login");
const { logout } = require("./src/logout");

async function main() {
  if (!process.env.USERNAME_SSO || !process.env.PASSWORD_SSO) {
    throw new Error("Environment variable $USERNAME_SSO or $PASSWORD_SSO not found");
  }

  let start = Date.now();
  let end;

  const prom_1 = login();
  process.stdout.write("Logging in... ");
  const cookies = await prom_1;

  end = Date.now();

  console.log(`Done (${end - start} ms)`);
  console.log(`Logged in as: ${process.env.USERNAME_SSO}`);

  try {
    start = Date.now();

    const prom_2 = getInfo();
    process.stdout.write("Reading config.json... ");
    const data = await prom_2;

    end = Date.now();

    console.log(`Done (${end - start} ms)`);

    start = Date.now();

    const prom_3 = launch(cookies, data);
    process.stdout.write("Sending requests... ");
    await prom_3;

    end = Date.now();

    console.log(`Done (${end - start} ms)`);
  } finally {
    start = Date.now();

    const prom_4 = logout(cookies);
    process.stdout.write("Logging out... ");
    await prom_4;
    
    end = Date.now();

    console.log(`Done (${end - start} ms)`);
    console.log();
  }
}

main();
