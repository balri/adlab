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
});
