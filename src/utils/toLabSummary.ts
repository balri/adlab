import type { LabDetail, LabSummary } from "../types";
import { createLabStatusMeta } from "./createLabStatusMeta";

export function toLabSummary(lab: LabDetail): LabSummary {
	return {
		adventureGuid: lab.adventureGuid,
		title: lab.title,
		keyImageUrl: lab.keyImageUrl,
		smartLink: lab.smartLink,
		deepLink: lab.deepLink,
		firebaseDynamicLink: lab.firebaseDynamicLink,
		medianTimeToComplete: lab.medianTimeToComplete,
		description: lab.description,
		ownerPublicGuid: lab.ownerPublicGuid,
		createdUtc: lab.createdUtc,
		publishedUtc: lab.publishedUtc,
		ratingsAverage: lab.ratingsAverage,
		ratingsTotalCount: lab.ratingsTotalCount,
		isHighlyRecommended: lab.isHighlyRecommended,
		location: lab.location,
		stagesTotalCount: lab.stagesTotalCount,
		adventureType: lab.adventureType,
		completionStatus: lab.completionStatus,
		adventureThemes: lab.adventureThemes,
		meta: createLabStatusMeta({
			...lab,
			ownedByUser: lab.meta?.ownedByUser,
			numAnswers: lab.meta?.numAnswers,
		}),
	};
}
