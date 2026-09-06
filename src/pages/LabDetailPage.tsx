import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { LabDetail } from "../types";
import StatusChips from "../components/StatusChips";
import { useApi } from "../useApi";

export default function LabDetailPage() {
	const { guid } = useParams<{ guid: string }>();
	const { getLab } = useApi();
	const [lab, setLab] = useState<LabDetail | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function loadLab() {
			if (!guid) return;

			const cacheKey = `lab_${guid}`;
			const cached = sessionStorage.getItem(cacheKey);

			if (cached) {
				try {
					setLab(JSON.parse(cached));
					return;
				} catch {
					sessionStorage.removeItem(cacheKey);
				}
			}

			const controller = new AbortController();

			try {
				const lab = await getLab(guid, controller.signal);

				sessionStorage.setItem(cacheKey, JSON.stringify(lab));
				setLab(lab);
			} catch (err) {
				if (controller.signal.aborted) return;
				setLab(null);
				setError((err as Error).message);
			}

			return () => {
				controller.abort();
			};
		}

		loadLab();
	}, [guid, getLab]);

	if (error) return <p className="error-text">{error}</p>;
	if (!lab) return <p>Loading…</p>;

	return (
		<div className="lab-detail">
			<p>
				<Link to="/">&larr; Back to search</Link>
			</p>
			<h1>
				{lab.title}
				<StatusChips lab={lab} />
			</h1>
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
						<StatusChips lab={lab} stage={stage} />
					</li>
				))}
			</ol>
		</div>
	);
}
