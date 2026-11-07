import type { LatLng } from "../types";

const USER_LOCATION_STORAGE_KEY = "userLocation";

export function loadStoredUserLocation(): LatLng | null {
	try {
		const stored = sessionStorage.getItem(USER_LOCATION_STORAGE_KEY);
		if (!stored) return null;

		const location = JSON.parse(stored) as Partial<LatLng>;
		if (
			typeof location.latitude !== "number" ||
			!Number.isFinite(location.latitude) ||
			typeof location.longitude !== "number" ||
			!Number.isFinite(location.longitude)
		) {
			return null;
		}

		return {
			latitude: location.latitude,
			longitude: location.longitude,
		};
	} catch {
		return null;
	}
}

export function storeUserLocation(location: LatLng): void {
	sessionStorage.setItem(USER_LOCATION_STORAGE_KEY, JSON.stringify(location));
}
