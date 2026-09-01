import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getLab } from "../api";
import type { LabDetail } from "../types";

export default function LabDetailPage() {
	const { guid } = useParams<{ guid: string }>();
	const [lab, setLab] = useState<LabDetail | null>(() => {
		const saved = guid ? sessionStorage.getItem(`lab_${guid}`) : null;
		return saved ? JSON.parse(saved) : null;
	});
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!guid || lab) return;
		const controller = new AbortController();

		getLab(guid, controller.signal)
			.then((result) => {
				setLab(result);
				setError(null);
				sessionStorage.setItem(`lab_${guid}`, JSON.stringify(result));
			})
			.catch((err) => {
				if (controller.signal.aborted) return;
				setLab(null);
				setError((err as Error).message);
			});
		return () => {
			controller.abort();
		};
	}, [guid, lab]);

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
						<Link to={`/labs/${guid}/stage/${stage.id}`}>
							{stage.title}
						</Link>
					</li>
				))}
			</ol>
		</div>
	);
}
