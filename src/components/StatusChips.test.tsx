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

	it("omits the asterisk from the answer count for a lab detail", () => {
		const labDetail = {
			...makeLab({ numAnswers: 3, stagesTotalCount: 5 }),
			stageSummaries: [],
			journalsTotalCount: 0,
			ownerUsername: "owner",
			reviewsTotalCount: 0,
			recommendedCount: 0,
			completionCount: 0,
		} satisfies LabDetail;
		render(<StatusChips lab={labDetail} />);

		expect(screen.getByText("3 of 5 answers")).toBeInTheDocument();
		expect(screen.queryByText("3 of 5 answers*")).not.toBeInTheDocument();
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

		rerender(
			<StatusChips
				lab={makeLabDetail(["MultiChoice", "SingleChoice"], {
					numAnswers: 2,
				})}
			/>,
		);
		expect(screen.queryByText("All Multi Choice")).not.toBeInTheDocument();
		expect(screen.getByText("2 of 2 answers")).toBeInTheDocument();

		rerender(<StatusChips lab={makeLabDetail([])} />);
		expect(screen.queryByText("All Multi Choice")).not.toBeInTheDocument();
	});
});
