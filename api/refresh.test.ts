import type { VercelRequest, VercelResponse } from "@vercel/node";
import { afterEach, describe, expect, it, vi } from "vitest";
import handler from "./refresh.js";

function makeResponse() {
	return {
		setHeader: vi.fn(),
		status: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis(),
	} as unknown as VercelResponse;
}

function makeRequest(method = "POST", refreshToken?: string) {
	return {
		method,
		cookies: refreshToken ? { "__Secure-refreshToken": refreshToken } : {},
	} as unknown as VercelRequest;
}

describe("POST /api/refresh", () => {
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

	it("requires a refresh-token cookie", async () => {
		const res = makeResponse();

		await handler(makeRequest(), res);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({ error: "No refresh token" });
	});

	it("returns new tokens and rotates the secure refresh cookie", async () => {
		vi.stubEnv("GEOCACHING_CONSUMER_KEY", "consumer-key");
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				access_token: "new-access-token",
				refresh_token: "new-refresh-token",
				expires_in: 1800,
			}),
		});
		vi.stubGlobal("fetch", fetchMock);
		const res = makeResponse();

		await handler(makeRequest("POST", "current-refresh-token"), res);

		expect(fetchMock).toHaveBeenCalledWith(
			"https://labs-api.geocaching.com/Api/Accounts/RefreshAccessToken?consumerKey=consumer-key",
			expect.objectContaining({
				method: "POST",
				body: JSON.stringify({ RefreshToken: "current-refresh-token" }),
			}),
		);
		expect(res.setHeader).toHaveBeenCalledWith(
			"Set-Cookie",
			expect.stringContaining(
				"__Secure-refreshToken=new-refresh-token; HttpOnly; Secure; SameSite=Strict; Path=/api/refresh",
			),
		);
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({
			accessToken: "new-access-token",
			expiresIn: 1800,
		});
	});

	it("returns 401 when the upstream refresh fails", async () => {
		vi.stubEnv("GEOCACHING_CONSUMER_KEY", "consumer-key");
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
		const res = makeResponse();

		await handler(makeRequest("POST", "expired-refresh-token"), res);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({
			error: "Failed to refresh token",
		});
	});
});
