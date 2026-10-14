import type { VercelRequest, VercelResponse } from "@vercel/node";
import { afterEach, describe, expect, it, vi } from "vitest";
import handler from "./login.js";

function makeResponse() {
	return {
		setHeader: vi.fn(),
		status: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis(),
	} as unknown as VercelResponse;
}

function makeRequest(method = "POST") {
	return {
		method,
		body: { username: "alice", password: "secret" },
	} as unknown as VercelRequest;
}

describe("POST /api/login", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.unstubAllEnvs();
	});

	it("rejects methods other than POST", async () => {
		const res = makeResponse();

		await handler(makeRequest("GET"), res);

		expect(res.status).toHaveBeenCalledWith(405);
		expect(res.json).toHaveBeenCalledWith({ error: "Method not allowed" });
	});

	it("returns tokens and sets a secure HttpOnly refresh cookie", async () => {
		vi.stubEnv("GEOCACHING_CONSUMER_KEY", "consumer-key");
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				accessToken: "access-token",
				refreshToken: "refresh token",
				expiresIn: 3600,
			}),
		});
		vi.stubGlobal("fetch", fetchMock);
		const res = makeResponse();

		await handler(makeRequest(), res);

		expect(fetchMock).toHaveBeenCalledWith(
			"https://api.groundspeak.com/adventuresmobile/v1/public/accounts/login",
			expect.objectContaining({
				method: "POST",
				body: JSON.stringify({ Username: "alice", Password: "secret" }),
				headers: expect.objectContaining({
					"X-Consumer-Key": "consumer-key",
				}),
			}),
		);
		expect(res.setHeader).toHaveBeenCalledWith(
			"Set-Cookie",
			expect.stringContaining(
				"__Secure-refreshToken=refresh%20token; HttpOnly; Secure; SameSite=Strict; Path=/api/refresh",
			),
		);
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({
			accessToken: "access-token",
			expiresIn: 3600,
		});
	});

	it("returns 401 when the upstream login fails", async () => {
		vi.stubEnv("GEOCACHING_CONSUMER_KEY", "consumer-key");
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
		const res = makeResponse();

		await handler(makeRequest(), res);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({
			error: "Invalid username or password",
		});
	});
});
