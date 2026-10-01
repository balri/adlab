import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SearchPage from "./SearchPage";
import type { LabSummary } from "../types";
import { useApi } from "../useApi";

vi.mock("../useApi", () => ({
	useApi: vi.fn(),
	searchLabs: vi.fn(),
}));

const mockSearchLabs = vi.fn();

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
	beforeEach(() => {
		sessionStorage.clear();
		vi.clearAllMocks();
		vi.mocked(useApi).mockReturnValue({
			getLab: vi.fn(),
			searchLabs: mockSearchLabs,
			checkAnswer: vi.fn(),
			submitAnswer: vi.fn(),
		});
	});

	it("does not show results before a search is performed", () => {
		renderPage();
		expect(screen.queryByRole("list")).not.toBeInTheDocument();
	});

	it("shows a message when there are no labs", async () => {
		mockSearchLabs.mockResolvedValue([]);
		renderPage();

		fireEvent.click(screen.getByRole("button", { name: "Search" }));

		await waitFor(() =>
			expect(
				screen.getByText("No Adventure Labs found in this area."),
			).toBeInTheDocument(),
		);
	});

	it("shows results and the map once a search resolves", async () => {
		mockSearchLabs.mockResolvedValue([lab()]);
		renderPage();

		fireEvent.click(screen.getByRole("button", { name: "Search" }));

		await waitFor(() =>
			expect(
				screen.getByRole("link", { name: "Test Lab" }),
			).toBeInTheDocument(),
		);
		fireEvent.click(screen.getByRole("button", { name: /Search options/ }));
		expect(screen.getByLabelText("Latitude")).toHaveValue(-27.4);
		expect(screen.getByLabelText("Longitude")).toHaveValue(153);
	});

	it("shows the answer-count disclaimer when results have answer counts", async () => {
		mockSearchLabs.mockResolvedValue([lab({ numAnswers: 2 })]);
		renderPage();

		fireEvent.click(screen.getByRole("button", { name: "Search" }));

		expect(
			await screen.findByText(
				"* Answer counts are a guideline only; actual counts may differ.",
			),
		).toBeInTheDocument();
	});

	it("does not show the answer-count disclaimer when all counts are zero", async () => {
		mockSearchLabs.mockResolvedValue([lab({ numAnswers: 0 })]);
		renderPage();

		fireEvent.click(screen.getByRole("button", { name: "Search" }));

		await screen.findByRole("link", { name: "Test Lab" });
		expect(
			screen.queryByText(/Answer counts are a guideline only/),
		).not.toBeInTheDocument();
	});

	it("shows an error message when the search fails", async () => {
		mockSearchLabs.mockRejectedValue(new Error("Search failed"));
		renderPage();

		fireEvent.click(screen.getByRole("button", { name: "Search" }));

		await waitFor(() =>
			expect(screen.getByText("Search failed")).toBeInTheDocument(),
		);
	});

	it("disables the search button while a search is in flight", async () => {
		let resolveSearch: (labs: LabSummary[]) => void = () => {};
		mockSearchLabs.mockReturnValue(
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

	it("persists search results to sessionStorage once a search resolves", async () => {
		mockSearchLabs.mockResolvedValue([lab()]);
		renderPage();

		fireEvent.click(screen.getByRole("button", { name: "Search" }));

		await waitFor(() =>
			expect(
				screen.getByRole("link", { name: "Test Lab" }),
			).toBeInTheDocument(),
		);
		expect(JSON.parse(sessionStorage.getItem("searchResults")!)).toEqual([
			lab(),
		]);
		expect(sessionStorage.getItem("searchCentre")).not.toBeNull();
	});

	it("restores results from sessionStorage on mount without searching", () => {
		sessionStorage.setItem("searchResults", JSON.stringify([lab()]));
		sessionStorage.setItem(
			"searchCentre",
			JSON.stringify({ latitude: -27.4, longitude: 153.0 }),
		);
		sessionStorage.setItem("searchRadius", JSON.stringify(0));

		renderPage();

		expect(
			screen.getByRole("link", { name: "Test Lab" }),
		).toBeInTheDocument();
		expect(mockSearchLabs).not.toHaveBeenCalled();
	});
});
