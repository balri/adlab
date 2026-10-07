import type { VercelRequest, VercelResponse } from "@vercel/node";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	getAdventure,
	searchAdventures,
	submitAnswer,
} from "../_lib/groundspeak.js";
import { getNumAnswers, getStoredAnswers } from "../_lib/database.js";
import detailHandler from "./[guid].js";
import searchHandler from "./search.js";
import submitHandler from "./submit.js";

vi.mock("../_lib/groundspeak.js", () => ({
	getAdventure: vi.fn(),
	searchAdventures: vi.fn(),
	submitAnswer: vi.fn(),
}));
vi.mock("../_lib/database.js", () => ({
	getNumAnswers: vi.fn(),
	getStoredAnswers: vi.fn(),
	upsertAnswer: vi.fn(),
}));

const mockGetAdventure = vi.mocked(getAdventure);
const mockSearchAdventures = vi.mocked(searchAdventures);
const mockSubmitAnswer = vi.mocked(submitAnswer);
const mockGetNumAnswers = vi.mocked(getNumAnswers);
const mockGetStoredAnswers = vi.mocked(getStoredAnswers);

function makeResponse() {
	return {
		setHeader: vi.fn(),
		status: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis(),
	} as unknown as VercelResponse;
}

describe("lab handlers use the userGuid cookie", () => {
	afterEach(() => {
		vi.clearAllMocks();
		vi.unstubAllEnvs();
	});

	it("marks a lab detail as owned by the cookie user", async () => {
		mockGetAdventure.mockResolvedValue({
			adventureGuid: "adventure-1",
			ownerPublicGuid: "guid-1",
			stageSummaries: [],
		} as never);
		mockGetStoredAnswers.mockResolvedValue([]);
		mockGetNumAnswers.mockResolvedValue([{ count: "4" }] as never);
		const req = {
			method: "GET",
			headers: { authorization: "Bearer access-token" },
			query: { guid: "adventure-1" },
			cookies: { userGuid: "guid-1" },
		} as unknown as VercelRequest;
		const res = makeResponse();

		await detailHandler(req, res);

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({
				adventureGuid: "adventure-1",
				ownedByUser: true,
				numAnswers: 4,
				stageSummaries: [],
			}),
		);
	});

	it("marks search results owned by the cookie user", async () => {
		mockGetNumAnswers.mockImplementation(
			async (guid) =>
				[{ count: guid === "adventure-1" ? "3" : "0" }] as never,
		);
		mockSearchAdventures.mockResolvedValue({
			totalCount: 2,
			items: [
				{ adventureGuid: "adventure-1", ownerPublicGuid: "guid-1" },
				{ adventureGuid: "adventure-2", ownerPublicGuid: "guid-2" },
			],
		} as never);
		const req = {
			method: "GET",
			headers: { authorization: "Bearer access-token" },
			query: { lat: "1", lng: "2" },
			cookies: { userGuid: "guid-1" },
		} as unknown as VercelRequest;
		const res = makeResponse();

		await searchHandler(req, res);

		expect(mockGetNumAnswers).toHaveBeenNthCalledWith(1, "adventure-1");
		expect(mockGetNumAnswers).toHaveBeenNthCalledWith(2, "adventure-2");
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith([
			{
				adventureGuid: "adventure-1",
				ownerPublicGuid: "guid-1",
				numAnswers: 3,
				ownedByUser: true,
			},
			{
				adventureGuid: "adventure-2",
				ownerPublicGuid: "guid-2",
				numAnswers: 0,
				ownedByUser: false,
			},
		]);
	});

	it("does not authorize a body userGuid without the matching cookie", async () => {
		vi.stubEnv("GEOCACHING_USER_GUID", "guid-1");
		const req = {
			method: "POST",
			headers: { authorization: "Bearer access-token" },
			cookies: {},
			body: {
				adventureGuid: "adventure-1",
				stageGuid: "stage-1",
				answer: "answer",
				challengeType: "Question",
				userGuid: "guid-1",
			},
		} as unknown as VercelRequest;
		const res = makeResponse();

		await submitHandler(req, res);

		expect(res.status).toHaveBeenCalledWith(403);
		expect(mockSubmitAnswer).not.toHaveBeenCalled();
	});

	it("submits when the cookie identifies the authorized user", async () => {
		vi.stubEnv("GEOCACHING_USER_GUID", "guid-1");
		mockSubmitAnswer.mockResolvedValue({ result: "Success" } as never);
		const req = {
			method: "POST",
			headers: { authorization: "Bearer access-token" },
			cookies: { userGuid: "guid-1" },
			body: {
				adventureGuid: "adventure-1",
				stageGuid: "stage-1",
				answer: "answer",
				challengeType: "Question",
				userGuid: "forged-guid",
			},
		} as unknown as VercelRequest;
		const res = makeResponse();

		await submitHandler(req, res);

		expect(mockSubmitAnswer).toHaveBeenCalledWith(
			{
				AdventureGuid: "adventure-1",
				StageGuid: "stage-1",
				Answer: "answer",
				ChallengeType: "Question",
			},
			"access-token",
		);
		expect(res.status).toHaveBeenCalledWith(200);
	});
});
