require("dotenv").config();
const { FlowManager } = require("./src/FlowManager");

async function main() {
  await new FlowManager().run();
}

main();
