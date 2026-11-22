import type { VercelRequest, VercelResponse } from "@vercel/node";
import { afterEach, describe, expect, it, vi } from "vitest";
import handler from "../../api/login.js";

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
					"X-Consumer-Key": "A01A9CA1-29E0-46BD-A270-9D894A527B91",
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

	it("uses the Apple platform headers for Apple requests", async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				accessToken: "access-token",
				refreshToken: "refresh-token",
				expiresIn: 3600,
			}),
		});
		vi.stubGlobal("fetch", fetchMock);
		const res = makeResponse();
		const req = {
			...makeRequest(),
			headers: {
				"x-adventures-platform": "apple",
			},
		} as unknown as VercelRequest;

		await handler(req, res);

		expect(fetchMock).toHaveBeenCalledWith(
			"https://api.groundspeak.com/adventuresmobile/v1/public/accounts/login",
			expect.objectContaining({
				headers: expect.objectContaining({
					"User-Agent": "Adventures/1.56.0 (4936) (ios/17.0)",
					"X-Consumer-Key": "1301D998-6435-4804-8CA8-9A5DE607269A",
				}),
			}),
		);
	});

	it("returns 401 when the upstream login fails", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
		const res = makeResponse();

		await handler(makeRequest(), res);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({
			error: "Invalid username or password",
		});
	});
});
