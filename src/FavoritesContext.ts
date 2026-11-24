import { createContext } from "react";
import type { LabSummary } from "./types";

export interface FavoritesContextValue {
	favorites: LabSummary[];
	toggleFavorite: (lab: LabSummary) => void;
	updateFavorite: (lab: LabSummary) => void;
}

export const FavoritesContext = createContext<FavoritesContextValue | null>(
	null,
);
