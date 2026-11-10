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
	const isInProgressLabDetail =
		lab !== undefined &&
		!stage &&
		isLabDetail(lab) &&
		lab.completionStatus === "InProgress";
	const labDetail = lab !== undefined && isLabDetail(lab) ? lab : undefined;
	const incompleteStages =
		labDetail?.stageSummaries.filter(
			(stageSummary) => !stageSummary.isComplete,
		) ?? [];
	const answerCount = labDetail
		? incompleteStages.filter((stageSummary) => stageSummary.correctAnswer)
				.length
		: (lab?.numAnswers ?? 0);
	const answerTotalCount = labDetail
		? incompleteStages.length
		: (lab?.stagesTotalCount ?? 0);
	const completedStageCount = isInProgressLabDetail
		? lab.stageSummaries.filter((stageSummary) => stageSummary.isComplete)
				.length
		: 0;
	const hasAllAnswers =
		lab !== undefined &&
		lab.stagesTotalCount > 0 &&
		(lab.numAnswers ?? 0) >= lab.stagesTotalCount;
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
			{statuses.includes("InProgress") && !isInProgressLabDetail && (
				<span className="status-chip in-progress">In Progress</span>
			)}
			{isInProgressLabDetail && (
				<span className="status-chip in-progress">
					{completedStageCount} of {lab.stageSummaries.length}{" "}
					completed
				</span>
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
			{!stage && !hasMultipleChoiceChip && answerCount > 0 && (
				<span className="status-chip correct">
					{hasAllAnswers
						? `Has All Answers${isLabSummary ? "*" : ""}`
						: `${answerCount} of ${answerTotalCount} answers${isLabSummary ? "*" : ""}`}
				</span>
			)}
		</span>
	);
}
