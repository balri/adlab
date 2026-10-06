import { FormState } from "../types";

export const DEFAULT_LATITUDE = -27.469518;
export const DEFAULT_LONGITUDE = 153.031593;
export const DEFAULT_RADIUS = 10000;
export const DEFAULT_TAKE = 25;

const DEFAULT_FORM: FormState = {
	location: `${DEFAULT_LATITUDE}, ${DEFAULT_LONGITUDE}`,
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
			const savedForm = JSON.parse(saved) as Partial<FormState>;
			const latitude = String(
				savedForm.latitude ?? DEFAULT_FORM.latitude,
			);
			const longitude = String(
				savedForm.longitude ?? DEFAULT_FORM.longitude,
			);

			return {
				...DEFAULT_FORM,
				...savedForm,
				location: savedForm.location ?? `${latitude}, ${longitude}`,
				latitude,
				longitude,
			};
		}
	} catch {
		// Ignore invalid saved data
	}

	return DEFAULT_FORM;
}
