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
import { useFavorites } from "../useFavorites";

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

export default function FavoritesPage() {
	const { favorites } = useFavorites();
	const distanceCentre = getDistanceCentre();

	return (
		<section className="favorites-page">
			<p>
				<BackLink to="/">&larr; Back to search</BackLink>
			</p>
			<h1>Favourite labs ({favorites.length})</h1>
			{favorites.length ? (
				<ResultsList labs={favorites} searchCentre={distanceCentre} />
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
