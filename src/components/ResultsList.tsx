import { Link } from "react-router-dom";
import type { LabSummary } from "../types";

interface Props {
  labs: LabSummary[];
}

export default function ResultsList({ labs }: Props) {
  if (labs.length === 0) {
    return <p>No Adventure Labs found in this area.</p>;
  }

  return (
    <ul className="results-list">
      {labs.map((lab) => (
        <li key={lab.adventureGuid} className="results-list-item">
          <Link to={`/labs/${lab.adventureGuid}`}>{lab.title}</Link>
          <div className="results-list-meta">
            {/* <span>by {lab.ownerName}</span> */}
            {lab.ratingsAverage !== null && <span>★ {lab.ratingsAverage.toFixed(1)}</span>}
            {lab.stagesTotalCount !== null && <span>{lab.stagesTotalCount} stages</span>}
          </div>
        </li>
      ))}
    </ul>
  );
}
