import { ChildProcess } from "child_process";

export interface Course {
    code?: string;
    curriculum?: string;
    classId?: number;
    name?: string;
    credit?: number;
}

export interface ImpersonatedRequestInit {
    method?: string;
    headers?: HeadersInit;
    body?: BodyInit | null;
    waitForBody?: boolean;
    /** Timeout in milliseconds */
    timeout?: number;
}

export interface ImpersonatedResponse {
    statusCode: number;
    statusText: string;
    headers: Headers;
    body?: string;
}

export interface StreamingResponse {
    statusCode: number;
    statusText: string;
    headers: Headers;
    stream: NodeJS.ReadableStream;
    process: ChildProcess;
}

export interface SiakCookies {
    Mojavi: string;
    siakng_cc: string;
    [key: string]: string;
}
