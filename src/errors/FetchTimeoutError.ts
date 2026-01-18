export class FetchTimeoutError extends Error {
    constructor(timeout: number) {
        super(`Request timed out after ${timeout}ms`);
        this.name = "FetchTimeoutError";
    }
}
