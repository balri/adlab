import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getReviews } from "../../../api/_lib/groundspeak.js";

const previousConsumerKey = process.env.GEOCACHING_CONSUMER_KEY;

describe("getReviews", () => {
	beforeEach(() => {
		process.env.GEOCACHING_CONSUMER_KEY = "test-consumer-key";
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		if (previousConsumerKey === undefined) {
			delete process.env.GEOCACHING_CONSUMER_KEY;
		} else {
			process.env.GEOCACHING_CONSUMER_KEY = previousConsumerKey;
		}
	});

	it("returns reviews and the total count from the paginated response", async () => {
		const reviews = [{ id: "review-1" }];
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: vi.fn().mockResolvedValue({
					totalCount: 1,
					items: reviews,
				}),
			}),
		);

		await expect(getReviews("lab-guid", "access-token")).resolves.toEqual({
			totalCount: 1,
			items: reviews,
		});
	});

	it("requests the requested review page", async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue({ totalCount: 41, items: [] }),
		});
		vi.stubGlobal("fetch", fetchMock);

		await getReviews("lab-guid", "access-token", 20, 20);

		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringContaining("skip=20&take=20"),
			expect.objectContaining({ method: "POST" }),
		);
	});

	it("reports an unexpected response shape", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: vi.fn().mockResolvedValue({ totalCount: 0 }),
			}),
		);

		await expect(getReviews("lab-guid", "access-token")).rejects.toThrow(
			"expected an array or an object with an items array",
		);
	});
});
