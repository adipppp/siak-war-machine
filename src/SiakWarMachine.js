const { EventEmitter } = require("events");
const { changeRole } = require("./functions/changeRole");
const { doneCoursePlan } = require("./functions/doneCoursePlan");
const { getConfig } = require("./functions/getConfig");
const { login } = require("./functions/login");
const { logout } = require("./functions/logout");
const { saveCoursePlan } = require("./functions/saveCoursePlan");
const { scrapeCoursePlanEdit } = require("./functions/scrapeCoursePlanEdit");

class SiakWarMachine {
    #emitter;
    #configData;
    #cookies;
    #reqBody;
    #progress;
    #isRunning;

    constructor() {
        this.#emitter = new EventEmitter();
        this.#configData = null;
        this.#cookies = null;
        this.#reqBody = null;
        this.#progress = null;
        this.#isRunning = false;
        this.#attachListeners();
    }

    #attachListeners() {
        this.#emitter.on("getConfig", this.#handleGetConfig.bind(this));
        this.#emitter.on("login", this.#handleLogin.bind(this));
        this.#emitter.on("changeRole", this.#handleChangeRole.bind(this));
        this.#emitter.on(
            "scrapeCoursePlanEdit",
            this.#handleScrapeCoursePlanEdit.bind(this)
        );
        this.#emitter.on(
            "saveCoursePlan",
            this.#handleSaveCoursePlan.bind(this)
        );
        this.#emitter.on(
            "doneCoursePlan",
            this.#handleDoneCoursePlan.bind(this)
        );
        this.#emitter.on("logout", this.#handleLogout.bind(this));
        this.#emitter.on("finish", this.#handleFinish.bind(this));
        this.#emitter.on("error", this.#handleError.bind(this));
    }

    async #handleGetConfig() {
        const start = Date.now();

        console.log("Reading config.json...");

        try {
            this.#configData = await getConfig();
        } catch (err) {
            this.#emitter.emit("error", err);
            return;
        }

        console.log(`Done (${Date.now() - start} ms)`);

        this.#progress = "getConfig";
        this.#emitter.emit("login");
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
                    this.#emitter.emit("login");
                    break;
                default:
                    this.#emitter.emit("error", err);
            }
            return;
        }

        console.log(`Done (${Date.now() - start} ms)`);

        this.#progress = "login";
        this.#emitter.emit("changeRole");
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
                    this.#emitter.emit("login");
                    break;
                case "Session has expired":
                    console.error(err);
                    console.log("Reattempting to log in...");
                    this.#emitter.emit("login");
                    break;
                case "Request timed out":
                    console.error(err);
                    console.log("Reattempting to change role...");
                    this.#emitter.emit("changeRole");
                    break;
                default:
                    this.#emitter.emit("error", err);
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
            this.#emitter.emit(before);
        } else {
            this.#progress = "changeRole";
            this.#emitter.emit("scrapeCoursePlanEdit");
        }
    }

    async #handleScrapeCoursePlanEdit() {
        const start = Date.now();

        console.log("Sending requests...");

        try {
            reqBody = await scrapeCoursePlanEdit(
                this.#cookies,
                this.#configData
            );
        } catch (err) {
            switch (err.message) {
                case "Mojavi or siakng_cc cookie not found":
                    console.error(err);
                    console.log("Reattempting to log in...");
                    this.#emitter.emit("login");
                    break;
                case "Session has expired":
                    console.error(err);
                    console.log("Reattempting to log in...");
                    this.#emitter.emit("login");
                    break;
                case "Request timed out":
                    console.error(err);
                    console.log("Reattempting to send requests...");
                    this.#emitter.emit("scrapeCoursePlanEdit");
                    break;
                default:
                    this.#emitter.emit("error", err);
            }
            return;
        }

        console.log(`Done (${Date.now() - start} ms)`);

        this.#progress = "scrapeCoursePlanEdit";
        this.#emitter.emit("saveCoursePlan");
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
                    this.#emitter.emit("login");
                    break;
                case "Session has expired":
                    console.error(err);
                    console.log("Reattempting to log in...");
                    this.#emitter.emit("login");
                    break;
                case "Request timed out":
                    console.error(err);
                    console.log("Reattempting to save course plan...");
                    this.#emitter.emit("saveCoursePlan");
                    break;
                default:
                    this.#emitter.emit("error", err);
            }
            return;
        }

        console.log(`Done (${Date.now() - start} ms)`);

        this.#progress = "saveCoursePlan";
        this.#emitter.emit("doneCoursePlan");
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
                    this.#emitter.emit("login");
                    break;
                case "Session has expired":
                    console.error(err);
                    console.log("Reattempting to log in...");
                    this.#emitter.emit("login");
                    break;
                case "Request timed out":
                    console.error(err);
                    console.log("Reattempting to send request...");
                    this.#emitter.emit("doneCoursePlan");
                    break;
                default:
                    this.#emitter.emit("error", err);
            }
            return;
        }

        console.log(`Done (${Date.now() - start} ms)`);

        this.#progress = "doneCoursePlan";
        this.#emitter.emit("logout");
    }

    async #handleLogout(err) {
        const start = Date.now();

        console.log("Logging out...");

        await logout(this.#cookies);

        console.log(`Done (${Date.now() - start} ms)`);

        if (err) return;

        this.#progress = "logout";
        this.#emitter.emit("finish");
    }

    #handleFinish() {
        this.#progress = "finish";
        this.#isRunning = false;
    }

    #handleError(err) {
        if (this.#progress !== "getConfig" && this.#progress !== null) {
            this.#emitter.emit("logout", err);
        }
        this.#isRunning = false;
        console.error(err);
    }

    run() {
        if (this.#isRunning) return;

        this.#isRunning = true;

        this.#configData = null;
        this.#cookies = null;
        this.#reqBody = null;
        this.#progress = null;

        if (!process.env.USERNAME_SSO || !process.env.PASSWORD_SSO) {
            throw new Error(
                "Environment variable $USERNAME_SSO or $PASSWORD_SSO not found"
            );
        }

        this.#emitter.emit("getConfig");
    }
}

module.exports = { SiakWarMachine };
