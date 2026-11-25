import type { LabStatusMeta } from "../types";

interface LabStatusMetaInput {
	stageSummaries: Array<{
		isComplete: boolean;
		correctAnswer?: string | null;
		challengeType: string;
	}>;
	stagesTotalCount: number;
	ownedByUser?: boolean;
	numAnswers?: number;
}

export function createLabStatusMeta(lab: LabStatusMetaInput): LabStatusMeta {
	const incompleteStages = lab.stageSummaries.filter(
		(stage) => !stage.isComplete,
	);

	return {
		...(lab.ownedByUser !== undefined
			? { ownedByUser: lab.ownedByUser }
			: {}),
		...(lab.numAnswers !== undefined ? { numAnswers: lab.numAnswers } : {}),
		completedStagesCount:
			lab.stageSummaries.length - incompleteStages.length,
		incompleteStagesCount: incompleteStages.length,
		incompleteStagesWithAnswerCount: incompleteStages.filter(
			(stage) => stage.correctAnswer,
		).length,
		hasAllAnswers:
			lab.stagesTotalCount > 0 &&
			(lab.numAnswers ?? 0) >= lab.stagesTotalCount,
		allStagesMultiChoice:
			lab.stageSummaries.length > 0 &&
			lab.stageSummaries.every(
				(stage) => stage.challengeType === "MultiChoice",
			),
	};
}
