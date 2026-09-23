import { useCallback } from "react";
import {
	LabDetail,
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
		submitAnswer: useCallback(
			async (
				params: SubmitParams,
				signal?: AbortSignal,
			): Promise<SubmitResponse> => {
				const body = {
					...params,
					userGuid: localStorage.getItem("userGuid"),
				};
				return await authenticatedFetch<SubmitResponse>(
					`/api/labs/submit`,
					signal,
					{
						method: "POST",
						body: JSON.stringify(body),
					},
				);
			},
			[authenticatedFetch],
		),
	};
}
