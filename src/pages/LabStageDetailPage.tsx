import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getLab } from "../api";
import { type LabDetail } from "../types";
import LabStageJournal from "../components/LabStageJournal";
import LabStageQuestion from "../components/LabStageQuestion";
import StatusChips from "../components/StatusChips";

export default function LabStageDetailPage() {
	const { guid, stageId } = useParams<{ guid: string; stageId: string }>();
	const [lab, setLab] = useState<LabDetail | null>(() => {
		const saved = guid ? sessionStorage.getItem(`lab_${guid}`) : null;
		return saved ? JSON.parse(saved) : null;
	});
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!guid || lab) return;
		let ignore = false;

		getLab(guid)
			.then((result) => {
				if (ignore) return;
				setLab(result);
				setError(null);
				sessionStorage.setItem(`lab_${guid}`, JSON.stringify(result));
			})
			.catch((err) => {
				if (ignore) return;
				setLab(null);
				setError((err as Error).message);
			});
		return () => {
			ignore = true;
		};
	}, [guid, lab]);

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
