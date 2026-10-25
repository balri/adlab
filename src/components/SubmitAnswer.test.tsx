import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { LabDetail, LabStage } from "../types";
import { useApi } from "../useApi";
import SubmitAnswer from "./SubmitAnswer";

vi.mock("../useApi", () => ({
	useApi: vi.fn(),
}));

function makeLab(ratingsTotalCount: number): LabDetail {
	return {
		adventureGuid: "lab-1",
		title: "Test Lab",
		keyImageUrl: "",
		smartLink: "",
		deepLink: "",
		firebaseDynamicLink: "",
		description: "",
		ownerPublicGuid: "guid-1",
		createdUtc: "",
		publishedUtc: "",
		ratingsAverage: 4,
		ratingsTotalCount,
		isHighlyRecommended: false,
		location: { latitude: 0, longitude: 0 },
		stagesTotalCount: 1,
		adventureType: "Nonsequential",
		completionStatus: "NotStarted",
		adventureThemes: [],
		stageSummaries: [],
		journalsTotalCount: 0,
		ownerUsername: "owner",
		reviewsTotalCount: ratingsTotalCount,
		recommendedCount: 0,
		completionCount: 10,
	};
}

const stage: LabStage = {
	id: "stage-1",
	title: "Stage",
	keyImageUrl: "",
	findCodeHashBase16v2: "",
	answerCodeHashesBase16v2: [],
	isComplete: false,
	journalImageUrl: undefined,
	journalMessage: undefined,
	description: "",
	location: { latitude: 0, longitude: 0 },
	geofencingRadius: 0,
	challengeType: "Question",
	question: "",
	multiChoiceOptions: undefined,
	isFinal: false,
	correctAnswer: "42",
};

function renderSubmitAnswer(ratingsTotalCount: number) {
	return render(
		<SubmitAnswer
			lab={makeLab(ratingsTotalCount)}
			stage={stage}
			onSuccess={() => {}}
			onError={() => {}}
		/>,
	);
}

function mockGeolocation(latitude: number, longitude: number) {
	Object.defineProperty(navigator, "geolocation", {
		configurable: true,
		value: {
			getCurrentPosition: vi.fn((success: PositionCallback) => {
				success({
					coords: { latitude, longitude },
				} as GeolocationPosition);
			}),
		},
	});
}

describe("SubmitAnswer", () => {
	beforeEach(() => {
		localStorage.clear();
		Object.defineProperty(navigator, "geolocation", {
			configurable: true,
			value: undefined,
		});
		vi.mocked(useApi).mockReturnValue({
			getLab: vi.fn(),
			getReviews: vi.fn(),
			searchLabs: vi.fn(),
			checkAnswer: vi.fn(),
			submitAnswer: vi.fn(),
		});
	});

	it("does not offer submission below ten ratings", () => {
		localStorage.setItem("userCanAnswer", "true");
		renderSubmitAnswer(9);

		expect(
			screen.queryByRole("button", { name: "Send Answer" }),
		).not.toBeInTheDocument();
	});

	it("offers submission at ten ratings to users allowed to answer", () => {
		localStorage.setItem("userCanAnswer", "true");
		renderSubmitAnswer(10);

		expect(
			screen.getByRole("button", { name: "Send Answer" }),
		).toBeInTheDocument();
	});

	it("offers submission below ten ratings when the user is within 500m", async () => {
		localStorage.setItem("userCanAnswer", "true");
		mockGeolocation(0, 1.004);
		render(
			<SubmitAnswer
				lab={makeLab(9)}
				stage={{ ...stage, location: { latitude: 0, longitude: 1 } }}
				onSuccess={() => {}}
				onError={() => {}}
			/>,
		);

		expect(
			await screen.findByRole("button", { name: "Send Answer" }),
		).toBeInTheDocument();
	});

	it("does not offer submission below ten ratings when the user is over 500m away", async () => {
		localStorage.setItem("userCanAnswer", "true");
		mockGeolocation(0, 0.01);
		renderSubmitAnswer(9);

		await waitFor(() =>
			expect(
				screen.queryByRole("button", { name: "Send Answer" }),
			).not.toBeInTheDocument(),
		);
	});

	it("does not offer submission when the user is not allowed to answer", () => {
		localStorage.setItem("userCanAnswer", "false");
		renderSubmitAnswer(10);

		expect(
			screen.queryByRole("button", { name: "Send Answer" }),
		).not.toBeInTheDocument();
	});

	it("updates the stored search result after reloading a submitted lab", async () => {
		localStorage.setItem("userCanAnswer", "true");
		const refreshedLab = {
			...makeLab(10),
			title: "Updated Lab",
			numAnswers: 4,
		};
		const previousResult = {
			...makeLab(10),
			title: "Old Lab",
			numAnswers: 2,
		};
		sessionStorage.setItem(
			"searchResults",
			JSON.stringify([previousResult]),
		);
		const mockSubmitAnswer = vi
			.fn()
			.mockResolvedValue({ result: "Success" });
		const mockGetLab = vi.fn().mockResolvedValue(refreshedLab);
		vi.spyOn(window, "confirm").mockReturnValue(true);
		vi.mocked(useApi).mockReturnValue({
			getLab: mockGetLab,
			getReviews: vi.fn(),
			searchLabs: vi.fn(),
			checkAnswer: vi.fn(),
			submitAnswer: mockSubmitAnswer,
		});
		renderSubmitAnswer(10);

		fireEvent.click(screen.getByRole("button", { name: "Send Answer" }));

		await waitFor(() =>
			expect(
				JSON.parse(sessionStorage.getItem("searchResults")!),
			).toEqual([{ ...refreshedLab, ownedByUser: undefined }]),
		);
	});
});
