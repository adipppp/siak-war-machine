import { EventEmitter } from "events";
import { Client } from "undici";
import {
    changeRole,
    getConfig,
    login,
    logout,
    saveCoursePlan,
    scrapeCoursePlanEdit,
} from "./functions";
import { CustomError, CustomErrorCode } from "./errors";
import { Cookies, Course } from "./types";

const SIAKNG_HOST = process.env.SIAKNG_HOST;

export class SiakWarMachine {
    #id: string;
    #emitter: EventEmitter;
    #configData: Course[] | null;
    #cookies: Cookies | null;
    #reqBody: string | null;
    #progress: string | null;
    #isRunning: boolean;
    #client: Client;

    constructor(id: string) {
        if (SIAKNG_HOST === undefined) {
            throw new CustomError(
                CustomErrorCode.ENV_VARIABLE_NOT_FOUND,
                "Environment variable SIAKNG_HOST not found"
            );
        }

        this.#id = id;
        this.#emitter = new EventEmitter();
        this.#configData = null;
        this.#cookies = null;
        this.#reqBody = null;
        this.#progress = null;
        this.#isRunning = false;
        this.#client = new Client(SIAKNG_HOST);
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
        this.#emitter.on("logout", this.#handleLogout.bind(this));
        this.#emitter.on("finish", this.#handleFinish.bind(this));
        this.#emitter.on("error", this.#handleError.bind(this));
    }

    async #handleGetConfig() {
        const start = Date.now();

        console.log(`[${this.#id}] Reading config.json...`);

        try {
            this.#configData = await getConfig();
        } catch (err) {
            this.#emitter.emit("error", err);
            return;
        }

        console.log(`[${this.#id}] Done (${Date.now() - start} ms)`);

        this.#progress = "getConfig";
        this.#emitter.emit("login");
    }

    async #handleLogin() {
        const start = Date.now();

        console.log(`[${this.#id}] Logging in...`);

        try {
            this.#cookies = await login(this.#client);
        } catch (err) {
            switch (err.message) {
                case "Headers Timeout Error":
                case "Body Timeout Error":
                    console.error(err);
                    console.log(`[${this.#id}] Reattempting to log in...`);
                    this.#emitter.emit("login");
                    break;
                default:
                    this.#emitter.emit("error", err);
            }
            return;
        }

        console.log(`[${this.#id}] Done (${Date.now() - start} ms)`);

        this.#progress = "login";
        this.#emitter.emit("changeRole");
    }

    async #handleChangeRole() {
        const start = Date.now();

        try {
            await changeRole(this.#client, this.#cookies!);
        } catch (err) {
            if (err instanceof CustomError) {
                switch (err.code) {
                    case CustomErrorCode.SESSION_COOKIES_NOT_FOUND:
                    case CustomErrorCode.SESSION_EXPIRED:
                        console.error(err);
                        console.log(`[${this.#id}] Reattempting to log in...`);
                        this.#emitter.emit("login");
                        break;
                    default:
                        this.#emitter.emit("error", err);
                }
            } else {
                switch (err.message) {
                    case "Headers Timeout Error":
                    case "Body Timeout Error":
                        console.error(err);
                        console.log(
                            `[${this.#id}] Reattempting to change role...`
                        );
                        this.#emitter.emit("changeRole");
                        break;
                    default:
                        this.#emitter.emit("error", err);
                }
            }
            return;
        }

        console.log(`[${this.#id}] Done (${Date.now() - start} ms)`);
        console.log(`[${this.#id}] Logged in as: ${process.env.USERNAME_SSO}`);

        this.#progress = "changeRole";
        this.#emitter.emit("scrapeCoursePlanEdit");
    }

    async #handleScrapeCoursePlanEdit() {
        const start = Date.now();

        console.log(`[${this.#id}] Sending requests...`);

        try {
            this.#reqBody = await scrapeCoursePlanEdit(
                this.#client,
                this.#cookies!,
                this.#configData!
            );
        } catch (err) {
            if (err instanceof CustomError) {
                switch (err.code) {
                    case CustomErrorCode.SESSION_COOKIES_NOT_FOUND:
                    case CustomErrorCode.SESSION_EXPIRED:
                        console.error(err);
                        console.log(`[${this.#id}] Reattempting to log in...`);
                        this.#emitter.emit("login");
                        break;
                    case CustomErrorCode.PATTERN_NOT_FOUND:
                    case CustomErrorCode.TOKENS_NOT_FOUND:
                        console.error(err);
                        console.log(
                            `[${this.#id}] Reattempting to send requests...`
                        );
                        this.#emitter.emit("scrapeCoursePlanEdit");
                        break;
                    default:
                        this.#emitter.emit("error", err);
                }
            } else {
                switch (err.message) {
                    case "Headers Timeout Error":
                    case "Body Timeout Error":
                        console.error(err);
                        console.log(
                            `[${this.#id}] Reattempting to send requests...`
                        );
                        this.#emitter.emit("scrapeCoursePlanEdit");
                        break;
                    default:
                        this.#emitter.emit("error", err);
                }
            }
            return;
        }

        console.log(`[${this.#id}] Done (${Date.now() - start} ms)`);

        this.#progress = "scrapeCoursePlanEdit";
        this.#emitter.emit("saveCoursePlan");
    }

    async #handleSaveCoursePlan() {
        const start = Date.now();

        console.log(`[${this.#id}] Saving course plan...`);

        try {
            await saveCoursePlan(this.#client, this.#cookies!, this.#reqBody!);
        } catch (err) {
            if (err instanceof CustomError) {
                switch (err.code) {
                    case CustomErrorCode.SESSION_COOKIES_NOT_FOUND:
                    case CustomErrorCode.SESSION_EXPIRED:
                        console.error(err);
                        console.log(`[${this.#id}] Reattempting to log in...`);
                        this.#emitter.emit("login");
                        break;
                    default:
                        this.#emitter.emit("error", err);
                }
            } else {
                switch (err.message) {
                    case "Headers Timeout Error":
                    case "Body Timeout Error":
                        console.error(err);
                        console.log(
                            `[${this.#id}] Reattempting to save course plan...`
                        );
                        this.#emitter.emit("saveCoursePlan");
                        break;
                    default:
                        this.#emitter.emit("error", err);
                }
            }
            return;
        }

        console.log(`[${this.#id}] Done (${Date.now() - start} ms)`);

        this.#progress = "saveCoursePlan";
        this.#emitter.emit("logout");
    }

    async #handleLogout() {
        const start = Date.now();

        console.log(`[${this.#id}] Logging out...`);

        try {
            await logout(this.#client, this.#cookies!);
        } catch (err) {
            console.error(err);
        }

        console.log(`[${this.#id}] Done (${Date.now() - start} ms)`);

        this.#progress = "logout";
        this.#emitter.emit("finish");
    }

    async #handleFinish() {
        this.#progress = "finish";
        this.#isRunning = false;
        await this.#client.close();
    }

    #handleError(err: Error) {
        if (this.#progress !== "getConfig" && this.#progress !== null) {
            this.#emitter.emit("logout");
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

        this.#emitter.emit("getConfig");
    }
}
