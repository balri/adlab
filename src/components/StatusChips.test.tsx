import { render, screen } from "@testing-library/react";
import type { LabSummary } from "../types";
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
		adventureType: "",
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

		expect(screen.getByText("Confirmed Answer")).toBeInTheDocument();
		expect(screen.queryByText(/answers\*/)).not.toBeInTheDocument();
	});
});
