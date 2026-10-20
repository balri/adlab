import type { LatLng } from "../types";

interface Props {
	location: LatLng;
}

function formatCoordinate(
	coordinate: number,
	degreeDigits: number,
	positiveDirection: string,
	negativeDirection: string,
) {
	const roundedMinutes = Math.round(Math.abs(coordinate) * 60 * 1000);
	const degrees = Math.floor(roundedMinutes / 60000);
	const minutes = ((roundedMinutes % 60000) / 1000)
		.toFixed(3)
		.padStart(6, "0");
	const direction = coordinate < 0 ? negativeDirection : positiveDirection;

	return `${direction}${String(degrees).padStart(degreeDigits, "0")} ${minutes}`;
}

function formatCoordinates(location: LatLng) {
	return `${formatCoordinate(location.latitude, 2, "N", "S")} ${formatCoordinate(location.longitude, 3, "E", "W")}`;
}

export default function CoordinateLink({ location }: Props) {
	const coordinates = formatCoordinates(location);
	const mapUrl = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;

	return (
		<a
			href={mapUrl}
			target="_blank"
			rel="noopener noreferrer"
			title="Open in Google Maps"
		>
			{coordinates}
		</a>
	);
}
