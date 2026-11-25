import { useEffect, useState } from "react";
import SearchForm from "../components/SearchForm";
import ResultsList from "../components/ResultsList";
import { SortOptionsToggle } from "../components/SortControls";
import type { LabSummary, LatLng, SearchParams } from "../types";
import { useApi } from "../useApi";
import {
	DEFAULT_LATITUDE,
	DEFAULT_LONGITUDE,
	DEFAULT_RADIUS,
	loadForm,
} from "../utils/loadForm";
import SearchMap from "../components/SearchMap";
import { getCentre, getRadius } from "../utils/mapUtils";
import {
	loadStoredUserLocation,
	storeUserLocation,
} from "../utils/storedUserLocation";
import { normalizeLabSummaries } from "../utils/normalizeLabSummaries";

function setCentreAndRadius(
	labs: LabSummary[],
	setCentre: (centre: LatLng) => void,
	setRadius: (radius: number) => void,
) {
	const centre = getCentre(labs);
	if (!centre) {
		return;
	}

	setCentre(centre);
	setRadius(getRadius(centre, labs));
}

export default function SearchPage() {
	const { searchLabs } = useApi();
	const [labs, setLabs] = useState<LabSummary[]>(() => {
		const saved = sessionStorage.getItem("searchResults");
		return saved ? normalizeLabSummaries(JSON.parse(saved)) : [];
	});
	const [hasSearched, setHasSearched] = useState(() => labs.length > 0);
	const [radius, setRadius] = useState<number>(() => {
		const saved = sessionStorage.getItem("searchRadius");
		return saved ? JSON.parse(saved) : DEFAULT_RADIUS;
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [sortOptionsExpanded, setSortOptionsExpanded] = useState(false);
	const [centreMapRequest, setCentreMapRequest] = useState(0);
	const [searchCentre, setSearchCentre] = useState<LatLng | null>(() => {
		const { latitude, longitude } = loadForm();
		return {
			latitude: Number(latitude),
			longitude: Number(longitude),
		} as LatLng;
	});
	const [userLocation, setUserLocation] = useState<LatLng | null>(
		loadStoredUserLocation,
	);
	const [userLocationTrackingEnabled, setUserLocationTrackingEnabled] =
		useState(() => loadStoredUserLocation() !== null);
	const distanceCentre = userLocation ?? searchCentre;
	const [mapInteractionCentre, setMapInteractionCentre] =
		useState<LatLng | null>(null);
	const [centre, setCentre] = useState<LatLng | null>(() => {
		const saved = sessionStorage.getItem("searchCentre");
		return saved
			? JSON.parse(saved)
			: searchCentre
				? searchCentre
				: { latitude: DEFAULT_LATITUDE, longitude: DEFAULT_LONGITUDE };
	});

	useEffect(() => {
		sessionStorage.setItem("searchResults", JSON.stringify(labs));
		sessionStorage.setItem("searchCentre", JSON.stringify(centre));
		sessionStorage.setItem("searchRadius", JSON.stringify(radius));
	}, [labs, centre, radius]);

	useEffect(() => {
		const geolocation = navigator.geolocation;
		if (
			!userLocationTrackingEnabled ||
			!geolocation ||
			typeof geolocation.watchPosition !== "function"
		)
			return;

		const watchId = geolocation.watchPosition(
			(position) => {
				const location = {
					latitude: position.coords.latitude,
					longitude: position.coords.longitude,
				};
				storeUserLocation(location);
				setUserLocation(location);
			},
			undefined,
			{ enableHighAccuracy: true, maximumAge: 10_000 },
		);

		return () => geolocation.clearWatch(watchId);
	}, [userLocationTrackingEnabled]);

	async function handleSearch(params: SearchParams) {
		setLoading(true);
		setError(null);
		setSearchCentre({
			latitude: params.latitude,
			longitude: params.longitude,
		});
		try {
			const results = await searchLabs(params);
			setLabs(results);
			setHasSearched(true);
			if (results.length === 0) {
				setError("No Adventure Labs found in this area.");
				return;
			}
			const resultsCentre = getCentre(results);
			if (resultsCentre) {
				setCentreAndRadius(results, setCentre, setRadius);
			}
		} catch (err) {
			setError((err as Error).message);
		} finally {
			setLoading(false);
		}
	}

	function handleUserLocationChange(location: LatLng) {
		storeUserLocation(location);
		setUserLocation(location);
		setUserLocationTrackingEnabled(true);
	}

	return (
		<div className="search-page">
			{searchCentre && (
				<SearchMap
					centre={centre || searchCentre}
					radius={radius}
					labs={labs}
					searchCentre={searchCentre}
					distanceCentre={distanceCentre}
					centreMapRequest={centreMapRequest}
					onUserMapMove={setMapInteractionCentre}
				/>
			)}
			<SearchForm
				onSearch={handleSearch}
				loading={loading}
				searchCentre={searchCentre}
				onSearchCentreChange={setSearchCentre}
				onCentreMap={() =>
					setCentreMapRequest((current) => current + 1)
				}
				onUserLocationChange={handleUserLocationChange}
				mapInteractionCentre={mapInteractionCentre}
				sortOptionsToggle={
					labs.length > 0 && (
						<SortOptionsToggle
							expanded={sortOptionsExpanded}
							onToggle={() =>
								setSortOptionsExpanded((current) => !current)
							}
						/>
					)
				}
				searchResultCount={
					hasSearched && (
						<span
							className="search-result-count"
							role="status"
							aria-label={`${labs.length} search result${labs.length === 1 ? "" : "s"} retrieved`}
						>
							{labs.length} result{labs.length === 1 ? "" : "s"}
						</span>
					)
				}
			/>
			{error && <p className="error-text">{error}</p>}
			{!!labs.length && (
				<div className="search-results">
					<ResultsList
						labs={labs}
						searchCentre={distanceCentre}
						sortOptionsExpanded={sortOptionsExpanded}
						onSortOptionsExpandedChange={setSortOptionsExpanded}
					/>
					{labs.some((lab) => (lab.meta?.numAnswers ?? 0) > 0) && (
						<p className="answer-count-disclaimer">
							* Answer counts are a guideline only; actual counts
							may differ.
						</p>
					)}
				</div>
			)}
		</div>
	);
}
