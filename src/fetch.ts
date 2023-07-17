/**
 * Fetch API wrapping libsoup 3.x.
 * 
 * This library trys to recreate the Web Fetch API in gjs, but 1:1 simulation is not the goal.
 * The main goal is improve the UX for libsoup.
 * 
 * SPDX: Apache-2.0
 */
import Soup from "gi://Soup?version=3.0";
import GLib from "gi://GLib?version=2.0";
import Gio from "gi://Gio?version=2.0";
import { createContext, useContext } from "./index.js";

type RequestCacheType = "default" | "reload" | "no-cache";

type Body =
    | Gio.InputStream
    | null
    | ArrayBuffer
    | DataView
    | Uint8Array
    | Uint8ClampedArray
    | string
    | undefined;

type AnyHeaders =
    | Soup.MessageHeaders
    | Record<string, string>
    | [string, string][];

type RequestOptions = {
    readonly body?: Body;
    readonly cache?: RequestCacheType;
    readonly headers?:
        | Soup.MessageHeaders
        | Record<string, string>
        | [string, string][];
    readonly integrity?: string;
    readonly method?: string;
    readonly redirect?: boolean;
};

function inputStreamAdapter(
    body?: Body
): [Gio.InputStream | null, number | null] {
    if (typeof body == "string") {
        const chunk = new TextEncoder().encode(body);
        return [
            Gio.MemoryInputStream.new_from_data(chunk, null),
            chunk.byteLength,
        ];
    } else if (body instanceof ArrayBuffer) {
        const chunk = new Uint8Array(body);
        return [
            Gio.MemoryInputStream.new_from_data(chunk, null),
            chunk.byteLength,
        ];
    } else if (body instanceof DataView) {
        const chunk = new Uint8Array(body.buffer.slice(body.byteOffset));
        return [
            Gio.MemoryInputStream.new_from_data(chunk, null),
            chunk.byteLength,
        ];
    } else if (body instanceof Uint8Array) {
        return [
            Gio.MemoryInputStream.new_from_data(body, null),
            body.byteLength,
        ];
    } else if (body instanceof Uint8ClampedArray) {
        const chunk = new Uint8Array(body);
        return [
            Gio.MemoryInputStream.new_from_data(chunk, null),
            chunk.byteLength,
        ];
    } else if (body != null) {
        return [body, null];
    } else {
        return [null, null];
    }
}

function headersAdapter(
    headers: AnyHeaders | undefined,
    defaultType: Soup.MessageHeadersType
) {
    if (headers instanceof Soup.MessageHeaders) {
        return headers;
    } else if (Array.isArray(headers)) {
        const h = new Soup.MessageHeaders(defaultType);
        for (const [name, value] of headers) {
            h.append(name, value);
        }
        return h;
    } else if (typeof headers != "undefined") {
        const h = new Soup.MessageHeaders(defaultType);
        for (const name in headers) {
            h.append(name, headers[name]);
        }
        return h;
    } else {
        return new Soup.MessageHeaders(defaultType);
    }
}

export class NetworkError extends Error {
    inner?: unknown;

    constructor(message?: string, inner?: unknown) {
        super(message);
        this.inner = inner;
    }
}

export class Request {
    readonly body: Gio.InputStream | null;
    readonly bodyLength: number | null;
    private _bodyUsed: boolean = false;
    readonly cache: RequestCacheType;
    readonly headers: Soup.MessageHeaders;
    readonly integrity: string;
    readonly method: string;
    readonly redirect: boolean;
    readonly url!: string;

    constructor(input: Request | string | GLib.Uri, options?: RequestOptions) {
        if (input instanceof Request) {
            Object.assign(this, input);
        } else if (typeof input === "string") {
            this.url = input;
        } else {
            const url = input.to_string();
            if (url == null) {
                throw new TypeError("url is not available");
            }
            this.url = url;
        }
        const { cache, integrity, method, redirect, body, headers } =
            options || {};
        this.method = method ?? "GET";
        this.cache = cache ?? "default";
        this.integrity = integrity ?? "";
        this.redirect = redirect ?? true;
        this.headers = headersAdapter(headers, Soup.MessageHeadersType.REQUEST);
        {
            const [inputStream, bodyLength] = inputStreamAdapter(body);
            this.body = inputStream;
            this.bodyLength = bodyLength;
        }
    }

    get bodyUsed() {
        return this._bodyUsed;
    }

    setBodyUsed() {
        this._bodyUsed = true;
    }
}

type ResponseOpts = {
    status?: number;
    statusText?: string;
    headers?: AnyHeaders;
    url?: string;
};

export class Response {
    private _body: Gio.InputStream | null;
    private _bodyUsed: boolean = false;
    readonly headers: Soup.MessageHeaders;
    readonly status: number;
    readonly statusText: string;
    readonly url: string;

    /**
     * Create a `Response`.
     *
     * @param body will be transformed into {@link Gio.InputStream}.
     * @param opts
     */
    constructor(body?: Body, opts?: ResponseOpts) {
        const [receivedBody] = inputStreamAdapter(body);
        this._body = receivedBody;
        this.headers = headersAdapter(
            opts?.headers,
            Soup.MessageHeadersType.RESPONSE
        );
        this.status = opts?.status ?? 200;
        this.statusText = opts?.statusText ?? "OK";
        this.url = opts?.url ?? "";
    }

    get body() {
        this._bodyUsed = true;
        return this._body;
    }

    get bodyUsed() {
        return this._bodyUsed;
    }

    get ok() {
        return !(this.status < 200 || this.status > 299);
    }

    arrayBuffer(): Promise<ArrayBuffer> {
        if (!this._body) {
            throw new TypeError("no body available");
        }
        const contentLength = this.headers.get_content_length();
        let buffer =
            contentLength > 0
                ? new Uint8Array(contentLength)
                : new Uint8Array(4096);
        let offset = 0;
        return new Promise((resolve, reject) => {
            const readOnce = () => {
                this.body!.read_bytes_async(
                    4096,
                    GLib.PRIORITY_DEFAULT,
                    null,
                    (input, res) => {
                        try {
                            const bytes = input.read_bytes_finish(res);
                            if (bytes.get_size() > 0) {
                                const data = bytes.get_data() as Uint8Array; // data is non-null if size > 0
                                if (buffer.length - offset < data.length) {
                                    const newLength =
                                        buffer.length * 2 + data.length; // Make sure new buffer can store the data
                                    const newBuffer = new Uint8Array(newLength);
                                    newBuffer.set(buffer, 0);
                                    buffer = newBuffer;
                                }
                                buffer.set(data, offset);
                                offset += data.length;
                                setTimeout(readOnce, 0);
                            } else {
                                resolve(buffer.buffer.slice(0, offset));
                                this.body!.close_async(
                                    GLib.PRIORITY_DEFAULT_IDLE,
                                    null,
                                    (input, res) => input.close_finish(res)
                                );
                            }
                        } catch (e) {
                            reject(e);
                        }
                    }
                );
            };
            readOnce();
        });
    }

    async text() {
        const buffer = await this.arrayBuffer();
        const charset = this.headers.get_one("Charset") ?? undefined;
        const decoder = new TextDecoder(charset as TextDecoderEncoding | undefined);
        return decoder.decode(new Uint8Array(buffer));
    }

    async json() {
        const text = await this.text();
        return JSON.parse(text);
    }

    /**
     * Make an object.
     * The `body` is a {@link Gio.InputStream}.
     * @returns
     */
    toJSON() {
        const headers: [string | null, string | null][] = [];
        this.headers.foreach((name, value) => headers.push([name, value]));
        return {
            body: this._body,
            bodyUsed: this.bodyUsed,
            headers: headers,
            status: this.status,
            statusText: this.statusText,
            ok: this.ok,
            url: this.url,
        };
    }

    toString() {
        return String(this.toJSON());
    }
}

type FetchOpts = {} & RequestOptions;

function fillSoupRequest(request: Request, target: Soup.Message) {
    target.set_uri(GLib.Uri.parse(request.url, GLib.UriFlags.NONE));
    target.set_method(request.method);
    if (request.bodyUsed) {
        target.set_request_body(
            null,
            request.body,
            request.bodyLength != null ? request.bodyLength : -1
        );
    }
    const target_headers = target.get_request_headers();
    request.headers.foreach((name, value) => {
        target_headers.replace(name, value);
    });
    if (!request.redirect) {
        target.add_flags(Soup.MessageFlags.NO_REDIRECT);
    }
    return target;
}

export class Client {
    soup: Soup.Session;
    name?: string;
    constructor(soup?: Soup.Session, opts?: { name?: string }) {
        this.soup = soup ?? new Soup.Session();
        this.name = opts?.name;
    }

    fetch(
        resource: string | GLib.Uri | Request,
        opts?: FetchOpts
    ): Promise<Response> {
        return new Promise((resolve, reject) => {
            const request = new Request(resource, opts);
            const message = fillSoupRequest(request, new Soup.Message());
            request.setBodyUsed();
            this.soup.send_async(
                message,
                GLib.PRIORITY_DEFAULT,
                null,
                (session, result) => {
                    try {
                        const body = session.send_finish(result);
                        const url = message.get_uri().to_string() as string;
                        resolve(
                            new Response(body, {
                                url,
                                status: message.get_status(),
                                statusText:
                                    message.get_reason_phrase() ?? undefined,
                                headers: message.get_response_headers(),
                            })
                        );
                    } catch (e) {
                        reject(new NetworkError(String(e), e));
                    }
                }
            );
        });
    }
}

export const ClientContext = /* @__PURE__ */ createContext<Client>();

export function useClient() {
    const context = useContext(ClientContext);
    if (context) {
        return context;
    } else {
        throw new ReferenceError("no client context provided");
    }
}

/**
 * Fetch content using the client from {@link ClientContext}.
 * @param resource
 * @param opts
 * @returns
 */
export function fetch(resource: string | GLib.Uri | Request, opts?: FetchOpts) {
    const client = useClient();
    return client.fetch(resource, opts);
}
