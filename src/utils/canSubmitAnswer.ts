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

export function canSubmitAllAnswers(lab: LabDetail) {
	return (
		lab.stageSummaries.length > 0 &&
		lab.stageSummaries.length === lab.stagesTotalCount &&
		lab.stageSummaries.every((stage) => Boolean(stage.correctAnswer)) &&
		lab.stageSummaries.some((stage) => !stage.isComplete) &&
		canUserSubmitAnswers(lab)
	);
}
