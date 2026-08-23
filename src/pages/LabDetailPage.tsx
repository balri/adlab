import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getLab } from "../api";
import type { LabDetail } from "../types";
import { LabStageDetail } from "../components/LabStageDetail";

export default function LabDetailPage() {
	const { guid } = useParams<{ guid: string }>();
	const [lab, setLab] = useState<LabDetail | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!guid) return;
		let ignore = false;
		getLab(guid)
			.then((result) => {
				if (ignore) return;
				setLab(result);
				setError(null);
			})
			.catch((err) => {
				if (ignore) return;
				setLab(null);
				setError((err as Error).message);
			});
		return () => {
			ignore = true;
		};
	}, [guid]);

	if (error) return <p className="error-text">{error}</p>;
	if (!lab) return <p>Loading…</p>;

	return (
		<div className="lab-detail">
			<p>
				<Link to="/">&larr; Back to search</Link>
			</p>
			<h1>{lab.title}</h1>
			<div className="results-list-meta">
				<span>by {lab.ownerUsername}</span>
				{lab.ratingsAverage !== null && (
					<span>★ {lab.ratingsAverage.toFixed(1)}</span>
				)}
			</div>
			<div className="lab-detail-content">
				{lab.keyImageUrl && <img src={lab.keyImageUrl} width="300" />}
				<div>
					<p>{lab.description}</p>
				</div>
			</div>
			<h2>Stages ({lab.stageSummaries.length})</h2>
			<ol className="stage-list">
				{lab.stageSummaries.map((stage) => (
					<li key={stage.id}>
						<LabStageDetail stage={stage} />
					</li>
				))}
			</ol>
		</div>
	);
}
