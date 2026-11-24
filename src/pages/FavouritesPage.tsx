import { Link } from "react-router-dom";
import BackLink from "../components/BackLink";
import ResultsList from "../components/ResultsList";
import type { LatLng } from "../types";
import {
	DEFAULT_LATITUDE,
	DEFAULT_LONGITUDE,
	loadForm,
} from "../utils/loadForm";
import { loadStoredUserLocation } from "../utils/storedUserLocation";
import { useFavourites } from "../useFavourites";

function getDistanceCentre(): LatLng {
	const userLocation = loadStoredUserLocation();
	if (userLocation) return userLocation;

	const form = loadForm();
	const latitude = Number(form.latitude);
	const longitude = Number(form.longitude);
	return {
		latitude: Number.isFinite(latitude) ? latitude : DEFAULT_LATITUDE,
		longitude: Number.isFinite(longitude) ? longitude : DEFAULT_LONGITUDE,
	};
}

export default function FavouritesPage() {
	const { favourites } = useFavourites();
	const distanceCentre = getDistanceCentre();

	return (
		<section className="favourites-page">
			<p>
				<BackLink to="/">&larr; Back to search</BackLink>
			</p>
			<h1>Favourite labs ({favourites.length})</h1>
			{favourites.length ? (
				<ResultsList labs={favourites} searchCentre={distanceCentre} />
			) : (
				<p>
					No favourite labs yet.{" "}
					<Link to="/">
						Search for labs and star the ones you like.
					</Link>
				</p>
			)}
		</section>
	);
}
