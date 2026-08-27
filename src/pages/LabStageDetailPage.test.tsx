import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import LabStageDetailPage from "./LabStageDetailPage";
import { getLab } from "../api";
import type { LabDetail } from "../types";

vi.mock("../api", () => ({
	getLab: vi.fn(),
}));

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
			title: "Find the fountain",
			keyImageUrl: "",
			isComplete: false,
			description: "Look near the fountain.",
			location: { latitude: 0, longitude: 0 },
			geofencingRadius: 50,
			challengeType: "text",
			question: "What year was it built?",
			isFinal: false,
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
	});

	it("shows a loading state while the lab is being fetched", () => {
		vi.mocked(getLab).mockReturnValue(new Promise(() => {}));
		renderPage();
		expect(screen.getByText("Loading…")).toBeInTheDocument();
	});

	it("renders the stage title, description, and question once loaded", async () => {
		vi.mocked(getLab).mockResolvedValue(lab);
		renderPage();

		await waitFor(() =>
			expect(screen.getByText("Find the fountain")).toBeInTheDocument(),
		);
		expect(screen.getByText("Look near the fountain.")).toBeInTheDocument();
		expect(screen.getByText("What year was it built?")).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /Back to Riverside Ramble/ }),
		).toHaveAttribute("href", "/labs/guid-1");
	});

	it("shows an error message when the fetch fails", async () => {
		vi.mocked(getLab).mockRejectedValue(new Error("Lab not found"));
		renderPage();

		await waitFor(() =>
			expect(screen.getByText("Lab not found")).toBeInTheDocument(),
		);
	});

	it("shows a not found message when the stage id doesn't match", async () => {
		vi.mocked(getLab).mockResolvedValue(lab);
		renderPage("guid-1", "missing-stage");

		await waitFor(() =>
			expect(screen.getByText("Stage not found")).toBeInTheDocument(),
		);
	});

	it("renders from sessionStorage without fetching when a cached lab exists", () => {
		sessionStorage.setItem("lab_guid-1", JSON.stringify(lab));
		renderPage();

		expect(screen.getByText("Find the fountain")).toBeInTheDocument();
		expect(getLab).not.toHaveBeenCalled();
	});
});
