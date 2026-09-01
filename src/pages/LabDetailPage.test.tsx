import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import LabDetailPage from "./LabDetailPage";
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
			title: "Stage One",
			keyImageUrl: "",
			isComplete: false,
			description: "",
			location: { latitude: 0, longitude: 0 },
			geofencingRadius: 10,
			challengeType: "text",
			question: "",
			isFinal: true,
		},
	],
	journalsTotalCount: 0,
	ownerUsername: "adventurer",
	reviewsTotalCount: 0,
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
	});

	it("shows a loading state while the lab is being fetched", () => {
		vi.mocked(getLab).mockReturnValue(new Promise(() => {}));
		renderPage();
		expect(screen.getByText("Loading…")).toBeInTheDocument();
	});

	it("renders the lab title, owner, rating, and stages once loaded", async () => {
		vi.mocked(getLab).mockResolvedValue(lab);
		renderPage();

		await waitFor(() =>
			expect(screen.getByText("Riverside Ramble")).toBeInTheDocument(),
		);
		expect(screen.getByText("by adventurer")).toBeInTheDocument();
		expect(screen.getByText("★ 4.2")).toBeInTheDocument();
		expect(screen.getByText("Stages (1)")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Stage One" })).toHaveAttribute(
			"href",
			"/labs/guid-1/stage/stage-1",
		);
	});

	it("shows an error message when the fetch fails", async () => {
		vi.mocked(getLab).mockRejectedValue(new Error("Lab not found"));
		renderPage();

		await waitFor(() =>
			expect(screen.getByText("Lab not found")).toBeInTheDocument(),
		);
	});

	it("requests the lab for the guid in the route", () => {
		vi.mocked(getLab).mockReturnValue(new Promise(() => {}));
		renderPage("guid-42");

		expect(getLab).toHaveBeenCalledWith("guid-42", expect.any(AbortSignal));
	});

	it("caches the fetched lab in sessionStorage", async () => {
		vi.mocked(getLab).mockResolvedValue(lab);
		renderPage();

		await waitFor(() =>
			expect(screen.getByText("Riverside Ramble")).toBeInTheDocument(),
		);
		expect(sessionStorage.getItem("lab_guid-1")).toBe(JSON.stringify(lab));
	});

	it("renders from sessionStorage without fetching when a cached lab exists", () => {
		sessionStorage.setItem("lab_guid-1", JSON.stringify(lab));
		renderPage();

		expect(screen.getByText("Riverside Ramble")).toBeInTheDocument();
		expect(getLab).not.toHaveBeenCalled();
	});
});
