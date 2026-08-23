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
		location: { latitude: 0, longitude: 0 },
		stagesTotalCount: 3,
		adventureType: "",
		completionStatus: "NotStarted",
		adventureThemes: [],
		...overrides,
	};
}

function renderResults(labs: LabSummary[]) {
	return render(
		<MemoryRouter>
			<ResultsList labs={labs} />
		</MemoryRouter>,
	);
}

describe("ResultsList", () => {
	it("shows a message when there are no labs", () => {
		renderResults([]);
		expect(
			screen.getByText("No Adventure Labs found in this area."),
		).toBeInTheDocument();
	});

	it("renders a link, rating, and stage count for each lab", () => {
		renderResults([lab()]);

		expect(screen.getByRole("link", { name: "Test Lab" })).toHaveAttribute(
			"href",
			"/labs/guid-1",
		);
		expect(screen.getByText("★ 4.5")).toBeInTheDocument();
		expect(screen.getByText("3 stages")).toBeInTheDocument();
	});

	it("renders one item per lab", () => {
		renderResults([
			lab({ adventureGuid: "guid-1", title: "Lab One" }),
			lab({ adventureGuid: "guid-2", title: "Lab Two" }),
		]);

		expect(screen.getAllByRole("listitem")).toHaveLength(2);
	});
});
