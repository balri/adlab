import L from "leaflet";
import { LabStage, LabSummary, LatLng } from "../types";
import { distanceBetween } from "./distanceBetween";

interface Props {
	lab?: LabSummary;
	stage?: LabStage;
}

export const statusMarker = (props: Props) => {
	const { lab, stage } = props;
	let colour = "#fff";
	if (lab) {
		colour =
			lab.ownerPublicGuid === localStorage.getItem("userGuid")
				? "#1976d2"
				: {
						NotStarted: "#c62828",
						InProgress: "#e09f00",
						Completed: "#388e3c",
					}[lab.completionStatus];
	}
	if (stage) {
		colour = stage.isComplete ? "#388e3c" : "#c62828";
	}

	return L.divIcon({
		className: "",
		html: `
	  <svg
		xmlns="http://www.w3.org/2000/svg"
		width="20"
		height="33"
		viewBox="0 0 25 41"
	  >
		<path
		  fill="${colour}"
		  stroke="#fff"
		  stroke-width="1"
		  d="M12.5 0C5.6 0 0 5.6 0 12.5c0 9.4 12.5 28.5 12.5 28.5S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0z"
		/>
		<circle
		  cx="12.5"
		  cy="12.5"
		  r="4"
		  fill="#fff"
		/>
	  </svg>
	`,
		iconSize: [20, 33],
		iconAnchor: [10, 33],
		popupAnchor: [0, -33],
	});
};

export function radiusToZoom(
	radius: number,
	latitude: number,
	mapWidthPixels: number,
): number {
	const earthCircumference = 40075016.686;

	const metresPerPixelAtZoom0 =
		(earthCircumference * Math.cos((latitude * Math.PI) / 180)) / 256;

	const desiredPixels = mapWidthPixels / 2;

	return Math.log2((metresPerPixelAtZoom0 * desiredPixels) / radius);
}

export function getCentre(items: LabSummary[] | LabStage[]): LatLng | null {
	if (items.length === 0) {
		return null;
	}

	// Centre of the bounding area
	const lats = items.map((i) => i.location.latitude);
	const lngs = items.map((i) => i.location.longitude);

	return {
		latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
		longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
	} as LatLng;
}

// Furthest point from centre and add fudge factor
export function getRadius(
	centre: LatLng,
	items: LabSummary[] | LabStage[],
): number {
	return (
		Math.max(
			...items.map((item) => distanceBetween(centre, item.location)),
		) * 1.1
	);
}
