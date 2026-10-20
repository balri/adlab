import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { LabDetail, LatLng } from "../types";
import StatusChips from "../components/StatusChips";
import { useApi } from "../useApi";
import { loadForm } from "../utils/loadForm";
import { distanceBetween } from "../utils/distanceBetween";
import LabMeta from "../components/LabMeta";
import LabMap from "../components/LabMap";
import SubmitAnswer from "../components/SubmitAnswer";
import { canSubmitAllAnswers, canSubmitAnswer } from "../utils/canSubmitAnswer";
import { updateStoredSearchResult } from "../utils/updateStoredSearchResult";
import CoordinateLink from "../components/CoordinateLink";

export default function LabDetailPage() {
	const { guid } = useParams<{ guid: string }>();
	const { getLab, submitAnswer } = useApi();
	const [lab, setLab] = useState<LabDetail | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [submittingAll, setSubmittingAll] = useState(false);
	const [searchCentre, setSearchCentre] = useState<LatLng | null>(() => {
		const { latitude, longitude } = loadForm();
		return {
			latitude: Number(latitude),
			longitude: Number(longitude),
		} as LatLng;
	});

	useEffect(() => {
		async function loadLab() {
			if (!guid) return;

			const cacheKey = `lab_${guid}`;
			const cached = sessionStorage.getItem(cacheKey);

			if (cached) {
				try {
					const cachedLab = JSON.parse(cached) as LabDetail;
					updateStoredSearchResult(cachedLab);
					setLab(cachedLab);
					return;
				} catch {
					sessionStorage.removeItem(cacheKey);
				}
			}

			const controller = new AbortController();

			try {
				const lab = await getLab(guid, controller.signal);

				sessionStorage.setItem(cacheKey, JSON.stringify(lab));
				updateStoredSearchResult(lab);
				setLab(lab);
				const { latitude, longitude } = loadForm();
				setSearchCentre({
					latitude: Number(latitude),
					longitude: Number(longitude),
				});
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

	const currentLab = lab;
	const canSubmitAll = canSubmitAllAnswers(currentLab);

	async function handleSubmitAllAnswers() {
		if (
			!canSubmitAll ||
			!confirm("Are you sure you want to submit all answers?")
		) {
			return;
		}

		setSubmittingAll(true);
		try {
			for (const stage of currentLab.stageSummaries) {
				if (stage.isComplete) continue;

				const response = await submitAnswer({
					adventureGuid: currentLab.adventureGuid,
					stageGuid: stage.id,
					answer: stage.correctAnswer!,
					challengeType: stage.challengeType || "",
				});
				if (response.result !== "Success") {
					setError(`Could not submit the answer for ${stage.title}`);
					return;
				}
			}

			const refreshedLab = await getLab(currentLab.adventureGuid);
			sessionStorage.setItem(
				`lab_${currentLab.adventureGuid}`,
				JSON.stringify(refreshedLab),
			);
			updateStoredSearchResult(refreshedLab);
			setLab(refreshedLab);
		} catch (err) {
			setError((err as Error).message);
		} finally {
			setSubmittingAll(false);
		}
	}

	return (
		<div className="lab-detail">
			<p>
				<Link to="/">&larr; Back to search</Link>
			</p>
			<div className="lab-detail-header">
				<h1>
					{lab.title}
					<StatusChips lab={lab} />
				</h1>
				{lab.smartLink && (
					<p>
						<a
							href={`https://labs.geocaching.com/goto/${lab.smartLink}`}
							target="_blank"
							rel="noopener noreferrer"
							className="external-lab-link"
						>
							Open lab ↗
						</a>
					</p>
				)}
			</div>
			<LabMeta lab={lab} searchCentre={searchCentre} showReviews />
			<div className="lab-detail-content">
				{lab.keyImageUrl && <img src={lab.keyImageUrl} width="300" />}
				<div>
					<p>{lab.description}</p>
				</div>
			</div>
			<h2>Stages ({lab.stageSummaries.length})</h2>
			{lab.stageSummaries.length > 0 && searchCentre !== null && (
				<LabMap lab={lab} searchCentre={searchCentre} />
			)}
			{canSubmitAll && (
				<button
					type="button"
					onClick={handleSubmitAllAnswers}
					disabled={submittingAll}
				>
					{submittingAll ? "Submitting…" : "Submit All Answers"}
				</button>
			)}
			<ul className="results-list">
				{lab.stageSummaries.map((stage) => (
					<li key={stage.id} className="results-list-item">
						<Link to={`/labs/${guid}/stage/${stage.id}`}>
							{stage.title}
						</Link>
						<StatusChips lab={lab} stage={stage} />
						<div className="results-list-meta">
							<CoordinateLink location={stage.location} />
							{searchCentre && (
								<span>
									{(
										distanceBetween(
											stage.location,
											searchCentre,
										) / 1000
									).toFixed(2)}{" "}
									km
								</span>
							)}
						</div>
						<div className="stage-answer-submit">
							{canSubmitAnswer(lab, stage) && (
								<span className="success-text">
									{stage.correctAnswer}
								</span>
							)}
							<SubmitAnswer
								lab={lab}
								stage={stage}
								disabled={submittingAll}
								onSuccess={setLab}
								onError={setError}
							/>
						</div>
					</li>
				))}
			</ul>
		</div>
	);
}
