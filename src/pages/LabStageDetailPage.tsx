import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { type LabDetail } from "../types";
import LabStageJournal from "../components/LabStageJournal";
import LabStageQuestion from "../components/LabStageQuestion";
import StatusChips from "../components/StatusChips";
import { useApi } from "../useApi";

export default function LabStageDetailPage() {
	const { guid, stageId } = useParams<{ guid: string; stageId: string }>();
	const { getLab, submitAnswer } = useApi();
	const [lab, setLab] = useState<LabDetail | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const controller = new AbortController();

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

			try {
				const lab = await getLab(guid, controller.signal);

				sessionStorage.setItem(cacheKey, JSON.stringify(lab));
				setLab(lab);
			} catch (err) {
				if (controller.signal.aborted) return;
				setLab(null);
				setError((err as Error).message);
			}
		}

		loadLab();

		return () => {
			controller.abort();
		};
	}, [guid, getLab]);

	if (!lab) return <p>Loading…</p>;

	const labUrl = `/labs/${guid}`;

	// The lab is now guaranteed to be loaded
	const stage = lab.stageSummaries.find((stage) => stage.id === stageId);
	const canAnswer =
		lab.ownerPublicGuid !== localStorage.getItem("userGuid") &&
		localStorage.getItem("userCanAnswer") == "true";

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

	async function reloadLab() {
		if (!guid) return;

		try {
			const refreshedLab = await getLab(guid);

			sessionStorage.setItem(`lab_${guid}`, JSON.stringify(refreshedLab));

			setLab(refreshedLab);
		} catch (err) {
			setError((err as Error).message);
		}
	}

	async function handleSendAnswer(answer: string) {
		setLoading(true);
		setError(null);
		try {
			if (confirm("Are you sure you want to submit this answer?")) {
				const resp = await submitAnswer({
					adventureGuid: lab?.adventureGuid || "",
					stageGuid: stage?.id || "",
					answer,
					challengeType: stage?.challengeType || "",
				});
				if (resp.result == "Success") {
					await reloadLab();
				} else {
					setError("An error occurred");
				}
			}
		} catch (err) {
			setError((err as Error).message);
		} finally {
			setLoading(false);
		}
	}

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
			{error && <p className="error-text">{error}</p>}
			<div className="lab-detail-content">
				{stage.keyImageUrl && <img src={stage.keyImageUrl} />}
				<div>
					<p style={{ whiteSpace: "pre-line" }}>
						{stage.description}
					</p>
				</div>
			</div>
			<LabStageQuestion
				loading={loading}
				stage={stage}
				onUpdateStage={updateCorrectAnswer}
				canAnswer={canAnswer}
				onSubmit={handleSendAnswer}
			/>
			{stage.isComplete && <LabStageJournal stage={stage} />}
		</div>
	);
}
