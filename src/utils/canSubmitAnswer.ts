import type { LabDetail, LabStage, LatLng } from "../types";
import { distanceBetween } from "./distanceBetween";

const minRatingsTotalCount = 10;
const nearbyAnswerDistanceMetres = 500;

function canUserSubmitAnswers(
	lab: LabDetail,
	userLocation: LatLng | null = null,
	nearbyStageLocation?: LatLng,
) {
	return (
		localStorage.getItem("userCanAnswer") === "true" &&
		(lab.ratingsTotalCount >= minRatingsTotalCount ||
			(userLocation !== null &&
				nearbyStageLocation !== undefined &&
				distanceBetween(userLocation, nearbyStageLocation) <=
					nearbyAnswerDistanceMetres))
	);
}

export function canSubmitAnswer(
	lab: LabDetail,
	stage: LabStage,
	userLocation: LatLng | null = null,
) {
	return (
		Boolean(stage.correctAnswer) &&
		!stage.isComplete &&
		canUserSubmitAnswers(lab, userLocation, stage.location)
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
