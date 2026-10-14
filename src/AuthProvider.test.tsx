import { act, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { AuthProvider } from "./AuthProvider";
import type { User } from "./types";
import { useAuth } from "./useAuth";

function testUser(overrides: Partial<User> = {}): User {
	return {
		Id: "1",
		UserName: "alice",
		PublicGuid: "guid-1",
		Avatar: { AvatarUrl: "" },
		GeocacheFindCount: 0,
		CompletedAdventures: 0,
		StagesCompletedCount: 0,
		StagesHideCount: 0,
		HideCount: 0,
		AdventuresPublicHideCount: 0,
		...overrides,
	};
}

function Consumer() {
	const { user, isAuthenticated, isLoading, login, logout } = useAuth();

	return (
		<div>
			<p>isLoading: {String(isLoading)}</p>
			<p>isAuthenticated: {String(isAuthenticated)}</p>
			<p>user: {user?.UserName ?? "none"}</p>
			<button
				onClick={() =>
					login({ username: "alice", password: "secret" }).catch(
						() => {},
					)
				}
			>
				Log in
			</button>
			<button onClick={logout}>Log out</button>
		</div>
	);
}

function renderConsumer() {
	return render(
		<AuthProvider>
			<Consumer />
		</AuthProvider>,
	);
}

function AuthenticatedFetchConsumer() {
	const { authenticatedFetch, isAuthenticated } = useAuth();
	const [result, setResult] = useState("idle");

	return (
		<div>
			<p>isAuthenticated: {String(isAuthenticated)}</p>
			<p>result: {result}</p>
			<button
				onClick={() => {
					void authenticatedFetch<{ value: string }>("/private")
						.then((data) => setResult(data.value))
						.catch((err: Error) => setResult(err.message));
				}}
			>
				Fetch private
			</button>
		</div>
	);
}

function renderAuthenticatedFetchConsumer() {
	return render(
		<AuthProvider>
			<AuthenticatedFetchConsumer />
		</AuthProvider>,
	);
}

describe("AuthContext", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		localStorage.clear();
	});

	it("throws when useAuth is used outside an AuthProvider", () => {
		const consoleError = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		expect(() => render(<Consumer />)).toThrow(
			"useAuth must be used within an AuthProvider",
		);

		consoleError.mockRestore();
	});

	it("starts unauthenticated when there is no stored session", async () => {
		renderConsumer();

		await waitFor(() =>
			expect(screen.getByText("isLoading: false")).toBeInTheDocument(),
		);
		expect(screen.getByText("isAuthenticated: false")).toBeInTheDocument();
		expect(screen.getByText("user: none")).toBeInTheDocument();
	});

	it("restores the session when a valid access token is stored", async () => {
		localStorage.setItem("accessToken", "test-token");
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => testUser(),
			}),
		);

		renderConsumer();

		await waitFor(() =>
			expect(
				screen.getByText("isAuthenticated: true"),
			).toBeInTheDocument(),
		);
		expect(screen.getByText("user: alice")).toBeInTheDocument();
	});

	it("logs out when the stored access token is no longer valid", async () => {
		localStorage.setItem("accessToken", "stale-token");
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({ ok: false, status: 401 }),
		);

		renderConsumer();

		await waitFor(() =>
			expect(
				screen.getByText("isAuthenticated: false"),
			).toBeInTheDocument(),
		);
		expect(localStorage.getItem("accessToken")).toBeNull();
	});

	it("logs in and stores the session", async () => {
		const fetchMock = vi.fn().mockImplementation((url) => {
			if (url === "/api/login") {
				return Promise.resolve({
					ok: true,
					json: async () => ({
						accessToken: "new-token",
						expiresIn: 3600,
					}),
				});
			}
			return Promise.resolve({ ok: true, json: async () => testUser() });
		});
		vi.stubGlobal("fetch", fetchMock);

		renderConsumer();
		await waitFor(() =>
			expect(screen.getByText("isLoading: false")).toBeInTheDocument(),
		);

		await act(async () => {
			screen.getByRole("button", { name: "Log in" }).click();
		});

		await waitFor(() =>
			expect(
				screen.getByText("isAuthenticated: true"),
			).toBeInTheDocument(),
		);
		expect(screen.getByText("user: alice")).toBeInTheDocument();
		expect(localStorage.getItem("accessToken")).toBe("new-token");
		expect(localStorage.getItem("userGuid")).toBeNull();
	});

	it("throws when login fails and does not store a session", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

		renderConsumer();
		await waitFor(() =>
			expect(screen.getByText("isLoading: false")).toBeInTheDocument(),
		);

		await act(async () => {
			screen.getByRole("button", { name: "Log in" }).click();
		});

		expect(screen.getByText("isAuthenticated: false")).toBeInTheDocument();
		expect(localStorage.getItem("accessToken")).toBeNull();
	});

	it("clears the session on logout", async () => {
		localStorage.setItem("accessToken", "test-token");
		vi.stubGlobal(
			"fetch",
			vi
				.fn()
				.mockResolvedValue({ ok: true, json: async () => testUser() }),
		);

		renderConsumer();
		await waitFor(() =>
			expect(
				screen.getByText("isAuthenticated: true"),
			).toBeInTheDocument(),
		);

		act(() => {
			screen.getByRole("button", { name: "Log out" }).click();
		});

		expect(screen.getByText("isAuthenticated: false")).toBeInTheDocument();
		expect(localStorage.getItem("accessToken")).toBeNull();
	});

	it("refreshes a near-expiry token before making an authenticated request", async () => {
		localStorage.setItem("accessToken", "old-token");
		localStorage.setItem(
			"accessTokenExpiresAt",
			String(Date.now() + 10_000),
		);
		localStorage.setItem("user", JSON.stringify(testUser()));
		const fetchMock = vi.fn().mockImplementation((url) => {
			if (url === "/api/refresh") {
				return Promise.resolve({
					ok: true,
					json: async () => ({
						accessToken: "fresh-token",
						expiresIn: 3600,
					}),
				});
			}
			return Promise.resolve({
				ok: true,
				json: async () => ({ value: "completed" }),
			});
		});
		vi.stubGlobal("fetch", fetchMock);

		renderAuthenticatedFetchConsumer();
		await act(async () => {
			screen.getByRole("button", { name: "Fetch private" }).click();
		});

		expect(screen.getByText("result: completed")).toBeInTheDocument();
		expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/refresh", {
			method: "POST",
		});
		expect(fetchMock).toHaveBeenNthCalledWith(
			2,
			"/private",
			expect.objectContaining({
				headers: expect.objectContaining({
					Authorization: "Bearer fresh-token",
				}),
			}),
		);
		expect(localStorage.getItem("accessToken")).toBe("fresh-token");
	});

	it("clears the session when token refresh fails", async () => {
		localStorage.setItem("accessToken", "old-token");
		localStorage.setItem(
			"accessTokenExpiresAt",
			String(Date.now() + 10_000),
		);
		localStorage.setItem("user", JSON.stringify(testUser()));
		const fetchMock = vi.fn().mockResolvedValue({ ok: false });
		vi.stubGlobal("fetch", fetchMock);

		renderAuthenticatedFetchConsumer();
		await act(async () => {
			screen.getByRole("button", { name: "Fetch private" }).click();
		});

		expect(screen.getByText("result: Session expired")).toBeInTheDocument();
		expect(screen.getByText("isAuthenticated: false")).toBeInTheDocument();
		expect(localStorage.getItem("accessToken")).toBeNull();
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("clears the session when an authenticated request returns 401", async () => {
		localStorage.setItem("accessToken", "valid-token");
		localStorage.setItem(
			"accessTokenExpiresAt",
			String(Date.now() + 60_000),
		);
		localStorage.setItem("user", JSON.stringify(testUser()));
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 401 }));

		renderAuthenticatedFetchConsumer();
		await act(async () => {
			screen.getByRole("button", { name: "Fetch private" }).click();
		});

		expect(screen.getByText("result: Session expired")).toBeInTheDocument();
		expect(screen.getByText("isAuthenticated: false")).toBeInTheDocument();
		expect(localStorage.getItem("accessToken")).toBeNull();
	});

	it("shows the API error message instead of the raw JSON response", async () => {
		localStorage.setItem("accessToken", "valid-token");
		localStorage.setItem(
			"accessTokenExpiresAt",
			String(Date.now() + 60_000),
		);
		localStorage.setItem("user", JSON.stringify(testUser()));
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: false,
				status: 502,
				text: async () =>
					JSON.stringify({
						error: "Service temporarily unavailable",
					}),
			}),
		);

		renderAuthenticatedFetchConsumer();
		await act(async () => {
			screen.getByRole("button", { name: "Fetch private" }).click();
		});

		expect(
			screen.getByText(
				"result: Request to /private failed (502): Service temporarily unavailable",
			),
		).toBeInTheDocument();
		expect(screen.queryByText(/\{"error"/)).not.toBeInTheDocument();
	});
});
