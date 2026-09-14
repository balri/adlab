import { Link } from "react-router-dom";
import type { LabSummary, LatLng } from "../types";
import StatusChips from "./StatusChips";
import LabMeta from "./LabMeta";

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
					<LabMeta lab={lab} searchCentre={searchCentre} />
				</li>
			))}
		</ul>
	);
}
