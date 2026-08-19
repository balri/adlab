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
        <li key={lab.guid} className="results-list-item">
          <Link to={`/labs/${lab.guid}`}>{lab.title}</Link>
          <div className="results-list-meta">
            <span>by {lab.ownerName}</span>
            {lab.rating !== null && <span>★ {lab.rating.toFixed(1)}</span>}
            {lab.numberOfStages !== null && <span>{lab.numberOfStages} stages</span>}
          </div>
        </li>
      ))}
    </ul>
  );
}
