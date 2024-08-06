require("dotenv").config();
const { SiakWarMachine } = require("./src/SiakWarMachine");

function main() {
    new SiakWarMachine().run();
}

main();
