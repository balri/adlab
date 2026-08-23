import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import SearchForm from "../components/SearchForm";
import ResultsList from "../components/ResultsList";
import ResultsMap from "../components/ResultsMap";
import { searchLabs } from "../api";
import type { LabSummary, LatLng, SearchParams } from "../types";

function distanceBetween(a: LatLng, b: LatLng): number {
	const R = 6371000; // Earth radius in metres

	const lat1 = (a.latitude * Math.PI) / 180;
	const lat2 = (b.latitude * Math.PI) / 180;
	const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
	const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;

	const h =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

	return 2 * R * Math.asin(Math.sqrt(h));
}

function setCentreAndRadius(
	labs: LabSummary[],
	setCentre: (centre: LatLng) => void,
	setRadius: (radius: number) => void,
) {
	if (labs.length === 0) {
		return;
	}

	// Centre of the bounding area
	const lats = labs.map((l) => l.location.latitude);
	const lngs = labs.map((l) => l.location.longitude);

	const centre = {
		latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
		longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
	} as LatLng;
	setCentre(centre);

	// Furthest point from centre and add fudge factor
	const radius =
		Math.max(...labs.map((lab) => distanceBetween(centre, lab.location))) *
		1.1;
	setRadius(radius);
}

export default function SearchPage() {
	const navigate = useNavigate();
	const [labs, setLabs] = useState<LabSummary[]>(() => {
		const saved = sessionStorage.getItem("searchResults");
		return saved ? JSON.parse(saved) : [];
	});
	const [centre, setCentre] = useState<LatLng | null>(() => {
		const saved = sessionStorage.getItem("searchCentre");
		return saved ? JSON.parse(saved) : null;
	});
	const [radius, setRadius] = useState<number>(() => {
		const saved = sessionStorage.getItem("searchRadius");
		return saved ? JSON.parse(saved) : 0;
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		sessionStorage.setItem("searchResults", JSON.stringify(labs));
		sessionStorage.setItem("searchCentre", JSON.stringify(centre));
		sessionStorage.setItem("searchRadius", JSON.stringify(radius));
	}, [labs, centre, radius]);

	async function handleSearch(params: SearchParams) {
		setLoading(true);
		setError(null);
		try {
			const results = await searchLabs(params);
			setLabs(results);
			setCentreAndRadius(results, setCentre, setRadius);
		} catch (err) {
			setError((err as Error).message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="search-page">
			<SearchForm onSearch={handleSearch} loading={loading} />
			{error && <p className="error-text">{error}</p>}
			{centre && (
				<div className="search-results">
					<ResultsMap
						centre={centre}
						radius={radius}
						labs={labs}
						onSelect={(guid) => navigate(`/labs/${guid}`)}
					/>
					<ResultsList labs={labs} />
				</div>
			)}
		</div>
	);
}
