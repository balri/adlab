import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { LabSummary } from "./types";
import { FavoritesContext } from "./FavoritesContext";

const FAVORITES_STORAGE_KEY = "favoriteLabs";

function isLabSummary(value: unknown): value is LabSummary {
	if (!value || typeof value !== "object") return false;

	const lab = value as Partial<LabSummary>;
	return (
		typeof lab.adventureGuid === "string" &&
		typeof lab.title === "string" &&
		typeof lab.location?.latitude === "number" &&
		typeof lab.location?.longitude === "number"
	);
}

function loadFavorites(): LabSummary[] {
	const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
	if (!stored) return [];

	try {
		const parsed: unknown = JSON.parse(stored);
		return Array.isArray(parsed) ? parsed.filter(isLabSummary) : [];
	} catch {
		localStorage.removeItem(FAVORITES_STORAGE_KEY);
		return [];
	}
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
	const [favorites, setFavorites] = useState<LabSummary[]>(loadFavorites);

	useEffect(() => {
		localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
	}, [favorites]);

	const toggleFavorite = useCallback((lab: LabSummary) => {
		setFavorites((current) =>
			current.some(
				(favorite) => favorite.adventureGuid === lab.adventureGuid,
			)
				? current.filter(
						(favorite) =>
							favorite.adventureGuid !== lab.adventureGuid,
					)
				: [...current, lab],
		);
	}, []);

	const updateFavorite = useCallback((lab: LabSummary) => {
		setFavorites((current) =>
			current.map((favorite) =>
				favorite.adventureGuid === lab.adventureGuid ? lab : favorite,
			),
		);
	}, []);

	return (
		<FavoritesContext.Provider
			value={{ favorites, toggleFavorite, updateFavorite }}
		>
			{children}
		</FavoritesContext.Provider>
	);
}
