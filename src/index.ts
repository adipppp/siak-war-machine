import "dotenv/config";
import { SiakWarMachine } from "./SiakWarMachine";

function main() {
    const instances = 10;

    for (let i = 0; i < instances; i++) {
        new SiakWarMachine(`${i + 1}`).run();
    }
}

main();
