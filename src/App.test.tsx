import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./AuthProvider";
import type { User } from "./types";

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

function renderApp(initialEntries: string[] = ["/"]) {
	return render(
		<MemoryRouter initialEntries={initialEntries}>
			<AuthProvider>
				<App />
			</AuthProvider>
		</MemoryRouter>,
	);
}

describe("App", () => {
	beforeEach(() => {
		sessionStorage.setItem("accessToken", "test-token");
		sessionStorage.setItem(
			"accessTokenExpiresAt",
			(Date.now() + 60 * 60 * 1000).toString(),
		);
		vi.stubGlobal(
			"fetch",
			vi
				.fn()
				.mockResolvedValue({ ok: true, json: async () => testUser() }),
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		sessionStorage.clear();
	});

	it("renders the app title as a link to the home page", () => {
		renderApp();
		expect(
			screen.getByRole("link", { name: "Adventure Lab Finder" }),
		).toHaveAttribute("href", "/");
	});

	it("renders the search page on the home route", async () => {
		renderApp(["/"]);
		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: "Search" }),
			).toBeInTheDocument(),
		);
	});

	it("redirects to the login page when not authenticated", () => {
		sessionStorage.clear();
		renderApp(["/"]);
		expect(
			screen.getByRole("heading", { name: "Login" }),
		).toBeInTheDocument();
	});

	it("shows a log out link when authenticated", async () => {
		renderApp();
		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: "Log out" }),
			).toBeInTheDocument(),
		);
	});

	it("does not show a log out link when not authenticated", () => {
		sessionStorage.clear();
		renderApp(["/"]);
		expect(
			screen.queryByRole("button", { name: "Log out" }),
		).not.toBeInTheDocument();
	});

	it("clears the session and redirects to login when logging out", async () => {
		renderApp();
		await waitFor(() => screen.getByRole("button", { name: "Log out" }));
		fireEvent.click(screen.getByRole("button", { name: "Log out" }));

		expect(sessionStorage.getItem("accessToken")).toBeNull();
		expect(
			screen.getByRole("heading", { name: "Login" }),
		).toBeInTheDocument();
	});
});
