import { Link } from "react-router-dom";
import type { LabSummary } from "../types";
import StatusChips from "./StatusChips";

interface Props {
	labs: LabSummary[];
}

export default function ResultsList({ labs }: Props) {
	return (
		<ul className="results-list">
			{labs.map((lab) => (
				<li key={lab.adventureGuid} className="results-list-item">
					<Link to={`/labs/${lab.adventureGuid}`}>{lab.title}</Link>
					<StatusChips lab={lab} />
					<div className="results-list-meta">
						{lab.ratingsAverage !== null && (
							<span>★ {lab.ratingsAverage.toFixed(1)}</span>
						)}
						{lab.stagesTotalCount !== null && (
							<span>{lab.stagesTotalCount} stages</span>
						)}
					</div>
				</li>
			))}
		</ul>
	);
}
