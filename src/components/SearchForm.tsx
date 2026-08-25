import { useEffect, useState } from "react";
import type { SearchParams } from "../types";

interface Props {
	onSearch: (params: SearchParams) => void;
	loading: boolean;
}

export const DEFAULT_LATITUDE = -27.4698;
export const DEFAULT_LONGITUDE = 153.0251;
export const DEFAULT_RADIUS = 20000;
export const DEFAULT_TAKE = 25;
const STORAGE_KEY = "searchForm";

export default function SearchForm({ onSearch, loading }: Props) {
	const getSavedForm = () => {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);

			if (saved) {
				return JSON.parse(saved);
			}
		} catch {
			// Ignore invalid saved data
		}

		return {};
	};

	const savedForm = getSavedForm();
	const [latitude, setLatitude] = useState(
		savedForm.latitude ?? DEFAULT_LATITUDE,
	);
	const [longitude, setLongitude] = useState(
		savedForm.longitude ?? DEFAULT_LONGITUDE,
	);
	const [radius, setRadius] = useState(savedForm.radius ?? DEFAULT_RADIUS);
	const [take, setTake] = useState(savedForm.take ?? DEFAULT_TAKE);
	const [geoError, setGeoError] = useState<string | null>(null);

	useEffect(() => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				latitude,
				longitude,
				radius,
				take,
			}),
		);
	}, [latitude, longitude, radius, take]);

	function useMyLocation() {
		setGeoError(null);
		if (!navigator.geolocation) {
			setGeoError("Geolocation is not supported by this browser");
			return;
		}
		navigator.geolocation.getCurrentPosition(
			(position) => {
				setLatitude(position.coords.latitude.toFixed(6));
				setLongitude(position.coords.longitude.toFixed(6));
			},
			(err) => setGeoError(err.message),
		);
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const lat = Number(latitude);
		const lng = Number(longitude);
		if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
			setGeoError("Enter a valid latitude and longitude");
			return;
		}
		setGeoError(null);
		onSearch({
			latitude: lat,
			longitude: lng,
			radiusInMeters: radius,
			take,
		});
	}

	return (
		<form className="search-form" onSubmit={handleSubmit}>
			<div className="search-form-row">
				<label>
					Latitude
					<input
						type="number"
						step="any"
						value={latitude}
						onChange={(e) => setLatitude(e.target.value)}
						required
					/>
				</label>
				<label>
					Longitude
					<input
						type="number"
						step="any"
						value={longitude}
						onChange={(e) => setLongitude(e.target.value)}
						required
					/>
				</label>
				<button type="button" onClick={useMyLocation}>
					Use my location
				</button>
			</div>
			<div className="search-form-row">
				<label>
					Radius (m)
					<input
						type="number"
						min={100}
						max={100000}
						step={100}
						value={radius}
						onChange={(e) => setRadius(Number(e.target.value))}
					/>
				</label>
				<label>
					Max results
					<input
						type="number"
						min={1}
						max={100}
						value={take}
						onChange={(e) => setTake(Number(e.target.value))}
					/>
				</label>
				<button type="submit" disabled={loading}>
					{loading ? "Searching…" : "Search"}
				</button>
			</div>
			{geoError && <p className="error-text">{geoError}</p>}
		</form>
	);
}
