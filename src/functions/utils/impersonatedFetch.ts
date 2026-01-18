import { spawn } from "child_process";
import {
    ImpersonatedRequestInit,
    ImpersonatedResponse,
    StreamingResponse,
} from "../../types";
import { FetchTimeoutError } from "../../errors";

const httpMethods = new Set([
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "PATCH",
    "HEAD",
    "OPTIONS",
]);

function stringifyURL(input: RequestInfo | URL): string {
    let url;
    if (input instanceof URL) {
        url = input.toString();
    } else if (typeof input === "string") {
        url = input;
    } else {
        url = input.url;
    }

    return url;
}

function addHeadersToArgs(args: string[], headers: HeadersInit) {
    if (headers instanceof Headers) {
        headers.forEach((value, key) => {
            args.push("-H", `${key}: ${value}`);
        });
    } else if (Array.isArray(headers)) {
        headers.forEach(([key, value]) => {
            args.push("-H", `${key}: ${value}`);
        });
    } else {
        for (const key in headers) {
            const value = headers[key];
            if (Array.isArray(value)) {
                value.forEach((v) => {
                    args.push("-H", `${key}: ${v}`);
                });
            } else {
                args.push("-H", `${key}: ${value}`);
            }
        }
    }
}

function addBodyToArgs(args: string[], body: BodyInit) {
    if (typeof body !== "string") {
        throw new Error(
            "Only string bodies are supported in impersonatedFetch",
        );
    }
    args.push("-d", body);
}

function parseHeaders(buf: Buffer): Headers {
    const headerSection = buf.toString("utf-8");
    const lines = headerSection.split("\r\n");
    const headers = new Headers();

    // Parse status line (e.g., "HTTP/1.1 200 OK")
    const statusLine = lines[0];
    const statusMatch = statusLine.match(/^HTTP\/[\d.]+\s+(\d+)\s*(.*)/);
    if (statusMatch) {
        headers.set("status", statusMatch[1]);
        headers.set("status-text", statusMatch[2]);
    }

    // Parse headers (starting from line 1)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const colonIndex = line.indexOf(":");
        if (colonIndex === -1) continue;

        const key = line.slice(0, colonIndex).trim();
        const value = line.slice(colonIndex + 1).trim();
        headers.append(key, value);
    }

    return headers;
}

async function parseCurlOutput(
    stream: NodeJS.ReadableStream,
    waitForBody: boolean = true,
): Promise<{
    headers: Headers;
    body?: string;
    remainingStream?: NodeJS.ReadableStream;
}> {
    const separator = Buffer.from("\r\n\r\n");
    const chunks: Buffer[] = [];
    let totalLength = 0;
    let separatorIndex = -1;

    // Read until we find the header/body separator
    for await (const chunk of stream) {
        const buf = chunk as Buffer;
        chunks.push(buf);
        totalLength += buf.length;

        const combined = Buffer.concat(chunks, totalLength);
        separatorIndex = combined.indexOf(separator);

        if (separatorIndex !== -1) {
            const headers = parseHeaders(combined.subarray(0, separatorIndex));
            const bodyStart = separatorIndex + 4;

            if (!waitForBody) {
                // Create a stream that yields remaining buffered data then continues with original stream
                const remainingBuffer = combined.subarray(bodyStart);
                const { Readable } = require("stream");
                const remainingStream = Readable.from(
                    (async function* () {
                        if (remainingBuffer.length > 0) {
                            yield remainingBuffer;
                        }
                        for await (const c of stream) {
                            yield c;
                        }
                    })(),
                );
                return { headers, remainingStream };
            }

            // Continue reading for full body
            const bodyChunks: Buffer[] = [combined.subarray(bodyStart)];
            for await (const c of stream) {
                bodyChunks.push(c as Buffer);
            }
            const body = Buffer.concat(bodyChunks).toString("utf-8");
            return { headers, body };
        }
    }

    // Stream ended without separator - treat all as headers
    const fullBuffer = Buffer.concat(chunks, totalLength);
    const headers = parseHeaders(fullBuffer);
    return { headers };
}

export async function impersonatedFetch(
    input: string | URL,
    options: ImpersonatedRequestInit & { waitForBody: false },
): Promise<StreamingResponse>;
export async function impersonatedFetch(
    input: string | URL,
    options?: ImpersonatedRequestInit,
): Promise<ImpersonatedResponse>;
export async function impersonatedFetch(
    input: string | URL,
    options: ImpersonatedRequestInit = {},
): Promise<ImpersonatedResponse | StreamingResponse> {
    const method = options.method;
    if (typeof method === "string" && !httpMethods.has(method.toUpperCase())) {
        throw new Error(`Unsupported HTTP method: ${method}`);
    }

    const url = stringifyURL(input);

    const args = [
        "-i",
        "-X",
        typeof method === "string" ? method.toUpperCase() : "GET",
        url,
    ];

    const headers = options.headers;
    if (headers !== undefined) {
        addHeadersToArgs(args, headers);
    }

    const body = options.body;
    if (body !== undefined && body !== null) {
        addBodyToArgs(args, body);
    }

    const proc = spawn("curl_ff117", args, { stdio: "pipe" });
    const stdout = proc.stdout!;

    const timeout = options.timeout;
    let timeoutId: NodeJS.Timeout | undefined;

    const parsePromise = parseCurlOutput(stdout, options.waitForBody);

    const resultPromise = timeout
        ? Promise.race([
              parsePromise,
              new Promise<never>((_, reject) => {
                  timeoutId = setTimeout(() => {
                      proc.kill();
                      reject(new FetchTimeoutError(timeout));
                  }, timeout);
              }),
          ])
        : parsePromise;

    let result: Awaited<typeof parsePromise>;
    try {
        result = await resultPromise;
    } finally {
        if (timeoutId) clearTimeout(timeoutId);
    }

    const { headers: resHeaders, body: resBody, remainingStream } = result;

    const statusCode = parseInt(resHeaders.get("status") ?? "200", 10);
    const statusText = resHeaders.get("status-text") ?? "";

    if (options.waitForBody === false) {
        return {
            statusCode,
            statusText,
            headers: resHeaders,
            stream: remainingStream!,
            process: proc,
        };
    }

    return {
        statusCode,
        statusText,
        headers: resHeaders,
        body: resBody,
    };
}
