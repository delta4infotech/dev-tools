import { once } from "node:events";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach } from "vitest";

/** What a mock route answers with. */
export interface Reply {
    status?: number;
    headers?: Record<string, string | string[]>;
    body?: string | Buffer;
    /** Accept the request and never answer. */
    hang?: boolean;
    /** Close the connection without answering. */
    drop?: boolean;
}

export interface Received {
    method: string;
    path: string;
    headers: http.IncomingHttpHeaders;
    body: string;
}

const servers: http.Server[] = [];

afterEach(async () => {
    await Promise.all(
        servers.splice(0).map(
            (server) =>
                new Promise<void>((resolve) => {
                    server.closeAllConnections();
                    server.close(() => resolve());
                })
        )
    );
});

/**
 * A local HTTP server answering each path from `routes` (anything else is a
 * 404) and recording every request it gets.
 */
export async function mockSite(routes: Record<string, Reply>) {
    const received: Received[] = [];
    const server = http.createServer((request, response) => {
        let body = "";
        request.on("data", (chunk) => (body += chunk));
        request.on("end", () => {
            received.push({ method: request.method!, path: request.url!, headers: request.headers, body });
            const reply = routes[new URL(request.url!, "http://mock").pathname] ?? { status: 404, body: "Not found" };
            if (reply.drop) return request.socket.destroy();
            if (reply.hang) return;
            response.writeHead(reply.status ?? 200, { "Content-Type": "text/html; charset=utf-8", ...reply.headers });
            response.end(reply.body ?? "");
        });
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    servers.push(server);

    const { port } = server.address() as AddressInfo;
    return { url: `http://127.0.0.1:${port}/`, host: `127.0.0.1:${port}`, received };
}

export const html = (head: string, body = "<p>Hello</p>") =>
    `<!doctype html><html><head><title>Test site</title>${head}</head><body>${body}</body></html>`;
