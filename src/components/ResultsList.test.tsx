import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ResultsList from "./ResultsList";
import type { LabSummary } from "../types";

function lab(overrides: Partial<LabSummary> = {}): LabSummary {
	return {
		adventureGuid: "guid-1",
		title: "Test Lab",
		keyImageUrl: "",
		smartLink: "",
		deepLink: "",
		firebaseDynamicLink: "",
		description: "",
		ownerPublicGuid: "",
		createdUtc: "",
		publishedUtc: "",
		ratingsAverage: 4.5,
		ratingsTotalCount: 10,
		isHighlyRecommended: false,
		location: { latitude: -27.20575, longitude: 153.0761166667 },
		stagesTotalCount: 3,
		adventureType: "Nonsequential",
		completionStatus: "NotStarted",
		adventureThemes: [],
		...overrides,
	};
}

function renderResults(labs: LabSummary[]) {
	return render(
		<MemoryRouter>
			<ResultsList
				labs={labs}
				searchCentre={{ latitude: -27.5, longitude: 153.0 }}
			/>
		</MemoryRouter>,
	);
}

describe("ResultsList", () => {
	it("renders a link, rating, and stage count for each lab", () => {
		renderResults([lab()]);

		expect(screen.getByRole("link", { name: "Test Lab" })).toHaveAttribute(
			"href",
			"/labs/guid-1",
		);
		expect(
			screen.getByText(
				(_, element) =>
					element?.tagName === "SPAN" &&
					element.textContent === "★ 4.5 (10)",
			),
		).not.toHaveClass("lab-review-rating-recommended");
		expect(screen.getByText("3 stages")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Navigate" })).toHaveAttribute(
			"href",
			"https://www.google.com/maps/search/?api=1&query=-27.20575,153.0761166667",
		);
		expect(
			screen.queryByRole("link", { name: "Reviews" }),
		).not.toBeInTheDocument();
	});

	it("highlights ratings for highly recommended labs", () => {
		renderResults([lab({ isHighlyRecommended: true })]);

		expect(
			screen.getByText(
				(_, element) =>
					element?.tagName === "SPAN" &&
					element.textContent === "★ 4.5 (10)",
			),
		).toHaveClass("lab-review-rating-recommended");
	});

	it("renders one item per lab", () => {
		renderResults([
			lab({ adventureGuid: "guid-1", title: "Lab One" }),
			lab({ adventureGuid: "guid-2", title: "Lab Two" }),
		]);

		expect(screen.getAllByRole("listitem")).toHaveLength(2);
	});
});
