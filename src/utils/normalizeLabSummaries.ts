import type { LabDetail, LabStatusMeta, LabSummary } from "../types";

export function normalizeLabSummaries(value: unknown): LabSummary[] {
	if (!Array.isArray(value)) return [];

	return value
		.map((item): LabSummary | null => {
			if (!item || typeof item !== "object") return null;

			const stored = item as Record<string, unknown>;
			const location = stored.location as
				{ latitude?: unknown; longitude?: unknown } | undefined;
			if (
				typeof stored.adventureGuid !== "string" ||
				typeof stored.title !== "string" ||
				typeof location?.latitude !== "number" ||
				typeof location.longitude !== "number"
			) {
				return null;
			}

			const storedMeta =
				stored.meta && typeof stored.meta === "object"
					? (stored.meta as Partial<LabStatusMeta>)
					: {};
			const meta: LabStatusMeta = {
				...storedMeta,
				ownedByUser:
					storedMeta.ownedByUser ??
					(typeof stored.ownedByUser === "boolean"
						? stored.ownedByUser
						: undefined),
				numAnswers:
					storedMeta.numAnswers ??
					(typeof stored.numAnswers === "number"
						? stored.numAnswers
						: undefined),
			};
			const summary = { ...stored };
			delete summary.ownedByUser;
			delete summary.numAnswers;
			delete summary.meta;

			return {
				...summary,
				...(Object.values(meta).some((field) => field !== undefined)
					? { meta }
					: {}),
			} as LabSummary;
		})
		.filter((lab): lab is LabSummary => lab !== null);
}

export function normalizeLabDetail(value: unknown): LabDetail | null {
	if (!value || typeof value !== "object") return null;
	const stored = value as Record<string, unknown>;
	if (!Array.isArray(stored.stageSummaries)) return null;

	return (normalizeLabSummaries([value])[0] as LabDetail | undefined) ?? null;
}
