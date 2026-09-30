import { useState } from "react";
import { LabDetail, LabStage } from "../types";
import { useApi } from "../useApi";

interface SubmitAnswerProps {
	lab: LabDetail;
	stage: LabStage;
	onSuccess: (lab: LabDetail) => void;
	onError: (err: string) => void;
}

export default function SubmitAnswer({
	lab,
	stage,
	onSuccess,
	onError,
}: SubmitAnswerProps) {
	const { getLab, submitAnswer } = useApi();
	const [loading, setLoading] = useState<boolean>(false);

	const canAnswer =
		lab.ownerPublicGuid !== localStorage.getItem("userGuid") &&
		localStorage.getItem("userCanAnswer") == "true";

	if (!stage.correctAnswer || stage.isComplete || !canAnswer) {
		return null;
	}

	async function reloadLab() {
		if (!lab.adventureGuid) return;

		try {
			const refreshedLab = await getLab(lab.adventureGuid);

			sessionStorage.setItem(
				`lab_${lab.adventureGuid}`,
				JSON.stringify(refreshedLab),
			);

			onSuccess(refreshedLab);
		} catch (err) {
			onError((err as Error).message);
		}
	}

	async function handleSendAnswer(e: React.FormEvent) {
		e.preventDefault();

		if (!canAnswer || !stage.correctAnswer) {
			return;
		}

		setLoading(true);
		try {
			if (confirm("Are you sure you want to submit this answer?")) {
				const resp = await submitAnswer({
					adventureGuid: lab.adventureGuid || "",
					stageGuid: stage.id || "",
					answer: stage.correctAnswer,
					challengeType: stage.challengeType || "",
				});
				if (resp.result == "Success") {
					await reloadLab();
				} else {
					onError("An error occurred");
				}
			}
		} catch (err) {
			onError((err as Error).message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<>
			<button type="button" onClick={handleSendAnswer} disabled={loading}>
				{loading ? "Sending…" : "Send Answer"}
			</button>
		</>
	);
}
