import type { LabDetail, LabSummary } from "../types";
import { createLabStatusMeta } from "./createLabStatusMeta";
import { normalizeLabSummaries } from "./normalizeLabSummaries";

function isLabDetail(lab: LabSummary): lab is LabDetail {
	return "stageSummaries" in lab;
}

export function updateStoredSearchResult(lab: LabSummary) {
	const storedResults = sessionStorage.getItem("searchResults");
	if (!storedResults) return;

	try {
		const results = normalizeLabSummaries(JSON.parse(storedResults));
		const updatedResults = results.map((result) =>
			result.adventureGuid === lab.adventureGuid
				? {
						...lab,
						meta: isLabDetail(lab)
							? createLabStatusMeta({
									...lab,
									ownedByUser:
										result.meta?.ownedByUser ??
										lab.meta?.ownedByUser,
									numAnswers: lab.meta?.numAnswers,
								})
							: {
									...result.meta,
									...lab.meta,
									ownedByUser:
										result.meta?.ownedByUser ??
										lab.meta?.ownedByUser,
									numAnswers:
										lab.meta?.numAnswers ??
										result.meta?.numAnswers,
								},
					}
				: result,
		);
		sessionStorage.setItem("searchResults", JSON.stringify(updatedResults));
	} catch {
		return;
	}
}
