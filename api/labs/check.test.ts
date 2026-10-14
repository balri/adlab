import type { VercelRequest, VercelResponse } from "@vercel/node";
import { afterEach, describe, expect, it, vi } from "vitest";
import { checkAnswer } from "../_lib/answer.js";
import { upsertAnswer } from "../_lib/database.js";
import handler from "./check.js";

vi.mock("../_lib/answer.js", () => ({
	checkAnswer: vi.fn(),
}));
vi.mock("../_lib/database.js", () => ({
	upsertAnswer: vi.fn(),
}));

const mockCheckAnswer = vi.mocked(checkAnswer);
const mockUpsertAnswer = vi.mocked(upsertAnswer);

function makeResponse() {
	return {
		status: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis(),
	} as unknown as VercelResponse;
}

function makeRequest(overrides: Record<string, unknown> = {}) {
	return {
		method: "POST",
		headers: { authorization: "Bearer access-token" },
		cookies: { userGuid: "user-1" },
		body: {
			adventureGuid: "lab-1",
			stage: { id: "stage-1" },
			answer: "42",
		},
		...overrides,
	} as unknown as VercelRequest;
}

describe("POST /api/labs/check", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("rejects requests without a bearer token", async () => {
		const res = makeResponse();

		await handler(makeRequest({ headers: {} }), res);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(mockCheckAnswer).not.toHaveBeenCalled();
	});

	it("requires the user GUID cookie", async () => {
		const res = makeResponse();

		await handler(makeRequest({ cookies: {} }), res);

		expect(res.status).toHaveBeenCalledWith(404);
		expect(mockCheckAnswer).not.toHaveBeenCalled();
	});

	it("stores a correct answer and returns success", async () => {
		mockCheckAnswer.mockReturnValue(true);
		const req = makeRequest();
		const res = makeResponse();

		await handler(req, res);

		expect(mockCheckAnswer).toHaveBeenCalledWith(
			"user-1",
			req.body.stage,
			"42",
		);
		expect(mockUpsertAnswer).toHaveBeenCalledWith("lab-1", "stage-1", "42");
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({
			success: true,
			message: '"42" is the correct answer',
		});
	});

	it("does not store an incorrect answer", async () => {
		mockCheckAnswer.mockReturnValue(false);
		const res = makeResponse();

		await handler(makeRequest(), res);

		expect(mockUpsertAnswer).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({
			success: false,
			error: '"42" is not the correct answer',
		});
	});

	it("returns a gateway error when persistence fails", async () => {
		mockCheckAnswer.mockReturnValue(true);
		mockUpsertAnswer.mockRejectedValue(new Error("database unavailable"));
		const res = makeResponse();

		await handler(makeRequest(), res);

		expect(res.status).toHaveBeenCalledWith(502);
		expect(res.json).toHaveBeenCalledWith({
			error: "database unavailable",
		});
	});
});
