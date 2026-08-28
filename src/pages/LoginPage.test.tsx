import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { InitialEntry } from "react-router-dom";
import LoginPage from "./LoginPage";
import { login } from "../api";

vi.mock("../api", () => ({
	login: vi.fn(),
}));

function renderPage(initialEntries: InitialEntry[] = ["/login"]) {
	return render(
		<MemoryRouter initialEntries={initialEntries}>
			<Routes>
				<Route path="/login" element={<LoginPage />} />
				<Route path="/" element={<div>Home page</div>} />
				<Route path="/labs/:guid" element={<div>Lab page</div>} />
			</Routes>
		</MemoryRouter>,
	);
}

function fillForm(username = "alice", password = "secret") {
	fireEvent.change(screen.getByLabelText("Username"), {
		target: { value: username },
	});
	fireEvent.change(screen.getByLabelText("Password"), {
		target: { value: password },
	});
}

describe("LoginPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("logs in and navigates to the home page on success", async () => {
		vi.mocked(login).mockResolvedValue(undefined);
		renderPage();

		fillForm("alice", "secret");
		fireEvent.click(screen.getByRole("button", { name: "Log in" }));

		expect(login).toHaveBeenCalledWith({
			username: "alice",
			password: "secret",
		});
		await waitFor(() =>
			expect(screen.getByText("Home page")).toBeInTheDocument(),
		);
	});

	it("navigates back to the page the user was redirected from", async () => {
		vi.mocked(login).mockResolvedValue(undefined);
		renderPage([
			{
				pathname: "/login",
				state: { from: { pathname: "/labs/guid-1" } },
			},
		]);

		fillForm();
		fireEvent.click(screen.getByRole("button", { name: "Log in" }));

		await waitFor(() =>
			expect(screen.getByText("Lab page")).toBeInTheDocument(),
		);
	});

	it("shows an error message when login fails", async () => {
		vi.mocked(login).mockRejectedValue(new Error("Invalid login"));
		renderPage();

		fillForm();
		fireEvent.click(screen.getByRole("button", { name: "Log in" }));

		await waitFor(() =>
			expect(screen.getByText("Invalid login")).toBeInTheDocument(),
		);
	});

	it("disables the submit button while logging in", async () => {
		let resolveLogin: () => void = () => {};
		vi.mocked(login).mockReturnValue(
			new Promise((resolve) => {
				resolveLogin = resolve;
			}),
		);
		renderPage();

		fillForm();
		fireEvent.click(screen.getByRole("button", { name: "Log in" }));
		expect(
			screen.getByRole("button", { name: "Logging in..." }),
		).toBeDisabled();

		resolveLogin();
		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: "Log in" }),
			).not.toBeDisabled(),
		);
	});
});
