import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { type LabDetail } from "../types";
import LabStageJournal from "../components/LabStageJournal";
import LabStageQuestion from "../components/LabStageQuestion";
import StatusChips from "../components/StatusChips";
import { useApi } from "../useApi";

export default function LabStageDetailPage() {
	const { guid, stageId } = useParams<{ guid: string; stageId: string }>();
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

	const labUrl = `/labs/${guid}`;

	// The lab is now guaranteed to be loaded
	const stage = lab.stageSummaries.find((stage) => stage.id === stageId);

	const updateCorrectAnswer = (correctAnswer: string) => {
		setLab((currentLab) => {
			if (!currentLab) return currentLab;

			const updatedLab: LabDetail = {
				...currentLab,
				stageSummaries: currentLab.stageSummaries.map((s) =>
					s.id === stageId ? { ...s, correctAnswer } : s,
				),
			};

			sessionStorage.setItem(`lab_${guid}`, JSON.stringify(updatedLab));

			return updatedLab;
		});
	};

	if (!stage) {
		return <div>Stage not found</div>;
	}

	return (
		<div className="lab-stage-detail">
			<p>
				<Link to={labUrl}>&larr; Back to {lab.title}</Link>
			</p>
			<h1>
				{stage.title}
				<StatusChips lab={lab} stage={stage} />
			</h1>
			<div className="lab-detail-content">
				{stage.keyImageUrl && <img src={stage.keyImageUrl} />}
				<div>
					<p style={{ whiteSpace: "pre-line" }}>
						{stage.description}
					</p>
				</div>
			</div>
			<LabStageQuestion
				stage={stage}
				onUpdateStage={updateCorrectAnswer}
			/>
			{stage.isComplete && <LabStageJournal stage={stage} />}
		</div>
	);
}
