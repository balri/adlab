import { LabStage, LabSummary } from "../types";

interface StatusChipsParams {
	lab?: LabSummary;
	stage?: LabStage;
}
export default function StatusChips({ lab, stage }: StatusChipsParams) {
	const statuses = [];
	if (lab) {
		if (!stage) {
			statuses.push(lab.completionStatus);
		}
		if (lab.ownerPublicGuid === localStorage.getItem("userGuid")) {
			statuses.push("Owned");
		}
	}
	if (stage) {
		if (stage.isComplete) {
			statuses.push("Completed");
		} else {
			statuses.push("NotStarted");
		}
		if (stage.correctAnswer) {
			statuses.push("CorrectAnswer");
		}
	}
	return (
		<span className="status-chips">
			{statuses.includes("Completed") && (
				<span className="status-chip complete">Complete</span>
			)}
			{statuses.includes("InProgress") && (
				<span className="status-chip in-progress">In Progress</span>
			)}
			{statuses.includes("NotStarted") && (
				<span className="status-chip not-started">Not Started</span>
			)}
			{statuses.includes("Owned") && (
				<span className="status-chip owned">Owned</span>
			)}
			{statuses.includes("CorrectAnswer") && (
				<span className="status-chip correct">Confirmed Answer</span>
			)}
		</span>
	);
}
