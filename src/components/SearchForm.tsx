import { useEffect, useState } from "react";
import type {
	CompletionStatus,
	FormState,
	LatLng,
	SearchParams,
} from "../types";
import { FORM_STORAGE_KEY, loadForm } from "../utils/loadForm";

interface Props {
	onSearch: (params: SearchParams) => void;
	loading: boolean;
	searchCentre: LatLng | null;
	onSearchCentreChange: (centre: LatLng) => void;
	mapInteractionCentre?: LatLng | null;
}

function parseCoordinates(location: string): LatLng | null {
	const parts = location.split(",");
	if (parts.length !== 2 || parts.some((part) => !part.trim())) {
		return null;
	}

	const latitude = Number(parts[0]);
	const longitude = Number(parts[1]);
	if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
		return null;
	}
	if (
		latitude < -90 ||
		latitude > 90 ||
		longitude < -180 ||
		longitude > 180
	) {
		throw new Error("Latitude must be -90 to 90 and longitude -180 to 180");
	}

	return { latitude, longitude };
}

async function resolveLocation(location: string): Promise<LatLng> {
	const query = location.trim();
	if (!query) {
		throw new Error("Enter coordinates or a place name");
	}

	const coordinates = parseCoordinates(query);
	if (coordinates) {
		return coordinates;
	}

	const params = new URLSearchParams({
		q: query,
		format: "jsonv2",
		limit: "1",
	});
	const response = await fetch(
		`https://nominatim.openstreetmap.org/search?${params}`,
	);
	if (!response.ok) {
		throw new Error("Location lookup failed. Please try again.");
	}

	const results = (await response.json()) as Array<{
		lat: string;
		lon: string;
	}>;
	const result = results[0];
	if (!result) {
		throw new Error("No matching location found");
	}

	const centre = {
		latitude: Number(result.lat),
		longitude: Number(result.lon),
	};
	if (
		!Number.isFinite(centre.latitude) ||
		!Number.isFinite(centre.longitude) ||
		centre.latitude < -90 ||
		centre.latitude > 90 ||
		centre.longitude < -180 ||
		centre.longitude > 180
	) {
		throw new Error("The location service returned invalid coordinates");
	}

	return centre;
}

export default function SearchForm({
	onSearch,
	loading,
	searchCentre,
	onSearchCentreChange,
	mapInteractionCentre = null,
}: Props) {
	const [form, setForm] = useState<FormState>(loadForm);
	const [geoError, setGeoError] = useState<string | null>(null);
	const [resolvingLocation, setResolvingLocation] = useState(false);
	const [searching, setSearching] = useState(false);
	const [prevSearchCentre, setPrevSearchCentre] = useState(searchCentre);
	const [prevMapInteractionCentre, setPrevMapInteractionCentre] =
		useState(mapInteractionCentre);
	const [expanded, setExpanded] = useState(false);

	useEffect(() => {
		localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(form));
	}, [form]);

	if (searchCentre !== prevSearchCentre) {
		setPrevSearchCentre(searchCentre);
		if (searchCentre) {
			setForm((current) => ({
				...current,
				latitude: String(searchCentre.latitude),
				longitude: String(searchCentre.longitude),
			}));
		}
	}

	if (mapInteractionCentre !== prevMapInteractionCentre) {
		setPrevMapInteractionCentre(mapInteractionCentre);
		if (mapInteractionCentre) {
			setForm((current) => ({
				...current,
				location: `${mapInteractionCentre.latitude}, ${mapInteractionCentre.longitude}`,
				latitude: String(mapInteractionCentre.latitude),
				longitude: String(mapInteractionCentre.longitude),
			}));
		}
	}

	function updateForm<K extends keyof FormState>(
		field: K,
		value: FormState[K],
	) {
		setForm((current) => ({
			...current,
			[field]: value,
		}));
	}

	function toggleStatus(status: CompletionStatus) {
		setForm((current) => {
			const statuses = current.statuses.includes(status)
				? current.statuses.filter((s) => s !== status)
				: [...current.statuses, status];

			return { ...current, statuses };
		});
	}

	function useMyLocation() {
		setGeoError(null);

		if (!navigator.geolocation) {
			setGeoError("Geolocation is not supported by this browser");
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(position) => {
				const centre = {
					latitude: Number(position.coords.latitude.toFixed(6)),
					longitude: Number(position.coords.longitude.toFixed(6)),
				};
				applyLocationCentre(
					centre,
					`${centre.latitude}, ${centre.longitude}`,
				);
			},
			(err) => setGeoError(err.message),
		);
	}

	function applyLocationCentre(centre: LatLng, location?: string) {
		setForm((current) => ({
			...current,
			location: location ?? current.location,
			latitude: String(centre.latitude),
			longitude: String(centre.longitude),
		}));
		onSearchCentreChange(centre);
	}

	async function centreOnLocation() {
		setGeoError(null);
		setResolvingLocation(true);
		try {
			applyLocationCentre(await resolveLocation(form.location));
		} catch (err) {
			setGeoError((err as Error).message);
		} finally {
			setResolvingLocation(false);
		}
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setGeoError(null);
		setResolvingLocation(true);
		setSearching(true);
		try {
			const centre = await resolveLocation(form.location);
			applyLocationCentre(centre);
			onSearch({
				latitude: centre.latitude,
				longitude: centre.longitude,
				radiusInMeters: form.radius,
				take: form.take,
				statuses: form.statuses,
				excludeOwned: form.excludeOwned,
			});
		} catch (err) {
			setGeoError((err as Error).message);
		} finally {
			setResolvingLocation(false);
			setSearching(false);
		}
	}

	return (
		<form className="search-form" onSubmit={handleSubmit}>
			<div className="search-form-actions">
				<button
					type="button"
					className="location-button"
					aria-label="Use my location"
					title="Use my location"
					onClick={useMyLocation}
				>
					<svg
						aria-hidden="true"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
					>
						<circle cx="12" cy="12" r="4" />
						<path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
					</svg>
				</button>
				<div className="location-field">
					<input
						type="text"
						aria-label="Location"
						value={form.location}
						placeholder="Coordinates or place name"
						onChange={(e) => updateForm("location", e.target.value)}
						required
					/>
				</div>
				<button
					type="button"
					disabled={resolvingLocation}
					onClick={() => void centreOnLocation()}
				>
					{resolvingLocation ? "Locating…" : "Centre"}
				</button>
				<button type="submit" disabled={loading || resolvingLocation}>
					{loading || searching ? "Searching…" : "Search"}
				</button>
			</div>
			<button
				type="button"
				className="search-options-toggle"
				onClick={() => setExpanded((current) => !current)}
				aria-expanded={expanded}
			>
				Search options {expanded ? "▲" : "▼"}
			</button>

			{expanded && (
				<>
					<div className="search-form-row">
						<label>
							Radius (m)
							<input
								type="number"
								min={100}
								max={100000}
								step={100}
								value={form.radius}
								onChange={(e) =>
									updateForm("radius", Number(e.target.value))
								}
							/>
						</label>

						<label>
							Max results
							<input
								type="number"
								min={1}
								max={100}
								value={form.take}
								onChange={(e) =>
									updateForm("take", Number(e.target.value))
								}
							/>
						</label>
					</div>

					<div className="search-form-row">
						<label className="checkbox-label">
							<input
								type="checkbox"
								checked={form.statuses.includes("NotStarted")}
								onChange={() => toggleStatus("NotStarted")}
							/>
							Not Started
						</label>

						<label className="checkbox-label">
							<input
								type="checkbox"
								checked={form.statuses.includes("InProgress")}
								onChange={() => toggleStatus("InProgress")}
							/>
							In Progress
						</label>

						<label className="checkbox-label">
							<input
								type="checkbox"
								checked={form.statuses.includes("Completed")}
								onChange={() => toggleStatus("Completed")}
							/>
							Completed
						</label>
						<label className="checkbox-label">
							<input
								type="checkbox"
								checked={!form.excludeOwned}
								onChange={(e) =>
									updateForm(
										"excludeOwned",
										!e.target.checked,
									)
								}
							/>
							Owned
						</label>
					</div>
				</>
			)}
			{geoError && <p className="error-text">{geoError}</p>}
		</form>
	);
}
