import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SearchPage from "./SearchPage";
import { searchLabs } from "../api";
import type { LabSummary } from "../types";

vi.mock("../api", () => ({
	searchLabs: vi.fn(),
}));

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
		ratingsAverage: 4,
		ratingsTotalCount: 1,
		isHighlyRecommended: false,
		location: { latitude: -27.4, longitude: 153.0 },
		stagesTotalCount: 2,
		adventureType: "",
		completionStatus: "NotStarted",
		adventureThemes: [],
		...overrides,
	};
}

function renderPage() {
	return render(
		<MemoryRouter>
			<SearchPage />
		</MemoryRouter>,
	);
}

describe("SearchPage", () => {
	it("does not show results before a search is performed", () => {
		renderPage();
		expect(screen.queryByRole("list")).not.toBeInTheDocument();
	});

	it("shows results and the map once a search resolves", async () => {
		vi.mocked(searchLabs).mockResolvedValue([lab()]);
		renderPage();

		fireEvent.click(screen.getByRole("button", { name: "Search" }));

		await waitFor(() =>
			expect(
				screen.getByRole("link", { name: "Test Lab" }),
			).toBeInTheDocument(),
		);
	});

	it("shows an error message when the search fails", async () => {
		vi.mocked(searchLabs).mockRejectedValue(new Error("Search failed"));
		renderPage();

		fireEvent.click(screen.getByRole("button", { name: "Search" }));

		await waitFor(() =>
			expect(screen.getByText("Search failed")).toBeInTheDocument(),
		);
	});

	it("disables the search button while a search is in flight", async () => {
		let resolveSearch: (labs: LabSummary[]) => void = () => {};
		vi.mocked(searchLabs).mockReturnValue(
			new Promise((resolve) => {
				resolveSearch = resolve;
			}),
		);
		renderPage();

		fireEvent.click(screen.getByRole("button", { name: "Search" }));
		expect(
			screen.getByRole("button", { name: "Searching…" }),
		).toBeDisabled();

		resolveSearch([]);
		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: "Search" }),
			).not.toBeDisabled(),
		);
	});
});
