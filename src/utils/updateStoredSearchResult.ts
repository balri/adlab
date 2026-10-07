import type { LabSummary } from "../types";

export function updateStoredSearchResult(lab: LabSummary) {
	const storedResults = sessionStorage.getItem("searchResults");
	if (!storedResults) return;

	try {
		const results = JSON.parse(storedResults) as LabSummary[];
		const updatedResults = results.map((result) =>
			result.adventureGuid === lab.adventureGuid
				? {
						...lab,
						ownedByUser: result.ownedByUser,
						numAnswers: lab.numAnswers ?? result.numAnswers,
					}
				: result,
		);
		sessionStorage.setItem("searchResults", JSON.stringify(updatedResults));
	} catch {
		return;
	}
}
