import type { LabDetail, LabStage } from "../types";

const minRatingsTotalCount = 10;

function canUserSubmitAnswers(lab: LabDetail) {
	return (
		lab.ratingsTotalCount >= minRatingsTotalCount &&
		localStorage.getItem("userCanAnswer") === "true"
	);
}

export function canSubmitAnswer(lab: LabDetail, stage: LabStage) {
	return (
		Boolean(stage.correctAnswer) &&
		!stage.isComplete &&
		canUserSubmitAnswers(lab)
	);
}

export function canSubmitStageInSequence(lab: LabDetail, stage: LabStage) {
	if (lab.adventureType !== "Sequential") return true;

	const stageIndex = lab.stageSummaries.findIndex(
		(summary) => summary.id === stage.id,
	);
	return (
		stageIndex >= 0 &&
		lab.stageSummaries
			.slice(0, stageIndex)
			.every((previousStage) => previousStage.isComplete)
	);
}

export function canSubmitAllAnswers(lab: LabDetail) {
	return (
		lab.stageSummaries.length > 0 &&
		lab.stageSummaries.length === lab.stagesTotalCount &&
		lab.stageSummaries.every((stage) => Boolean(stage.correctAnswer)) &&
		lab.stageSummaries.some((stage) => !stage.isComplete) &&
		canUserSubmitAnswers(lab)
	);
}
