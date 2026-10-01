import type { VercelRequest, VercelResponse } from "@vercel/node";
import { afterEach, describe, expect, it, vi } from "vitest";
import handler from "./user.js";
import { getUser } from "./_lib/groundspeak.js";
import type { User } from "../src/types.js";

vi.mock("./_lib/groundspeak.js", () => ({
	getUser: vi.fn(),
}));

const mockGetUser = vi.mocked(getUser);

function makeResponse() {
	return {
		setHeader: vi.fn(),
		status: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis(),
	} as unknown as VercelResponse;
}

describe("GET /api/user", () => {
	afterEach(() => {
		vi.clearAllMocks();
		vi.unstubAllEnvs();
	});

	it("sets the HttpOnly userGuid cookie from the authenticated user", async () => {
		vi.stubEnv("GEOCACHING_USER_GUID", "guid-1");
		mockGetUser.mockResolvedValue({
			PublicGuid: "guid-1",
			CanAnswer: false,
		} as User);
		const req = {
			method: "GET",
			headers: { authorization: "Bearer access-token" },
		} as VercelRequest;
		const res = makeResponse();

		await handler(req, res);

		expect(mockGetUser).toHaveBeenCalledWith("access-token");
		expect(res.setHeader).toHaveBeenCalledWith(
			"Set-Cookie",
			expect.stringContaining("userGuid=guid-1"),
		);
		const cookie = vi.mocked(res.setHeader).mock.calls[0][1] as string;
		expect(cookie).toContain("HttpOnly");
		expect(cookie).toContain("Secure");
		expect(cookie).toContain("SameSite=Lax");
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({ PublicGuid: "guid-1", CanAnswer: true }),
		);
	});
});
