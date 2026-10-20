import { Link } from "react-router-dom";
import { LabDetail, LabSummary, LatLng } from "../types";
import { distanceBetween } from "../utils/distanceBetween";

interface Props {
	lab: LabSummary | LabDetail;
	searchCentre: LatLng | null;
	showReviews?: boolean;
}

export default function LabMeta(props: Props) {
	const { lab, searchCentre, showReviews = false } = props;

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
				<span
					className={
						lab.isHighlyRecommended
							? "lab-review-rating-recommended"
							: undefined
					}
					title={lab.isHighlyRecommended ? "Recommended" : ""}
				>
					★ {lab.ratingsAverage.toFixed(1)} ({lab.ratingsTotalCount})
				</span>
			)}
			{lab.stagesTotalCount && <span>{lab.stagesTotalCount} stages</span>}
			{distance && <span>{distance.toFixed(2)} km</span>}
			{showReviews &&
				"reviewsTotalCount" in lab &&
				lab.reviewsTotalCount > 0 && (
					<Link to={`/labs/${lab.adventureGuid}/reviews`}>
						Reviews ({lab.reviewsTotalCount})
					</Link>
				)}
		</div>
	);
}
