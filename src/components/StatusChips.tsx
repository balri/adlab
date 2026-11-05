import { LabDetail, LabStage, LabSummary } from "../types";

interface StatusChipsParams {
	lab?: LabSummary;
	stage?: LabStage;
}
export default function StatusChips({ lab, stage }: StatusChipsParams) {
	const statuses = [];
	const isLabDetail = (candidate: LabSummary): candidate is LabDetail =>
		"stageSummaries" in candidate;
	const isLabSummary = lab !== undefined && !isLabDetail(lab);
	const hasMultipleChoiceStageChip = stage?.challengeType === "MultiChoice";
	const hasAllMultipleChoiceLabChip =
		!stage &&
		lab !== undefined &&
		isLabDetail(lab) &&
		lab.stageSummaries.length > 0 &&
		lab.stageSummaries.every(
			(stageSummary) => stageSummary.challengeType === "MultiChoice",
		);
	const hasMultipleChoiceChip =
		hasMultipleChoiceStageChip || hasAllMultipleChoiceLabChip;
	if (lab) {
		if (!stage) {
			statuses.push(lab.completionStatus);
		}
		if (lab.ownedByUser) {
			statuses.push("Owned");
		}
		if (!stage && lab.adventureType === "Sequential") {
			statuses.push("Sequential");
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
			{statuses.includes("Sequential") && (
				<span className="status-chip sequential">Sequential</span>
			)}
			{statuses.includes("CorrectAnswer") && !hasMultipleChoiceChip && (
				<span className="status-chip correct">Has Answer</span>
			)}
			{hasMultipleChoiceStageChip && (
				<span className="status-chip correct">Multi Choice</span>
			)}
			{hasAllMultipleChoiceLabChip && (
				<span className="status-chip correct">All Multi Choice</span>
			)}
			{!stage &&
				!hasMultipleChoiceChip &&
				!!lab?.numAnswers &&
				lab.numAnswers > 0 && (
					<span className="status-chip correct">
						{lab.numAnswers} of {lab.stagesTotalCount} answers
						{isLabSummary && "*"}
					</span>
				)}
		</span>
	);
}
