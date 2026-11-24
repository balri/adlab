import type { LabSummary } from "../types";
import { useFavourites } from "../useFavourites";

export default function FavouriteButton({ lab }: { lab: LabSummary }) {
	const { favourites, toggleFavourite } = useFavourites();
	const isFavourite = favourites.some(
		(favourite) => favourite.adventureGuid === lab.adventureGuid,
	);

	return (
		<button
			type="button"
			className="favourite-button"
			aria-label={`${isFavourite ? "Remove" : "Add"} ${lab.title} ${isFavourite ? "from" : "to"} favourites`}
			aria-pressed={isFavourite}
			onClick={() => toggleFavourite(lab)}
		>
			{isFavourite ? "★" : "☆"}
		</button>
	);
}
