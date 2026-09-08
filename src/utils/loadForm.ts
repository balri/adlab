import { FormState } from "../types";

export const DEFAULT_LATITUDE = -27.4698;
export const DEFAULT_LONGITUDE = 153.0251;
export const DEFAULT_RADIUS = 20000;
export const DEFAULT_TAKE = 25;

const DEFAULT_FORM: FormState = {
	latitude: String(DEFAULT_LATITUDE),
	longitude: String(DEFAULT_LONGITUDE),
	radius: DEFAULT_RADIUS,
	take: DEFAULT_TAKE,
	statuses: ["NotStarted", "InProgress"],
	excludeOwned: true,
};

export const FORM_STORAGE_KEY = "searchForm";

export function loadForm(): FormState {
	try {
		const saved = localStorage.getItem(FORM_STORAGE_KEY);

		if (saved) {
			return {
				...DEFAULT_FORM,
				...JSON.parse(saved),
			};
		}
	} catch {
		// Ignore invalid saved data
	}

	return DEFAULT_FORM;
}
