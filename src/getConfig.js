const fs = require("fs/promises");
const path = require("path");

module.exports = {
  async getInfo() {
    const filePath = path.join(__dirname, "..", "config.json");
    const data = await fs.readFile(filePath);

    const retval = JSON.parse(data);

    return retval;
  },
};
