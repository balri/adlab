import { useEffect, useState } from "react";
import { LabDetail, LabStage, LatLng } from "../types";
import { useApi } from "../useApi";
import { canSubmitAnswer } from "../utils/canSubmitAnswer";
import { updateStoredSearchResult } from "../utils/updateStoredSearchResult";

interface SubmitAnswerProps {
	lab: LabDetail;
	stage: LabStage;
	disabled?: boolean;
	onSuccess: (lab: LabDetail) => void;
	onError: (err: string) => void;
}

export default function SubmitAnswer({
	lab,
	stage,
	disabled = false,
	onSuccess,
	onError,
}: SubmitAnswerProps) {
	const { getLab, submitAnswer } = useApi();
	const [loading, setLoading] = useState<boolean>(false);
	const [userLocation, setUserLocation] = useState<LatLng | null>(null);
	const needsNearbyCheck =
		lab.ratingsTotalCount < 10 &&
		Boolean(stage.correctAnswer) &&
		!stage.isComplete &&
		localStorage.getItem("userCanAnswer") === "true";

	useEffect(() => {
		if (!needsNearbyCheck || !navigator.geolocation) return;

		let active = true;
		navigator.geolocation.getCurrentPosition(
			(position) => {
				if (!active) return;
				setUserLocation({
					latitude: position.coords.latitude,
					longitude: position.coords.longitude,
				});
			},
			() => {
				if (active) setUserLocation(null);
			},
			{ enableHighAccuracy: true, maximumAge: 30_000, timeout: 10_000 },
		);

		return () => {
			active = false;
		};
	}, [needsNearbyCheck, stage.location.latitude, stage.location.longitude]);

	const canAnswer = canSubmitAnswer(lab, stage, userLocation);

	if (!canAnswer) return null;

	async function reloadLab() {
		if (!lab.adventureGuid) return;

		try {
			const refreshedLab = await getLab(lab.adventureGuid);

			sessionStorage.setItem(
				`lab_${lab.adventureGuid}`,
				JSON.stringify(refreshedLab),
			);
			updateStoredSearchResult(refreshedLab);

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
			<button
				type="button"
				onClick={handleSendAnswer}
				disabled={loading || disabled}
			>
				{loading ? "Sending…" : "Send Answer"}
			</button>
		</>
	);
}
