import { Link } from "react-router-dom";
import type { LabSummary, LatLng } from "../types";
import StatusChips from "./StatusChips";
import { distanceBetween } from "../utils/distanceBetween";

interface Props {
	labs: LabSummary[];
	searchCentre: LatLng | null;
}

export default function ResultsList({ labs, searchCentre }: Props) {
	return (
		<ul className="results-list">
			{labs.map((lab) => (
				<li key={lab.adventureGuid} className="results-list-item">
					<Link to={`/labs/${lab.adventureGuid}`}>{lab.title}</Link>
					<StatusChips lab={lab} />
					<div className="results-list-meta">
						{lab.ratingsAverage !== null && (
							<span>
								★ {lab.ratingsAverage.toFixed(1)} (
								{lab.ratingsTotalCount})
							</span>
						)}
						{lab.stagesTotalCount !== null && (
							<span>{lab.stagesTotalCount} stages</span>
						)}
						{searchCentre && (
							<span>
								{(
									distanceBetween(
										lab.location,
										searchCentre,
									) / 1000
								).toFixed(2)}{" "}
								km
							</span>
						)}
					</div>
				</li>
			))}
		</ul>
	);
}
