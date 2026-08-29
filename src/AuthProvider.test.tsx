import { act, render, screen, waitFor } from "@testing-library/react";
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

describe("AuthContext", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		sessionStorage.clear();
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
		sessionStorage.setItem("accessToken", "test-token");
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
		expect(sessionStorage.getItem("userGuid")).toBe("guid-1");
	});

	it("logs out when the stored access token is no longer valid", async () => {
		sessionStorage.setItem("accessToken", "stale-token");
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
		expect(sessionStorage.getItem("accessToken")).toBeNull();
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
		expect(sessionStorage.getItem("accessToken")).toBe("new-token");
		expect(sessionStorage.getItem("userGuid")).toBe("guid-1");
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
		expect(sessionStorage.getItem("accessToken")).toBeNull();
	});

	it("clears the session on logout", async () => {
		sessionStorage.setItem("accessToken", "test-token");
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
		expect(sessionStorage.getItem("accessToken")).toBeNull();
	});
});
