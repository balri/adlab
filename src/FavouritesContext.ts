import { createContext } from "react";
import type { LabSummary } from "./types";

export interface FavouritesContextValue {
	favourites: LabSummary[];
	toggleFavourite: (lab: LabSummary) => void;
	updateFavourite: (lab: LabSummary) => void;
}

export const FavouritesContext = createContext<FavouritesContextValue | null>(
	null,
);
