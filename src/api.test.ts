import { getLab, logout, searchLabs } from "./api";

describe("api", () => {
	beforeEach(() => {
		sessionStorage.setItem("accessToken", "test-token");
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		sessionStorage.clear();
	});

	describe("searchLabs", () => {
		it("requests the search endpoint with the given params", async () => {
			const fetchMock = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => [],
			});
			vi.stubGlobal("fetch", fetchMock);

			await searchLabs({
				latitude: -27.5,
				longitude: 153.0,
				radiusInMeters: 20000,
				take: 25,
			});

			expect(fetchMock).toHaveBeenCalledWith(
				"/api/labs/search?lat=-27.5&lng=153&radius=20000&take=25",
				{ headers: { Authorization: "Bearer test-token" } },
			);
		});

		it("resolves with the parsed results", async () => {
			const results = [{ adventureGuid: "abc", title: "Test Lab" }];
			vi.stubGlobal(
				"fetch",
				vi
					.fn()
					.mockResolvedValue({ ok: true, json: async () => results }),
			);

			await expect(
				searchLabs({
					latitude: 0,
					longitude: 0,
					radiusInMeters: 1000,
					take: 10,
				}),
			).resolves.toEqual(results);
		});

		it("throws with the response body when the request fails", async () => {
			vi.stubGlobal(
				"fetch",
				vi.fn().mockResolvedValue({
					ok: false,
					status: 500,
					text: async () => "boom",
				}),
			);

			await expect(
				searchLabs({
					latitude: 0,
					longitude: 0,
					radiusInMeters: 1000,
					take: 10,
				}),
			).rejects.toThrow("failed (500): boom");
		});
	});

	describe("getLab", () => {
		it("requests the encoded lab endpoint", async () => {
			const fetchMock = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ adventureGuid: "abc/def" }),
			});
			vi.stubGlobal("fetch", fetchMock);

			await getLab("abc/def");

			expect(fetchMock).toHaveBeenCalledWith("/api/labs/abc%2Fdef", {
				headers: { Authorization: "Bearer test-token" },
			});
		});
	});

	describe("logout", () => {
		it("clears the stored access token", () => {
			logout();

			expect(sessionStorage.getItem("accessToken")).toBeNull();
		});
	});
});
