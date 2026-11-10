import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import BackLink from "./BackLink";

function renderBackLink(hasInAppHistory: boolean) {
	return render(
		<MemoryRouter
			initialEntries={[
				"/previous",
				{
					pathname: "/current",
					state: hasInAppHistory ? { inAppNavigation: true } : null,
				},
			]}
			initialIndex={1}
		>
			<Routes>
				<Route path="/previous" element={<p>Previous route</p>} />
				<Route
					path="/current"
					element={<BackLink to="/fallback">Back</BackLink>}
				/>
				<Route path="/fallback" element={<p>Fallback route</p>} />
			</Routes>
		</MemoryRouter>,
	);
}

describe("BackLink", () => {
	it("follows its fallback when the page was not reached in-app", () => {
		renderBackLink(false);

		fireEvent.click(screen.getByRole("link", { name: "Back" }));

		expect(screen.getByText("Fallback route")).toBeInTheDocument();
	});

	it("uses browser history when reached through an in-app link", () => {
		renderBackLink(true);

		fireEvent.click(screen.getByRole("link", { name: "Back" }));

		expect(screen.getByText("Previous route")).toBeInTheDocument();
		expect(screen.queryByText("Fallback route")).not.toBeInTheDocument();
	});
});
