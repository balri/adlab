import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { LabSummary } from "./types";
import { FavouritesContext } from "./FavouritesContext";
import { normalizeLabSummaries } from "./utils/normalizeLabSummaries";

const FAVOURITES_STORAGE_KEY = "favouriteLabs";
const LEGACY_FAVOURITES_STORAGE_KEY = "favoriteLabs";

function loadFavourites(): LabSummary[] {
	const stored = localStorage.getItem(FAVOURITES_STORAGE_KEY);
	const legacyStored =
		stored === null
			? localStorage.getItem(LEGACY_FAVOURITES_STORAGE_KEY)
			: null;
	const storageKey =
		stored === null
			? LEGACY_FAVOURITES_STORAGE_KEY
			: FAVOURITES_STORAGE_KEY;
	const value = stored ?? legacyStored;
	if (value === null) return [];

	let parsed: unknown;
	try {
		parsed = JSON.parse(value);
	} catch {
		localStorage.removeItem(storageKey);
		return [];
	}

	const favourites = normalizeLabSummaries(parsed);
	if (legacyStored !== null) {
		localStorage.setItem(
			FAVOURITES_STORAGE_KEY,
			JSON.stringify(favourites),
		);
		localStorage.removeItem(LEGACY_FAVOURITES_STORAGE_KEY);
	}
	return favourites;
}

export function FavouritesProvider({ children }: { children: ReactNode }) {
	const [favourites, setFavourites] = useState<LabSummary[]>(loadFavourites);

	useEffect(() => {
		localStorage.setItem(
			FAVOURITES_STORAGE_KEY,
			JSON.stringify(favourites),
		);
	}, [favourites]);

	const toggleFavourite = useCallback((lab: LabSummary) => {
		setFavourites((current) =>
			current.some(
				(favourite) => favourite.adventureGuid === lab.adventureGuid,
			)
				? current.filter(
						(favourite) =>
							favourite.adventureGuid !== lab.adventureGuid,
					)
				: [...current, lab],
		);
	}, []);

	const updateFavourite = useCallback((lab: LabSummary) => {
		setFavourites((current) =>
			current.map((favourite) =>
				favourite.adventureGuid === lab.adventureGuid ? lab : favourite,
			),
		);
	}, []);

	return (
		<FavouritesContext.Provider
			value={{ favourites, toggleFavourite, updateFavourite }}
		>
			{children}
		</FavouritesContext.Provider>
	);
}
