import { render, screen } from "@testing-library/react";
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
		adventureType: "",
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

describe("SubmitAnswer", () => {
	beforeEach(() => {
		localStorage.clear();
		vi.mocked(useApi).mockReturnValue({
			getLab: vi.fn(),
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

	it("does not offer submission when the user is not allowed to answer", () => {
		localStorage.setItem("userCanAnswer", "false");
		renderSubmitAnswer(10);

		expect(
			screen.queryByRole("button", { name: "Send Answer" }),
		).not.toBeInTheDocument();
	});
});
