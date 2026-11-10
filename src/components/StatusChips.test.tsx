import { render, screen } from "@testing-library/react";
import type { LabDetail, LabSummary } from "../types";
import StatusChips from "./StatusChips";

function makeLab(overrides: Partial<LabSummary> = {}): LabSummary {
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
		ratingsTotalCount: 10,
		isHighlyRecommended: false,
		location: { latitude: 0, longitude: 0 },
		stagesTotalCount: 1,
		adventureType: "Nonsequential",
		completionStatus: "NotStarted",
		adventureThemes: [],
		...overrides,
	};
}

function makeLabDetail(
	challengeTypes: string[],
	overrides: Partial<LabSummary> = {},
): LabDetail {
	return {
		...makeLab({ stagesTotalCount: challengeTypes.length, ...overrides }),
		stageSummaries: challengeTypes.map(
			(challengeType) => ({ challengeType }) as never,
		),
		journalsTotalCount: 0,
		ownerUsername: "owner",
		reviewsTotalCount: 0,
		recommendedCount: 0,
		completionCount: 0,
	};
}

describe("StatusChips", () => {
	beforeEach(() => localStorage.clear());

	it("shows Owned when the API marks the lab as owned", () => {
		render(<StatusChips lab={makeLab({ ownedByUser: true })} />);

		expect(screen.getByText("Owned")).toBeInTheDocument();
	});

	it("uses the sequential chip class for sequential labs", () => {
		render(<StatusChips lab={makeLab({ adventureType: "Sequential" })} />);

		expect(screen.getByText("Sequential")).toHaveClass(
			"status-chip",
			"sequential",
		);
	});

	it("does not infer ownership from a locally stored user GUID", () => {
		localStorage.setItem("userGuid", "guid-1");
		render(<StatusChips lab={makeLab({ ownedByUser: false })} />);

		expect(screen.queryByText("Owned")).not.toBeInTheDocument();
	});

	it("shows the number of answers when the lab has answers", () => {
		render(
			<StatusChips
				lab={makeLab({ numAnswers: 3, stagesTotalCount: 5 })}
			/>,
		);

		expect(screen.getByText("3 of 5 answers*")).toBeInTheDocument();
	});

	it("shows Has All Answers when every stage has an answer", () => {
		render(
			<StatusChips
				lab={makeLab({ numAnswers: 5, stagesTotalCount: 5 })}
			/>,
		);

		expect(screen.getByText("Has All Answers*")).toBeInTheDocument();
		expect(screen.queryByText("5 of 5 answers*")).not.toBeInTheDocument();
	});

	it("counts only answers on uncompleted stages for a lab detail", () => {
		const labDetail = makeLabDetail(
			[
				"SingleChoice",
				"SingleChoice",
				"SingleChoice",
				"SingleChoice",
				"SingleChoice",
			],
			{ numAnswers: 3 },
		);
		labDetail.stageSummaries[0].isComplete = true;
		labDetail.stageSummaries[0].correctAnswer = "completed answer";
		labDetail.stageSummaries[1].isComplete = true;
		labDetail.stageSummaries[1].correctAnswer = "completed answer";
		labDetail.stageSummaries[2].correctAnswer = "uncompleted answer";
		render(<StatusChips lab={labDetail} />);

		expect(screen.getByText("1 of 3 answers")).toBeInTheDocument();
		expect(screen.queryByText("3 of 5 answers")).not.toBeInTheDocument();
	});

	it("shows the completed stage count instead of In Progress for a lab detail", () => {
		const lab = makeLabDetail(
			["SingleChoice", "SingleChoice", "SingleChoice"],
			{
				completionStatus: "InProgress",
				numAnswers: 1,
			},
		);
		lab.stageSummaries[0].isComplete = true;
		lab.stageSummaries[1].correctAnswer = "calculated answer";
		lab.stageSummaries[2].isComplete = true;

		render(<StatusChips lab={lab} />);

		expect(screen.getByText("2 of 3 completed")).toHaveClass(
			"status-chip",
			"in-progress",
		);
		expect(screen.queryByText("In Progress")).not.toBeInTheDocument();
		expect(screen.getByText("1 of 1 answers")).toBeInTheDocument();
	});

	it("does not show the lab completion count on a stage", () => {
		const lab = makeLabDetail(["SingleChoice", "SingleChoice"], {
			completionStatus: "InProgress",
		});
		lab.stageSummaries[0].isComplete = true;

		render(<StatusChips lab={lab} stage={lab.stageSummaries[0]} />);

		expect(screen.getByText("Complete")).toBeInTheDocument();
		expect(screen.queryByText("1 of 2 completed")).not.toBeInTheDocument();
	});

	it("does not show the answer count when there are no answers", () => {
		render(<StatusChips lab={makeLab({ numAnswers: 0 })} />);

		expect(screen.queryByText(/answers\*/)).not.toBeInTheDocument();
	});

	it("shows the stage answer chip instead of the lab answer count", () => {
		render(
			<StatusChips
				lab={makeLab({ numAnswers: 3, stagesTotalCount: 5 })}
				stage={{ correctAnswer: "42", isComplete: false } as never}
			/>,
		);

		expect(screen.getByText("Has Answer")).toBeInTheDocument();
		expect(screen.queryByText(/answers\*/)).not.toBeInTheDocument();
	});

	it("shows a multi choice chip for multi choice stages", () => {
		render(
			<StatusChips
				lab={makeLab({ numAnswers: 1 })}
				stage={
					{
						challengeType: "MultiChoice",
						isComplete: false,
						correctAnswer: "A",
					} as never
				}
			/>,
		);

		expect(screen.getByText("Multi Choice")).toHaveClass(
			"status-chip",
			"correct",
		);
		expect(screen.queryByText("Has Answer")).not.toBeInTheDocument();
		expect(screen.queryByText(/answers/)).not.toBeInTheDocument();
	});

	it("shows a lab multi choice chip only when all stages are multi choice", () => {
		const { rerender } = render(
			<StatusChips
				lab={makeLabDetail(["MultiChoice", "MultiChoice"], {
					numAnswers: 2,
				})}
			/>,
		);

		expect(screen.getByText("All Multi Choice")).toHaveClass(
			"status-chip",
			"correct",
		);
		expect(screen.queryByText("2 of 2 answers")).not.toBeInTheDocument();

		const mixedLab = makeLabDetail(["MultiChoice", "SingleChoice"], {
			numAnswers: 2,
		});
		mixedLab.stageSummaries.forEach((stageSummary) => {
			stageSummary.correctAnswer = "answer";
		});
		rerender(<StatusChips lab={mixedLab} />);
		expect(screen.queryByText("All Multi Choice")).not.toBeInTheDocument();
		expect(screen.getByText("Has All Answers")).toBeInTheDocument();

		rerender(<StatusChips lab={makeLabDetail([])} />);
		expect(screen.queryByText("All Multi Choice")).not.toBeInTheDocument();
	});
});
