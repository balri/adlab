import type { LatLng } from "../types";

const DIRECTIONS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;

export function compassDirection(
	from: LatLng,
	to: LatLng,
): (typeof DIRECTIONS)[number] | null {
	if (from.latitude === to.latitude && from.longitude === to.longitude) {
		return null;
	}

	const latitude1 = (from.latitude * Math.PI) / 180;
	const latitude2 = (to.latitude * Math.PI) / 180;
	const longitudeDifference =
		((to.longitude - from.longitude) * Math.PI) / 180;
	const y = Math.sin(longitudeDifference) * Math.cos(latitude2);
	const x =
		Math.cos(latitude1) * Math.sin(latitude2) -
		Math.sin(latitude1) *
			Math.cos(latitude2) *
			Math.cos(longitudeDifference);
	const bearing = (Math.atan2(y, x) * 180) / Math.PI;
	const normalizedBearing = (bearing + 360) % 360;

	return DIRECTIONS[Math.round(normalizedBearing / 45) % DIRECTIONS.length];
}
