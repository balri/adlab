import type { LabSummary } from "../types";
import { useFavorites } from "../useFavorites";

export default function FavoriteButton({ lab }: { lab: LabSummary }) {
	const { favorites, toggleFavorite } = useFavorites();
	const isFavorite = favorites.some(
		(favorite) => favorite.adventureGuid === lab.adventureGuid,
	);

	return (
		<button
			type="button"
			className="favorite-button"
			aria-label={`${isFavorite ? "Remove" : "Add"} ${lab.title} ${isFavorite ? "from" : "to"} favourites`}
			aria-pressed={isFavorite}
			onClick={() => toggleFavorite(lab)}
		>
			{isFavorite ? "★" : "☆"}
		</button>
	);
}
