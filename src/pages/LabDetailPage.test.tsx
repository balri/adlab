import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import LabDetailPage from "./LabDetailPage";
import type { LabDetail } from "../types";
import { useApi } from "../useApi";

vi.mock("../useApi", () => ({
	useApi: vi.fn(),
	searchLabs: vi.fn(),
}));

const mockGetLab = vi.fn();

const lab: LabDetail = {
	adventureGuid: "guid-1",
	title: "Riverside Ramble",
	keyImageUrl: "",
	smartLink: "",
	deepLink: "",
	firebaseDynamicLink: "",
	description: "A stroll along the river.",
	ownerPublicGuid: "",
	createdUtc: "",
	publishedUtc: "",
	ratingsAverage: 4.2,
	ratingsTotalCount: 8,
	isHighlyRecommended: false,
	location: { latitude: -27.20575, longitude: 153.0761166667 },
	stagesTotalCount: 1,
	adventureType: "Nonsequential",
	completionStatus: "NotStarted",
	adventureThemes: [],
	stageSummaries: [
		{
			id: "stage-1",
			title: "Stage One",
			keyImageUrl: "",
			isComplete: false,
			description: "",
			location: { latitude: -27.20575, longitude: 153.0761166667 },
			geofencingRadius: 10,
			challengeType: "text",
			question: "",
			isFinal: true,
			findCodeHashBase16v2: "",
			answerCodeHashesBase16v2: [],
			journalImageUrl: undefined,
			journalMessage: undefined,
			multiChoiceOptions: undefined,
		},
	],
	journalsTotalCount: 0,
	ownerUsername: "adventurer",
	reviewsTotalCount: 5,
	recommendedCount: 0,
	completionCount: 0,
};
function renderPage(guid = "guid-1") {
	return render(
		<MemoryRouter initialEntries={[`/labs/${guid}`]}>
			<Routes>
				<Route path="/labs/:guid" element={<LabDetailPage />} />
			</Routes>
		</MemoryRouter>,
	);
}

describe("LabDetailPage", () => {
	beforeEach(() => {
		sessionStorage.clear();
		vi.clearAllMocks();
		vi.mocked(useApi).mockReturnValue({
			getLab: mockGetLab,
			getReviews: vi.fn(),
			searchLabs: vi.fn(),
			checkAnswer: vi.fn(),
			submitAnswer: vi.fn(),
		});
	});

	it("shows a loading state while the lab is being fetched", () => {
		renderPage();
		expect(screen.getByText("Loading…")).toBeInTheDocument();
	});

	it("renders the lab title, owner, rating, and stages once loaded", async () => {
		mockGetLab.mockResolvedValue(lab);
		renderPage();

		await waitFor(() =>
			expect(screen.getByText("Riverside Ramble")).toBeInTheDocument(),
		);
		expect(screen.getByText("by adventurer")).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: "Reviews (5)" }),
		).toHaveAttribute("href", "/labs/guid-1/reviews");
		expect(
			screen.getByText(
				(_, element) =>
					element?.tagName === "SPAN" &&
					element.textContent === "★ 4.2 (8)",
			),
		).toBeInTheDocument();
		expect(screen.getByText("Stages (1)")).toBeInTheDocument();
		expect(document.querySelector(".results-list")?.tagName).toBe("UL");
		expect(screen.getAllByRole("link", { name: "Navigate" })).toHaveLength(
			2,
		);
		expect(screen.getByRole("link", { name: "Stage One" })).toHaveAttribute(
			"href",
			"/labs/guid-1/stage/stage-1",
		);
	});

	it("numbers stages for sequential labs", async () => {
		mockGetLab.mockResolvedValue({ ...lab, adventureType: "Sequential" });
		const { container } = renderPage();

		await waitFor(() =>
			expect(container.querySelector(".results-list")?.tagName).toBe(
				"OL",
			),
		);
		expect(container.querySelector(".results-list")).toHaveClass(
			"numbered",
		);
		expect(
			screen.queryByRole("combobox", { name: "Sort by" }),
		).not.toBeInTheDocument();
	});

	it("sorts stages by name and distance in both directions", async () => {
		const stages = [
			{
				...lab.stageSummaries[0],
				title: "Stage C",
				location: { latitude: -27.4, longitude: 153.03 },
			},
			{
				...lab.stageSummaries[0],
				id: "stage-2",
				title: "Stage A",
				location: { latitude: -27.3, longitude: 153.03 },
			},
			{
				...lab.stageSummaries[0],
				id: "stage-3",
				title: "Stage B",
				location: { latitude: -27.2, longitude: 153.03 },
			},
		];
		mockGetLab.mockResolvedValue({
			...lab,
			adventureType: "Nonsequential" as const,
			stageSummaries: stages,
		});
		renderPage();
		await screen.findByRole("link", { name: "Stage C" });
		fireEvent.click(screen.getByRole("button", { name: /Sort options/ }));

		const stageTitles = () =>
			Array.from(
				document.querySelectorAll<HTMLAnchorElement>(
					".results-list-item > a",
				),
			).map((link) => link.textContent);
		const sortBy = screen.getByRole("combobox", { name: "Sort by" });
		const direction = screen.getByRole("combobox", {
			name: "Sort direction",
		});

		expect(stageTitles()).toEqual(["Stage C", "Stage A", "Stage B"]);
		fireEvent.change(sortBy, { target: { value: "name" } });
		expect(stageTitles()).toEqual(["Stage A", "Stage B", "Stage C"]);
		fireEvent.change(direction, { target: { value: "desc" } });
		expect(stageTitles()).toEqual(["Stage C", "Stage B", "Stage A"]);
		fireEvent.change(sortBy, { target: { value: "distance" } });
		fireEvent.change(direction, { target: { value: "asc" } });
		expect(stageTitles()).toEqual(["Stage C", "Stage A", "Stage B"]);
		fireEvent.change(direction, { target: { value: "desc" } });
		expect(stageTitles()).toEqual(["Stage B", "Stage A", "Stage C"]);
	});

	it("sorts stages by completion status in both directions", async () => {
		const stages = [
			{ ...lab.stageSummaries[0], title: "Complete A", isComplete: true },
			{
				...lab.stageSummaries[0],
				title: "Not Started",
				isComplete: false,
			},
			{
				...lab.stageSummaries[0],
				id: "stage-3",
				title: "Complete B",
				isComplete: true,
			},
		];
		mockGetLab.mockResolvedValue({ ...lab, stageSummaries: stages });
		renderPage();
		await screen.findByRole("link", { name: "Complete A" });
		fireEvent.click(screen.getByRole("button", { name: /Sort options/ }));

		const stageTitles = () =>
			Array.from(
				document.querySelectorAll<HTMLAnchorElement>(
					".results-list-item > a",
				),
			).map((link) => link.textContent);
		fireEvent.change(screen.getByRole("combobox", { name: "Sort by" }), {
			target: { value: "status" },
		});
		expect(stageTitles()).toEqual([
			"Not Started",
			"Complete A",
			"Complete B",
		]);
		fireEvent.change(
			screen.getByRole("combobox", { name: "Sort direction" }),
			{ target: { value: "desc" } },
		);
		expect(stageTitles()).toEqual([
			"Complete A",
			"Complete B",
			"Not Started",
		]);
	});

	it("shows the correct answer beside its submit button", async () => {
		localStorage.setItem("userCanAnswer", "true");
		mockGetLab.mockResolvedValue({
			...lab,
			ratingsTotalCount: 10,
			stageSummaries: [{ ...lab.stageSummaries[0], correctAnswer: "42" }],
		});
		renderPage();

		const answer = await screen.findByText("42");
		const submitButton = screen.getByRole("button", {
			name: "Send Answer",
		});

		expect(answer).toHaveClass("success-text");
		expect(answer.parentElement).toContainElement(submitButton);
	});

	it("shows the correct answer for a nearby user below ten ratings", async () => {
		localStorage.setItem("userCanAnswer", "true");
		Object.defineProperty(navigator, "geolocation", {
			configurable: true,
			value: {
				watchPosition: vi.fn((success: PositionCallback) => {
					success({
						coords: {
							latitude: lab.stageSummaries[0].location.latitude,
							longitude: lab.stageSummaries[0].location.longitude,
						},
					} as GeolocationPosition);
					return 1;
				}),
				clearWatch: vi.fn(),
			},
		});
		mockGetLab.mockResolvedValue({
			...lab,
			stageSummaries: [{ ...lab.stageSummaries[0], correctAnswer: "42" }],
		});
		renderPage();

		const answer = await screen.findByText("42");
		const submitButton = screen.getByRole("button", {
			name: "Send Answer",
		});

		expect(answer.parentElement).toContainElement(submitButton);
	});

	it("updates lab and stage distances as the user moves", async () => {
		let updateLocation: PositionCallback | undefined;
		const clearWatch = vi.fn();
		localStorage.setItem("userCanAnswer", "true");
		localStorage.setItem(
			"searchForm",
			JSON.stringify({ latitude: 0, longitude: 0 }),
		);
		Object.defineProperty(navigator, "geolocation", {
			configurable: true,
			value: {
				watchPosition: vi.fn((success: PositionCallback) => {
					updateLocation = success;
					success({
						coords: {
							latitude:
								lab.stageSummaries[0].location.latitude + 0.001,
							longitude: lab.stageSummaries[0].location.longitude,
						},
					} as GeolocationPosition);
					return 1;
				}),
				clearWatch,
			},
		});
		mockGetLab.mockResolvedValue({
			...lab,
			stageSummaries: [{ ...lab.stageSummaries[0], correctAnswer: "42" }],
		});
		const { unmount } = renderPage();

		expect(await screen.findAllByText("0.11 km")).toHaveLength(2);
		act(() => {
			updateLocation?.({
				coords: {
					latitude: lab.stageSummaries[0].location.latitude + 0.002,
					longitude: lab.stageSummaries[0].location.longitude,
				},
			} as GeolocationPosition);
		});
		expect(await screen.findAllByText("0.22 km")).toHaveLength(2);
		expect(screen.queryByText("0.11 km")).not.toBeInTheDocument();
		expect(JSON.parse(sessionStorage.getItem("userLocation")!)).toEqual({
			latitude: lab.stageSummaries[0].location.latitude + 0.002,
			longitude: lab.stageSummaries[0].location.longitude,
		});
		unmount();
		expect(clearWatch).toHaveBeenCalledWith(1);
	});

	it("hides the correct answer when stage submission is unavailable", async () => {
		localStorage.setItem("userCanAnswer", "false");
		mockGetLab.mockResolvedValue({
			...lab,
			ratingsTotalCount: 10,
			stageSummaries: [{ ...lab.stageSummaries[0], correctAnswer: "42" }],
		});
		renderPage();

		await waitFor(() =>
			expect(screen.getByText("Stage One")).toBeInTheDocument(),
		);
		expect(screen.queryByText("42")).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Send Answer" }),
		).not.toBeInTheDocument();
	});

	it("enables bulk submission only when every stage has a confirmed answer", async () => {
		const confirmedLab = {
			...lab,
			ratingsTotalCount: 10,
			stageSummaries: [{ ...lab.stageSummaries[0], correctAnswer: "42" }],
		};
		localStorage.setItem("userCanAnswer", "true");
		mockGetLab.mockResolvedValue(confirmedLab);
		renderPage();

		await waitFor(() =>
			expect(screen.getByText("Riverside Ramble")).toBeInTheDocument(),
		);
		expect(
			screen.getByRole("button", { name: "Submit All Answers" }),
		).toBeEnabled();
	});

	it("hides bulk submission when any stage is unconfirmed", async () => {
		localStorage.setItem("userCanAnswer", "true");
		mockGetLab.mockResolvedValue(lab);
		renderPage();

		await waitFor(() =>
			expect(screen.getByText("Riverside Ramble")).toBeInTheDocument(),
		);
		expect(
			screen.queryByRole("button", { name: "Submit All Answers" }),
		).not.toBeInTheDocument();
	});

	it("hides bulk submission when the user is not allowed to answer", async () => {
		localStorage.setItem("userCanAnswer", "false");
		mockGetLab.mockResolvedValue({
			...lab,
			ratingsTotalCount: 10,
			stageSummaries: [{ ...lab.stageSummaries[0], correctAnswer: "42" }],
		});
		renderPage();

		await waitFor(() =>
			expect(screen.getByText("Riverside Ramble")).toBeInTheDocument(),
		);
		expect(
			screen.queryByRole("button", { name: "Submit All Answers" }),
		).not.toBeInTheDocument();
	});

	it("gates sequential stage submission until prior stages are complete", async () => {
		const sequentialLab = {
			...lab,
			adventureType: "Sequential" as const,
			ratingsTotalCount: 10,
			stagesTotalCount: 2,
			stageSummaries: [
				{ ...lab.stageSummaries[0], correctAnswer: "42" },
				{
					...lab.stageSummaries[0],
					id: "stage-2",
					title: "Stage Two",
					correctAnswer: "north",
				},
			],
		};
		localStorage.setItem("userCanAnswer", "true");
		mockGetLab.mockResolvedValue(sequentialLab);
		renderPage();

		const firstStage = await screen.findByRole("link", {
			name: "Stage One",
		});
		const secondStage = screen.getByRole("link", { name: "Stage Two" });
		expect(firstStage.closest("li")).toContainElement(
			screen.getByRole("button", { name: "Send Answer" }),
		);
		expect(secondStage.closest("li")).not.toContainElement(
			screen.getByRole("button", { name: "Send Answer" }),
		);
		expect(
			screen.queryByRole("button", { name: "Submit All Answers" }),
		).not.toBeInTheDocument();
		expect(screen.queryByText("north")).not.toBeInTheDocument();
	});

	it("allows a sequential stage after all prior stages are complete", async () => {
		const sequentialLab = {
			...lab,
			adventureType: "Sequential" as const,
			ratingsTotalCount: 10,
			stagesTotalCount: 2,
			stageSummaries: [
				{
					...lab.stageSummaries[0],
					isComplete: true,
					correctAnswer: "42",
				},
				{
					...lab.stageSummaries[0],
					id: "stage-2",
					title: "Stage Two",
					correctAnswer: "north",
				},
			],
		};
		localStorage.setItem("userCanAnswer", "true");
		mockGetLab.mockResolvedValue(sequentialLab);
		renderPage();

		const secondStage = await screen.findByRole("link", {
			name: "Stage Two",
		});
		expect(secondStage.closest("li")).toContainElement(
			screen.getByRole("button", { name: "Send Answer" }),
		);
	});

	it("submits each confirmed stage answer", async () => {
		const confirmedLab = {
			...lab,
			ratingsTotalCount: 10,
			stagesTotalCount: 2,
			stageSummaries: [
				{ ...lab.stageSummaries[0], correctAnswer: "42" },
				{
					...lab.stageSummaries[0],
					id: "stage-2",
					title: "Stage Two",
					correctAnswer: "north",
				},
			],
		};
		const mockSubmitAnswer = vi
			.fn()
			.mockResolvedValue({ result: "Success" });
		localStorage.setItem("userCanAnswer", "true");
		vi.spyOn(window, "confirm").mockReturnValue(true);
		mockGetLab.mockResolvedValue(confirmedLab);
		vi.mocked(useApi).mockReturnValue({
			getLab: mockGetLab,
			getReviews: vi.fn(),
			searchLabs: vi.fn(),
			checkAnswer: vi.fn(),
			submitAnswer: mockSubmitAnswer,
		});
		renderPage();

		await waitFor(() =>
			expect(screen.getByText("Riverside Ramble")).toBeInTheDocument(),
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Submit All Answers" }),
		);

		await waitFor(() => expect(mockSubmitAnswer).toHaveBeenCalledTimes(2));
		expect(mockSubmitAnswer).toHaveBeenNthCalledWith(1, {
			adventureGuid: "guid-1",
			stageGuid: "stage-1",
			answer: "42",
			challengeType: "text",
		});
		expect(mockSubmitAnswer).toHaveBeenNthCalledWith(2, {
			adventureGuid: "guid-1",
			stageGuid: "stage-2",
			answer: "north",
			challengeType: "text",
		});
	});

	it("disables individual submit buttons during bulk submission", async () => {
		const confirmedLab = {
			...lab,
			ratingsTotalCount: 10,
			stageSummaries: [{ ...lab.stageSummaries[0], correctAnswer: "42" }],
		};
		let resolveSubmission!: (response: {
			result: string;
			journalMessage: string;
			adventureComplete: boolean;
			completedAdventureProperties: unknown;
		}) => void;
		const mockSubmitAnswer = vi.fn(
			() =>
				new Promise<{
					result: string;
					journalMessage: string;
					adventureComplete: boolean;
					completedAdventureProperties: unknown;
				}>((resolve) => {
					resolveSubmission = resolve;
				}),
		);
		localStorage.setItem("userCanAnswer", "true");
		vi.spyOn(window, "confirm").mockReturnValue(true);
		mockGetLab.mockResolvedValue(confirmedLab);
		vi.mocked(useApi).mockReturnValue({
			getLab: mockGetLab,
			getReviews: vi.fn(),
			searchLabs: vi.fn(),
			checkAnswer: vi.fn(),
			submitAnswer: mockSubmitAnswer,
		});
		renderPage();

		const individualButton = await screen.findByRole("button", {
			name: "Send Answer",
		});
		fireEvent.click(
			screen.getByRole("button", { name: "Submit All Answers" }),
		);

		await waitFor(() => expect(individualButton).toBeDisabled());
		resolveSubmission({
			result: "Success",
			journalMessage: "",
			adventureComplete: false,
			completedAdventureProperties: {},
		});
		await waitFor(() => expect(individualButton).toBeEnabled());
	});

	it("hides the reviews link when there are no reviews", async () => {
		mockGetLab.mockResolvedValue({ ...lab, reviewsTotalCount: 0 });
		renderPage();

		await waitFor(() =>
			expect(screen.getByText("Riverside Ramble")).toBeInTheDocument(),
		);
		expect(
			screen.queryByRole("link", { name: /Reviews/ }),
		).not.toBeInTheDocument();
	});

	it("shows an error message when the fetch fails", async () => {
		mockGetLab.mockRejectedValue(new Error("Lab not found"));
		renderPage();

		await waitFor(() =>
			expect(screen.getByText("Lab not found")).toBeInTheDocument(),
		);
	});

	it("requests the lab for the guid in the route", () => {
		mockGetLab.mockReturnValue(new Promise(() => {}));
		renderPage("guid-42");

		expect(mockGetLab).toHaveBeenCalledWith(
			"guid-42",
			expect.any(AbortSignal),
		);
	});

	it("caches the fetched lab in sessionStorage", async () => {
		mockGetLab.mockResolvedValue(lab);
		renderPage();

		await waitFor(() =>
			expect(screen.getByText("Riverside Ramble")).toBeInTheDocument(),
		);
		expect(sessionStorage.getItem("lab_guid-1")).toBe(JSON.stringify(lab));
	});

	it("updates a matching stored search result when the lab loads", async () => {
		const searchResult = {
			...lab,
			title: "Old title",
			ownedByUser: true,
			numAnswers: 3,
		};
		sessionStorage.setItem("searchResults", JSON.stringify([searchResult]));
		mockGetLab.mockResolvedValue({ ...lab, numAnswers: 4 });
		renderPage();

		await waitFor(() =>
			expect(
				JSON.parse(sessionStorage.getItem("searchResults")!),
			).toEqual([{ ...lab, ownedByUser: true, numAnswers: 4 }]),
		);
	});

	it("renders from sessionStorage without fetching when a cached lab exists", () => {
		sessionStorage.setItem("lab_guid-1", JSON.stringify(lab));
		renderPage();

		expect(screen.getByText("Riverside Ramble")).toBeInTheDocument();
		expect(mockGetLab).not.toHaveBeenCalled();
	});
});
