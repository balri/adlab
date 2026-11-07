import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SearchPage from "./SearchPage";
import type { LabSummary } from "../types";
import { useApi } from "../useApi";
import { DEFAULT_LATITUDE, DEFAULT_LONGITUDE } from "../utils/loadForm";
import { distanceBetween } from "../utils/distanceBetween";

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
		adventureType: "Nonsequential",
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
			getReviews: vi.fn(),
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
		expect(screen.getByLabelText("Location")).toHaveValue(
			`${DEFAULT_LATITUDE}, ${DEFAULT_LONGITUDE}`,
		);
	});

	it("places collapsed search and sort options alongside each other", async () => {
		mockSearchLabs.mockResolvedValue([lab()]);
		renderPage();

		fireEvent.click(screen.getByRole("button", { name: "Search" }));
		await screen.findByRole("link", { name: "Test Lab" });

		const searchOptions = screen.getByRole("button", {
			name: /Search options/,
		});
		const sortOptions = screen.getByRole("button", {
			name: /Sort options/,
		});
		expect(searchOptions.parentElement).toBe(sortOptions.parentElement);
		expect(searchOptions).toHaveAttribute("aria-expanded", "false");
		expect(sortOptions).toHaveAttribute("aria-expanded", "false");

		fireEvent.click(sortOptions);
		expect(screen.getByRole("combobox", { name: "Sort by" })).toBeVisible();
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

	it("calculates result distance from the submitted search centre", async () => {
		mockSearchLabs.mockResolvedValue([lab()]);
		renderPage();

		fireEvent.click(screen.getByRole("button", { name: "Search" }));

		const expectedDistance = (
			distanceBetween(lab().location, {
				latitude: DEFAULT_LATITUDE,
				longitude: DEFAULT_LONGITUDE,
			}) / 1000
		).toFixed(2);
		expect(
			await screen.findByText(`${expectedDistance} km`),
		).toBeInTheDocument();
	});

	it("updates result distance as the user moves", async () => {
		let updateLocation: PositionCallback | undefined;
		const clearWatch = vi.fn();
		vi.stubGlobal("navigator", {
			...navigator,
			geolocation: {
				getCurrentPosition: (success: PositionCallback) =>
					success({
						coords: { latitude: -27.3, longitude: 153 },
					} as GeolocationPosition),
				watchPosition: (success: PositionCallback) => {
					updateLocation = success;
					return 1;
				},
				clearWatch,
			},
		});
		mockSearchLabs.mockResolvedValue([lab()]);
		const { unmount } = renderPage();

		fireEvent.click(
			screen.getByRole("button", { name: "Use my location" }),
		);
		fireEvent.change(screen.getByLabelText("Location"), {
			target: { value: "-27.4, 153.0" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Search" }));

		const initialDistance = (
			distanceBetween(lab().location, {
				latitude: -27.3,
				longitude: 153,
			}) / 1000
		).toFixed(2);
		expect(
			await screen.findByText(`${initialDistance} km`),
		).toBeInTheDocument();

		act(() => {
			updateLocation?.({
				coords: { latitude: -27.2, longitude: 153 },
			} as GeolocationPosition);
		});

		const updatedDistance = (
			distanceBetween(lab().location, {
				latitude: -27.2,
				longitude: 153,
			}) / 1000
		).toFixed(2);
		expect(
			await screen.findByText(`${updatedDistance} km`),
		).toBeInTheDocument();
		expect(
			screen.queryByText(`${initialDistance} km`),
		).not.toBeInTheDocument();
		unmount();
		expect(clearWatch).toHaveBeenCalledWith(1);
	});

	it("restores the known user location for results after returning", async () => {
		const savedLocation = { latitude: -27.3, longitude: 153 };
		sessionStorage.setItem("searchResults", JSON.stringify([lab()]));
		sessionStorage.setItem("userLocation", JSON.stringify(savedLocation));
		renderPage();

		const expectedDistance = (
			distanceBetween(lab().location, savedLocation) / 1000
		).toFixed(2);
		expect(
			await screen.findByText(`${expectedDistance} km`),
		).toBeInTheDocument();
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
