import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import LabStageDetailPage from "./LabStageDetailPage";
import type { LabDetail } from "../types";
import { useApi } from "../useApi";

vi.mock("../useApi", () => ({
	useApi: vi.fn(),
	searchLabs: vi.fn(),
}));

const mockGetLab = vi.fn();
const mockCheckAnswer = vi.fn();

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
	adventureType: "Nonsequential",
	completionStatus: "NotStarted",
	adventureThemes: [],
	stageSummaries: [
		{
			id: "stage-1",
			title: "Find the fountain",
			keyImageUrl: "",
			isComplete: false,
			description: "Look near the fountain.",
			location: { latitude: -27.20575, longitude: 153.0761166667 },
			geofencingRadius: 50,
			challengeType: "text",
			question: "What year was it built?",
			isFinal: false,
			findCodeHashBase16v2: "",
			answerCodeHashesBase16v2: [],
			journalImageUrl: undefined,
			journalMessage: undefined,
			multiChoiceOptions: undefined,
		},
	],
	journalsTotalCount: 0,
	ownerUsername: "adventurer",
	reviewsTotalCount: 0,
	recommendedCount: 0,
	completionCount: 0,
};

function renderPage(guid = "guid-1", stageId = "stage-1") {
	return render(
		<MemoryRouter initialEntries={[`/labs/${guid}/stage/${stageId}`]}>
			<Routes>
				<Route
					path="/labs/:guid/stage/:stageId"
					element={<LabStageDetailPage />}
				/>
			</Routes>
		</MemoryRouter>,
	);
}

describe("LabStageDetailPage", () => {
	beforeEach(() => {
		sessionStorage.clear();
		vi.clearAllMocks();
		vi.mocked(useApi).mockReturnValue({
			getLab: mockGetLab,
			getReviews: vi.fn(),
			searchLabs: vi.fn(),
			checkAnswer: mockCheckAnswer,
			submitAnswer: vi.fn(),
		});
	});

	it("shows a loading state while the lab is being fetched", () => {
		mockGetLab.mockReturnValue(new Promise(() => {}));
		renderPage();
		expect(screen.getByText("Loading…")).toBeInTheDocument();
	});

	it("renders the stage title, description, and question once loaded", async () => {
		mockGetLab.mockResolvedValue(lab);
		renderPage();

		await waitFor(() =>
			expect(screen.getByText("Find the fountain")).toBeInTheDocument(),
		);
		expect(screen.getByText("Look near the fountain.")).toBeInTheDocument();
		expect(screen.getByText("What year was it built?")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Navigate" })).toHaveAttribute(
			"href",
			"https://www.google.com/maps/search/?api=1&query=-27.20575,153.0761166667",
		);
		expect(
			screen.getByRole("link", { name: /Back to Riverside Ramble/ }),
		).toHaveAttribute("href", "/labs/guid-1");
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
		renderPage("guid-1", "stage-1");

		expect(mockGetLab).toHaveBeenCalledWith(
			"guid-1",
			expect.any(AbortSignal),
		);
	});

	it("shows a not found message when the stage id doesn't match", async () => {
		mockGetLab.mockResolvedValue(lab);
		renderPage("guid-1", "missing-stage");

		await waitFor(() =>
			expect(screen.getByText("Stage not found")).toBeInTheDocument(),
		);
	});

	it("renders from sessionStorage without fetching when a cached lab exists", () => {
		sessionStorage.setItem("lab_guid-1", JSON.stringify(lab));
		renderPage();

		expect(screen.getByText("Find the fountain")).toBeInTheDocument();
		expect(mockGetLab).not.toHaveBeenCalled();
	});

	it("shows the correct answer instead of the answer form beside submit", async () => {
		localStorage.setItem("userCanAnswer", "true");
		mockGetLab.mockResolvedValue({
			...lab,
			ratingsTotalCount: 10,
			stageSummaries: [
				{ ...lab.stageSummaries[0], correctAnswer: "1902" },
			],
		});
		renderPage();

		const answer = await screen.findByText("1902");
		const submitButton = screen.getByRole("button", {
			name: "Send Answer",
		});

		expect(answer).toHaveClass("success-text");
		expect(answer.parentElement).toContainElement(submitButton);
		expect(screen.queryByRole("button", { name: "Check" })).toBeNull();
		expect(screen.queryByRole("textbox")).toBeNull();
	});

	it("hides submission for a sequential stage until prior stages are complete", async () => {
		localStorage.setItem("userCanAnswer", "true");
		mockGetLab.mockResolvedValue({
			...lab,
			adventureType: "Sequential",
			ratingsTotalCount: 10,
			stagesTotalCount: 2,
			stageSummaries: [
				{ ...lab.stageSummaries[0], id: "stage-1" },
				{
					...lab.stageSummaries[0],
					id: "stage-2",
					title: "Second stage",
					correctAnswer: "1902",
				},
			],
		});
		renderPage("guid-1", "stage-2");

		expect(await screen.findByText("1902")).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Send Answer" }),
		).not.toBeInTheDocument();
	});

	it("allows sequential submission after prior stages are complete", async () => {
		localStorage.setItem("userCanAnswer", "true");
		mockGetLab.mockResolvedValue({
			...lab,
			adventureType: "Sequential",
			ratingsTotalCount: 10,
			stagesTotalCount: 2,
			stageSummaries: [
				{ ...lab.stageSummaries[0], id: "stage-1", isComplete: true },
				{
					...lab.stageSummaries[0],
					id: "stage-2",
					title: "Second stage",
					correctAnswer: "1902",
				},
			],
		});
		renderPage("guid-1", "stage-2");

		expect(
			await screen.findByRole("button", { name: "Send Answer" }),
		).toBeInTheDocument();
	});

	it("calculates the lab answer count from confirmed stages", async () => {
		const user = userEvent.setup();
		const labWithQuestion = {
			...lab,
			numAnswers: 2,
			stageSummaries: [
				{ ...lab.stageSummaries[0], challengeType: "SingleChoice" },
			],
		};
		mockGetLab.mockResolvedValue(labWithQuestion);
		mockCheckAnswer.mockResolvedValue({ success: true });
		sessionStorage.setItem(
			"searchResults",
			JSON.stringify([{ adventureGuid: "guid-1", numAnswers: 2 }]),
		);
		renderPage();

		await user.type(await screen.findByRole("textbox"), "1902");
		await user.click(screen.getByRole("button", { name: "Check" }));

		await waitFor(() => {
			const storedLab = JSON.parse(
				sessionStorage.getItem("lab_guid-1")!,
			) as LabDetail;
			expect(storedLab.numAnswers).toBe(1);
			expect(storedLab.stageSummaries[0].correctAnswer).toBe("1902");
		});
		expect(
			JSON.parse(sessionStorage.getItem("searchResults")!)[0].numAnswers,
		).toBe(1);
	});
});
