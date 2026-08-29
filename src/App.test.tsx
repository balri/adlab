import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

function renderApp(initialEntries: string[] = ["/"]) {
	return render(
		<MemoryRouter initialEntries={initialEntries}>
			<App />
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
	});

	afterEach(() => {
		sessionStorage.clear();
	});

	it("renders the app title as a link to the home page", () => {
		renderApp();
		expect(
			screen.getByRole("link", { name: "Adventure Lab Finder" }),
		).toHaveAttribute("href", "/");
	});

	it("renders the search page on the home route", () => {
		renderApp(["/"]);
		expect(
			screen.getByRole("button", { name: "Search" }),
		).toBeInTheDocument();
	});

	it("redirects to the login page when not authenticated", () => {
		sessionStorage.clear();
		renderApp(["/"]);
		expect(
			screen.getByRole("heading", { name: "Login" }),
		).toBeInTheDocument();
	});

	it("shows a log out link when authenticated", () => {
		renderApp();
		expect(
			screen.getByRole("button", { name: "Log out" }),
		).toBeInTheDocument();
	});

	it("does not show a log out link when not authenticated", () => {
		sessionStorage.clear();
		renderApp(["/"]);
		expect(
			screen.queryByRole("button", { name: "Log out" }),
		).not.toBeInTheDocument();
	});

	it("clears the session and redirects to login when logging out", () => {
		renderApp();
		fireEvent.click(screen.getByRole("button", { name: "Log out" }));

		expect(sessionStorage.getItem("accessToken")).toBeNull();
		expect(
			screen.getByRole("heading", { name: "Login" }),
		).toBeInTheDocument();
	});
});
