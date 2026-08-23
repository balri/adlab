import { fireEvent, render, screen } from "@testing-library/react";
import { LabStageDetail } from "./LabStageDetail";
import type { LabStage } from "../types";

const stage: LabStage = {
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
};

describe("LabStageDetail", () => {
	it("renders a button with the stage title and no modal content initially", () => {
		render(<LabStageDetail stage={stage} />);

		expect(
			screen.getByRole("button", { name: "Find the fountain" }),
		).toBeInTheDocument();
		expect(
			screen.queryByText("What year was it built?"),
		).not.toBeInTheDocument();
	});

	it("opens the modal with the stage details when clicked", () => {
		render(<LabStageDetail stage={stage} />);

		fireEvent.click(
			screen.getByRole("button", { name: "Find the fountain" }),
		);

		expect(screen.getByText("Look near the fountain.")).toBeInTheDocument();
		expect(screen.getByText("What year was it built?")).toBeInTheDocument();
	});

	it("closes the modal when the close button is clicked", () => {
		render(<LabStageDetail stage={stage} />);

		fireEvent.click(
			screen.getByRole("button", { name: "Find the fountain" }),
		);
		fireEvent.click(screen.getByRole("button", { name: "Close" }));

		expect(
			screen.queryByText("What year was it built?"),
		).not.toBeInTheDocument();
	});
});
