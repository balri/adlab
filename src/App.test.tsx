import { render, screen } from "@testing-library/react";
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
});
