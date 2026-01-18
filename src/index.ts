import "dotenv/config";
import { SiakWarMachine } from "./SiakWarMachine";

function main() {
    new SiakWarMachine("SWM-1").run();
}

main();
