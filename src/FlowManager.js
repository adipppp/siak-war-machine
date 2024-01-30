const { EventEmitter } = require("events");
const { changeRole } = require("./functions/changeRole");
const { doneCoursePlan } = require("./functions/doneCoursePlan");
const { getConfig } = require("./functions/getConfig");
const { login } = require("./functions/login");
const { logout } = require("./functions/logout");
const { saveCoursePlan } = require("./functions/saveCoursePlan");
const { scrapeCoursePlanEdit } = require("./functions/scrapeCoursePlanEdit");

class FlowManager extends EventEmitter {
  #configData;
  #cookies;
  #reqBody;
  #progress;
  #isRunning;

  constructor() {
    super();
    this.#isRunning = false;
  }

  async #handleGetConfig() {
    const start = Date.now();
    
    console.log("Reading config.json...");

    this.#configData = await getConfig();

    console.log(`Done (${Date.now() - start} ms)`);

    this.#progress = "getConfig";
    this.emit("login");
  }

  async #handleLogin() {
    const start = Date.now();

    console.log("Logging in...");

    try {
      this.#cookies = await login();
    } catch (err) {
      switch (err.message) {
        case "Request timed out":
          console.error(err);
          console.log("Reattempting to log in...");
          this.emit("login");
          break;
        default:
          throw err;
      }
      return;
    }

    console.log(`Done (${Date.now() - start} ms)`);

    this.#progress = "login";
    this.emit("changeRole");
  }

  async #handleChangeRole() {
    const start = Date.now();

    try {
      await changeRole(this.#cookies);
    } catch (err) {
      switch (err.message) {
        case "Mojavi or siakng_cc cookie not found":
          console.error(err);
          console.log("Reattempting to log in...");
          this.emit("login");
          break;
        case "Session has expired":
          console.error(err);
          console.log("Reattempting to log in...");
          this.emit("login");
          break;
        case "Request timed out":
          console.error(err);
          console.log("Reattempting to change role...");
          this.emit("changeRole");
          break;
        default:
          this.emit("logout");
          throw err;
      }
      return;
    }

    console.log(`Done (${Date.now() - start} ms)`);
    console.log(`Logged in as: ${process.env.USERNAME_SSO}`);

    if (
      this.#progress === "saveCoursePlan" ||
      this.#progress === "doneCoursePlan"
    ) {
      const before = this.#progress;
      this.#progress = "changeRole";
      this.emit(before);
    } else {
      this.#progress = "changeRole";
      this.emit("scrapeCoursePlanEdit");
    }
  }

  async #handleScrapeCoursePlanEdit() {
    const start = Date.now();

    console.log("Sending requests...");

    try {
      reqBody = await scrapeCoursePlanEdit(this.#cookies, this.#configData);
    } catch (err) {
      switch (err.message) {
        case "Mojavi or siakng_cc cookie not found":
          console.error(err);
          console.log("Reattempting to log in...");
          this.emit("login");
          break;
        case "Session has expired":
          console.error(err);
          console.log("Reattempting to log in...");
          this.emit("login");
          break;
        case "Request timed out":
          console.error(err);
          console.log("Reattempting to send requests...");
          this.emit("scrapeCoursePlanEdit");
          break;
        default:
          this.emit("logout");
          throw err;
      }
    }

    console.log(`Done (${Date.now() - start} ms)`);

    this.#progress = "scrapeCoursePlanEdit";
    this.emit("saveCoursePlan");
  }

  async #handleSaveCoursePlan() {
    const start = Date.now();

    console.log("Saving course plan...");

    try {
      await saveCoursePlan(this.#cookies, this.#reqBody);
    } catch (err) {
      switch (err.message) {
        case "Mojavi or siakng_cc cookie not found":
          console.error(err);
          console.log("Reattempting to log in...");
          this.emit("login");
          break;
        case "Session has expired":
          console.error(err);
          console.log("Reattempting to log in...");
          this.emit("login");
          break;
        case "Request timed out":
          console.error(err);
          console.log("Reattempting to save course plan...");
          this.emit("saveCoursePlan");
          break;
        default:
          this.emit("logout");
          throw err;
      }
      return;
    }

    console.log(`Done (${Date.now() - start} ms)`);

    this.#progress = "saveCoursePlan";
    this.emit("doneCoursePlan");
  }

  async #handleDoneCoursePlan() {
    const start = Date.now();

    try {
      await doneCoursePlan(this.#cookies, this.#reqBody);
    } catch (err) {
      switch (err.message) {
        case "Mojavi or siakng_cc cookie not found":
          console.error(err);
          console.log("Reattempting to log in...");
          this.emit("login");
          break;
        case "Session has expired":
          console.error(err);
          console.log("Reattempting to log in...");
          this.emit("login");
          break;
        case "Request timed out":
          console.error(err);
          console.log("Reattempting to send request...");
          this.emit("doneCoursePlan");
          break;
        default:
          this.emit("logout");
          throw err;
      }
      return;
    }

    console.log(`Done (${Date.now() - start} ms)`);

    this.#progress = "doneCoursePlan";
    this.emit("logout");
  }

  async #handleLogout() {
    const start = Date.now();
    
    console.log("Logging out...");

    await logout(this.#cookies);

    console.log(`Done (${Date.now() - start} ms)`);
    
    this.#progress = "logout";
    this.emit("finish");
  }

  #handleFinish() {
    this.off("getConfig", this.#handleGetConfig);
    this.off("login", this.#handleLogin);
    this.off("changeRole", this.#handleChangeRole);
    this.off("scrapeCoursePlanEdit", this.#handleScrapeCoursePlanEdit);
    this.off("saveCoursePlan", this.#handleSaveCoursePlan);
    this.off("doneCoursePlan", this.#handleDoneCoursePlan);
    this.off("logout", this.#handleLogout);
    this.off("finish", this.#handleFinish);

    this.#progress = "finish";
    this.#isRunning = false;
  }

  async run() {
    if (this.#isRunning) return;

    this.#progress = null;

    this.#isRunning = true;

    if (!process.env.USERNAME_SSO || !process.env.PASSWORD_SSO) {
      throw new Error("Environment variable $USERNAME_SSO or $PASSWORD_SSO not found");
    }

    this.on("getConfig", this.#handleGetConfig);
    this.on("login", this.#handleLogin);
    this.on("changeRole", this.#handleChangeRole);
    this.on("scrapeCoursePlanEdit", this.#handleScrapeCoursePlanEdit);
    this.on("saveCoursePlan", this.#handleSaveCoursePlan);
    this.on("doneCoursePlan", this.#handleDoneCoursePlan);
    this.on("logout", this.#handleLogout);
    this.on("finish", this.#handleFinish);

    this.emit("getConfig");
  }
}

module.exports = { FlowManager };
