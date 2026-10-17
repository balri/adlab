import { Link, useParams } from "react-router-dom";
import { useApi } from "../useApi";
import { useEffect, useRef, useState } from "react";
import { LabDetail, LabReviewsPage } from "../types";
import { updateStoredSearchResult } from "../utils/updateStoredSearchResult";

const REVIEW_PAGE_SIZE = 20;

export default function LabReviews() {
	const { guid } = useParams<{ guid: string }>();
	const { getLab, getReviews } = useApi();
	const [lab, setLab] = useState<LabDetail | null>(null);
	const [pageState, setPageState] = useState(() => ({ guid, index: 0 }));
	const [reviewResult, setReviewResult] = useState<{
		guid: string;
		page: number;
		data: LabReviewsPage;
	} | null>(null);
	const [reviewFailure, setReviewFailure] = useState<{
		guid: string;
		page: number;
		message: string;
	} | null>(null);
	const [selectedPhoto, setSelectedPhoto] = useState<{
		url: string;
		alt: string;
	} | null>(null);
	const photoDialogRef = useRef<HTMLDialogElement>(null);
	const photoOpenerRef = useRef<HTMLButtonElement | null>(null);
	const photoScrollPositionRef = useRef(0);
	const [error, setError] = useState<string | null>(null);
	const page = pageState.guid === guid ? pageState.index : 0;
	const reviewPage =
		reviewResult && reviewResult.guid === guid && reviewResult.page === page
			? reviewResult.data
			: null;
	const reviewError =
		reviewFailure &&
		reviewFailure.guid === guid &&
		reviewFailure.page === page
			? reviewFailure.message
			: null;
	const isLoadingReviews = !reviewPage && !reviewError;

	function updatePage(update: (currentPage: number) => number) {
		setPageState((current) => ({
			guid,
			index: update(current.guid === guid ? current.index : 0),
		}));
	}

	useEffect(() => {
		const controller = new AbortController();

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

			try {
				const lab = await getLab(guid, controller.signal);

				sessionStorage.setItem(cacheKey, JSON.stringify(lab));
				updateStoredSearchResult(lab);
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

	useEffect(() => {
		if (!guid) return;

		const currentGuid = guid;
		const controller = new AbortController();
		const skip = page * REVIEW_PAGE_SIZE;
		const cacheKey = `lab_reviews_${currentGuid}_${skip}_${REVIEW_PAGE_SIZE}`;

		async function loadReviews() {
			const cached = sessionStorage.getItem(cacheKey);
			if (cached) {
				try {
					const cachedPage = JSON.parse(cached) as LabReviewsPage;
					if (
						cachedPage &&
						typeof cachedPage === "object" &&
						typeof cachedPage.totalCount === "number" &&
						Array.isArray(cachedPage.items)
					) {
						setReviewResult({
							guid: currentGuid,
							page,
							data: cachedPage,
						});
						return;
					}
					sessionStorage.removeItem(cacheKey);
				} catch {
					sessionStorage.removeItem(cacheKey);
				}
			}

			try {
				const result = await getReviews(
					currentGuid,
					skip,
					REVIEW_PAGE_SIZE,
					controller.signal,
				);
				if (controller.signal.aborted) return;

				sessionStorage.setItem(cacheKey, JSON.stringify(result));
				setReviewResult({ guid: currentGuid, page, data: result });
			} catch (err) {
				if (controller.signal.aborted) return;
				setReviewFailure({
					guid: currentGuid,
					page,
					message: (err as Error).message,
				});
			}
		}

		loadReviews();
		return () => controller.abort();
	}, [guid, page, getReviews]);

	useEffect(() => {
		const dialog = photoDialogRef.current;
		if (!dialog) return;

		if (selectedPhoto && !dialog.open) {
			dialog.showModal();
		} else if (!selectedPhoto && dialog.open) {
			dialog.close();
		}
	}, [selectedPhoto]);

	if (!lab) {
		return error ? <p className="error-text">{error}</p> : <p>Loading…</p>;
	}

	const labUrl = `/labs/${guid}`;
	const reviews = reviewPage?.items ?? [];
	const totalCount = reviewPage?.totalCount ?? lab.reviewsTotalCount;
	const pageCount = Math.max(1, Math.ceil(totalCount / REVIEW_PAGE_SIZE));

	return (
		<div className="lab-reviews">
			<p>
				<Link to={labUrl}>&larr; Back to {lab.title}</Link>
			</p>
			<h1>{lab.title} reviews</h1>
			<p className="lab-review-count">{totalCount} total</p>
			{isLoadingReviews ? (
				<p>Loading reviews…</p>
			) : reviewError ? (
				<p className="error-text">{reviewError}</p>
			) : reviews.length === 0 ? (
				<p>
					{totalCount > 0
						? "No reviews were returned."
						: "No reviews yet."}
				</p>
			) : (
				<ul className="results-list lab-review-list">
					{reviews.map((review) => (
						<li className="results-list-item" key={review.id}>
							<div className="lab-review-header">
								<div className="lab-review-author">
									{review.playerAvatarUrl && (
										<img
											className="lab-review-avatar"
											src={review.playerAvatarUrl}
											alt=""
											loading="lazy"
										/>
									)}
									<strong>
										{review.playerUsername || "Geocacher"}
									</strong>
								</div>
								<div className="lab-review-meta">
									<time dateTime={review.createdUtc}>
										{formatReviewDate(
											review.createdUtc,
											review.createdDate,
										)}
									</time>
									<span
										className={`lab-review-rating${
											review.recommended
												? " lab-review-rating-recommended"
												: ""
										}`}
										aria-label={`${review.recommended ? "Recommended rating" : "Rating"}: ${review.rating} out of 5`}
									>
										★ {review.rating}/5
									</span>
								</div>
							</div>
							{review.reviewText && (
								<p className="lab-review-text">
									{review.reviewText}
								</p>
							)}
							{review.images.length > 0 && (
								<div className="lab-review-images">
									{review.images.map((image, index) => (
										<button
											key={image.id}
											type="button"
											aria-label={`View review photo ${index + 1} by ${review.playerUsername || "Geocacher"}`}
											onClick={(event) => {
												photoOpenerRef.current =
													event.currentTarget;
												photoScrollPositionRef.current =
													window.scrollY;
												setSelectedPhoto({
													url: image.url,
													alt: `Review photo ${index + 1} by ${review.playerUsername || "Geocacher"}`,
												});
											}}
										>
											<img
												className="lab-review-image"
												src={image.url}
												alt={`Review photo ${index + 1} by ${review.playerUsername || "Geocacher"}`}
												loading="lazy"
												decoding="async"
											/>
										</button>
									))}
								</div>
							)}
						</li>
					))}
				</ul>
			)}
			{totalCount > REVIEW_PAGE_SIZE && (
				<nav
					className="lab-review-pagination"
					aria-label="Review pages"
				>
					<button
						className="btn"
						type="button"
						disabled={page === 0 || isLoadingReviews}
						onClick={() =>
							updatePage((currentPage) => currentPage - 1)
						}
					>
						Previous
					</button>
					<span>
						Page {page + 1} of {pageCount}
					</span>
					<button
						className="btn"
						type="button"
						disabled={page >= pageCount - 1 || isLoadingReviews}
						onClick={() =>
							updatePage((currentPage) => currentPage + 1)
						}
					>
						Next
					</button>
				</nav>
			)}
			<dialog
				ref={photoDialogRef}
				className="lab-review-photo-dialog"
				aria-label="Review photo"
				onClose={() => {
					setSelectedPhoto(null);
					window.requestAnimationFrame(() => {
						photoOpenerRef.current?.focus({ preventScroll: true });
						window.scrollTo(0, photoScrollPositionRef.current);
					});
				}}
				onClick={(event) => {
					if (event.target === event.currentTarget) {
						setSelectedPhoto(null);
					}
				}}
			>
				<button
					className="lab-review-photo-close"
					type="button"
					onClick={() => setSelectedPhoto(null)}
				>
					Close
				</button>
				{selectedPhoto && (
					<img src={selectedPhoto.url} alt={selectedPhoto.alt} />
				)}
			</dialog>
		</div>
	);
}

function formatReviewDate(createdUtc: string, fallback: string): string {
	const date = new Date(createdUtc);
	if (Number.isNaN(date.getTime())) return fallback;

	return new Intl.DateTimeFormat(undefined, {
		month: "long",
		day: "numeric",
		year: "numeric",
	}).format(date);
}
