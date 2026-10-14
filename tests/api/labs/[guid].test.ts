import type { VercelRequest, VercelResponse } from "@vercel/node";
import { afterEach, describe, expect, it, vi } from "vitest";
import { calculateAnswer, checkAnswer } from "../../../api/_lib/answer.js";
import {
	getNumAnswers,
	getStoredAnswers,
	upsertAnswer,
} from "../../../api/_lib/database.js";
import { getAdventure } from "../../../api/_lib/groundspeak.js";
import handler from "../../../api/labs/[guid].js";

vi.mock("../../../api/_lib/answer.js", () => ({
	calculateAnswer: vi.fn(),
	checkAnswer: vi.fn(),
}));
vi.mock("../../../api/_lib/database.js", () => ({
	getNumAnswers: vi.fn(),
	getStoredAnswers: vi.fn(),
	upsertAnswer: vi.fn(),
}));
vi.mock("../../../api/_lib/groundspeak.js", () => ({
	getAdventure: vi.fn(),
}));

const mockCalculateAnswer = vi.mocked(calculateAnswer);
const mockCheckAnswer = vi.mocked(checkAnswer);
const mockGetNumAnswers = vi.mocked(getNumAnswers);
const mockGetStoredAnswers = vi.mocked(getStoredAnswers);
const mockUpsertAnswer = vi.mocked(upsertAnswer);
const mockGetAdventure = vi.mocked(getAdventure);

function makeResponse() {
	return {
		setHeader: vi.fn(),
		status: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis(),
	} as unknown as VercelResponse;
}

function makeRequest(userGuid?: string) {
	return {
		method: "GET",
		headers: { authorization: "Bearer access-token" },
		query: { guid: "lab-1" },
		cookies: userGuid ? { userGuid } : {},
	} as unknown as VercelRequest;
}

function makeLab() {
	return {
		adventureGuid: "lab-1",
		ownerPublicGuid: "owner-1",
		stageSummaries: [{ id: "stage-1", question: "What is the answer?" }],
	};
}

describe("GET /api/labs/[guid] answer caching", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("reuses a stored answer while it remains valid", async () => {
		mockGetAdventure.mockResolvedValue(makeLab() as never);
		mockGetStoredAnswers.mockResolvedValue([
			{ stage_guid: "stage-1", calculated_answer: "stored" },
		] as never);
		mockGetNumAnswers.mockResolvedValue([{ count: "1" }] as never);
		mockCheckAnswer.mockReturnValue(true);
		const res = makeResponse();

		await handler(makeRequest("user-1"), res);

		expect(mockCheckAnswer).toHaveBeenCalledWith(
			"user-1",
			expect.objectContaining({ id: "stage-1" }),
			"stored",
		);
		expect(mockCalculateAnswer).not.toHaveBeenCalled();
		expect(mockUpsertAnswer).not.toHaveBeenCalled();
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({
				stageSummaries: [
					expect.objectContaining({ correctAnswer: "stored" }),
				],
			}),
		);
	});

	it("recalculates and stores a stale answer", async () => {
		mockGetAdventure.mockResolvedValue(makeLab() as never);
		mockGetStoredAnswers.mockResolvedValue([
			{ stage_guid: "stage-1", calculated_answer: "stale" },
		] as never);
		mockGetNumAnswers.mockResolvedValue([{ count: "1" }] as never);
		mockCheckAnswer.mockReturnValue(false);
		mockCalculateAnswer.mockReturnValue("fresh");
		const res = makeResponse();

		await handler(makeRequest("user-1"), res);

		expect(mockCalculateAnswer).toHaveBeenCalledWith(
			"user-1",
			expect.objectContaining({ id: "stage-1" }),
		);
		expect(mockUpsertAnswer).toHaveBeenCalledWith(
			"lab-1",
			"stage-1",
			"fresh",
		);
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({
				stageSummaries: [
					expect.objectContaining({ correctAnswer: "fresh" }),
				],
			}),
		);
	});

	it("does not calculate or disclose answers without a user GUID", async () => {
		mockGetAdventure.mockResolvedValue(makeLab() as never);
		mockGetStoredAnswers.mockResolvedValue([]);
		mockGetNumAnswers.mockResolvedValue([{ count: "0" }] as never);
		const res = makeResponse();

		await handler(makeRequest(), res);

		expect(mockCheckAnswer).not.toHaveBeenCalled();
		expect(mockCalculateAnswer).not.toHaveBeenCalled();
		expect(mockUpsertAnswer).not.toHaveBeenCalled();
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({
				stageSummaries: [
					expect.objectContaining({ correctAnswer: null }),
				],
			}),
		);
	});
});
