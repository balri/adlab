import { LabDetail, LabSummary, LatLng } from "../types";
import { distanceBetween } from "../utils/distanceBetween";

interface Props {
	lab: LabSummary | LabDetail;
	searchCentre: LatLng | null;
}

export default function LabMeta(props: Props) {
	const { lab, searchCentre } = props;

	let distance;
	if (searchCentre) {
		distance = distanceBetween(lab.location, searchCentre) / 1000;
	}

	let ownerUsername;
	if ("ownerUsername" in lab && typeof lab.ownerUsername === "string") {
		ownerUsername = lab.ownerUsername;
	}

	return (
		<div className="results-list-meta">
			{ownerUsername && <span>by {ownerUsername}</span>}
			{lab.ratingsAverage !== null && (
				<span>
					★ {lab.ratingsAverage.toFixed(1)} ({lab.ratingsTotalCount})
				</span>
			)}
			{lab.stagesTotalCount && <span>{lab.stagesTotalCount} stages</span>}
			{distance && <span>{distance.toFixed(2)} km</span>}
		</div>
	);
}
