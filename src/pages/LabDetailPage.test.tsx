import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
	location: { latitude: 0, longitude: 0 },
	stagesTotalCount: 1,
	adventureType: "",
	completionStatus: "NotStarted",
	adventureThemes: [],
	stageSummaries: [
		{
			id: "stage-1",
			title: "Stage One",
			keyImageUrl: "",
			isComplete: false,
			description: "",
			location: { latitude: 0, longitude: 0 },
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
		expect(screen.getByRole("link", { name: "Stage One" })).toHaveAttribute(
			"href",
			"/labs/guid-1/stage/stage-1",
		);
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
