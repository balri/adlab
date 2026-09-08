import { LatLng } from "../types";

export function distanceBetween(a: LatLng, b: LatLng): number {
	const R = 6371000; // Earth radius in metres

	const lat1 = (a.latitude * Math.PI) / 180;
	const lat2 = (b.latitude * Math.PI) / 180;
	const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
	const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;

	const h =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

	return 2 * R * Math.asin(Math.sqrt(h));
}
