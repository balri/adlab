import { useCallback } from "react";
import {
	CheckParams,
	CheckResponse,
	LabDetail,
	LabReviewsPage,
	LabSummary,
	SearchParams,
	SubmitParams,
	SubmitResponse,
} from "./types";
import { useAuth } from "./useAuth";

export function useApi() {
	const { authenticatedFetch } = useAuth();

	return {
		searchLabs: useCallback(
			async (params: SearchParams): Promise<LabSummary[]> => {
				const query = new URLSearchParams({
					lat: String(params.latitude),
					lng: String(params.longitude),
					radius: String(params.radiusInMeters),
					take: String(params.take),
					excludeOwned: String(params.excludeOwned),
				});
				params.statuses.forEach((status) => {
					query.append("statuses", status);
				});

				return await authenticatedFetch<LabSummary[]>(
					`/api/labs/search?${query}`,
				);
			},
			[authenticatedFetch],
		),
		getLab: useCallback(
			async (guid: string, signal?: AbortSignal): Promise<LabDetail> => {
				return await authenticatedFetch<LabDetail>(
					`/api/labs/${encodeURIComponent(guid)}`,
					signal,
				);
			},
			[authenticatedFetch],
		),
		getReviews: useCallback(
			async (
				guid: string,
				skip: number,
				take: number,
				signal?: AbortSignal,
			): Promise<LabReviewsPage> => {
				const query = new URLSearchParams({
					skip: String(skip),
					take: String(take),
				});
				return await authenticatedFetch<LabReviewsPage>(
					`/api/labs/${encodeURIComponent(guid)}/reviews?${query}`,
					signal,
				);
			},
			[authenticatedFetch],
		),
		checkAnswer: useCallback(
			async (
				params: CheckParams,
				signal?: AbortSignal,
			): Promise<CheckResponse> => {
				return await authenticatedFetch<CheckResponse>(
					`/api/labs/check`,
					signal,
					{
						method: "POST",
						body: JSON.stringify(params),
					},
				);
			},
			[authenticatedFetch],
		),
		submitAnswer: useCallback(
			async (
				params: SubmitParams,
				signal?: AbortSignal,
			): Promise<SubmitResponse> => {
				return await authenticatedFetch<SubmitResponse>(
					`/api/labs/submit`,
					signal,
					{
						method: "POST",
						body: JSON.stringify(params),
					},
				);
			},
			[authenticatedFetch],
		),
	};
}
