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
	const labDetail = lab !== undefined && isLabDetail(lab) ? lab : undefined;
	const hasLabProgressMeta =
		labDetail !== undefined ||
		typeof lab?.meta?.completedStagesCount === "number";
	const isInProgressLab =
		lab !== undefined &&
		!stage &&
		hasLabProgressMeta &&
		lab.completionStatus === "InProgress";
	const incompleteStages =
		labDetail?.stageSummaries.filter(
			(stageSummary) => !stageSummary.isComplete,
		) ?? [];
	const answerCount = labDetail
		? incompleteStages.filter((stageSummary) => stageSummary.correctAnswer)
				.length
		: (lab?.meta?.incompleteStagesWithAnswerCount ??
			lab?.meta?.numAnswers ??
			0);
	const answerTotalCount = labDetail
		? incompleteStages.length
		: (lab?.meta?.incompleteStagesCount ?? lab?.stagesTotalCount ?? 0);
	const completedStageCount = labDetail
		? labDetail.stageSummaries.filter(
				(stageSummary) => stageSummary.isComplete,
			).length
		: (lab?.meta?.completedStagesCount ?? 0);
	const stageCount =
		labDetail?.stageSummaries.length ?? lab?.stagesTotalCount ?? 0;
	const hasAllAnswers =
		lab?.meta?.hasAllAnswers ??
		(lab !== undefined &&
			lab.stagesTotalCount > 0 &&
			(lab.meta?.numAnswers ?? 0) >= lab.stagesTotalCount);
	const hasMultipleChoiceStageChip = stage?.challengeType === "MultiChoice";
	const hasAllMultipleChoiceLabChip =
		!stage &&
		lab !== undefined &&
		(labDetail !== undefined
			? labDetail.stageSummaries.length > 0 &&
				labDetail.stageSummaries.every(
					(stageSummary) =>
						stageSummary.challengeType === "MultiChoice",
				)
			: lab.meta?.allStagesMultiChoice === true);
	const hasMultipleChoiceChip =
		hasMultipleChoiceStageChip || hasAllMultipleChoiceLabChip;
	if (lab) {
		if (!stage) {
			statuses.push(lab.completionStatus);
		}
		if (lab.meta?.ownedByUser) {
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
			{statuses.includes("InProgress") && !isInProgressLab && (
				<span className="status-chip in-progress">In Progress</span>
			)}
			{isInProgressLab && (
				<span className="status-chip in-progress">
					{completedStageCount} of {stageCount} completed
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
