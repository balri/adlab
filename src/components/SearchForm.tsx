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
}

export default function SearchForm({
	onSearch,
	loading,
	searchCentre,
	onSearchCentreChange,
}: Props) {
	const [form, setForm] = useState<FormState>(loadForm);
	const [geoError, setGeoError] = useState<string | null>(null);
	const [prevSearchCentre, setPrevSearchCentre] = useState(searchCentre);
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
				onSearchCentreChange({
					latitude: Number(position.coords.latitude.toFixed(6)),
					longitude: Number(position.coords.longitude.toFixed(6)),
				});
			},
			(err) => setGeoError(err.message),
		);
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		const latitude = Number(form.latitude);
		const longitude = Number(form.longitude);

		if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
			setGeoError("Enter a valid latitude and longitude");
			return;
		}

		setGeoError(null);

		onSearch({
			latitude,
			longitude,
			radiusInMeters: form.radius,
			take: form.take,
			statuses: form.statuses,
			excludeOwned: form.excludeOwned,
		});
	}

	return (
		<form className="search-form" onSubmit={handleSubmit}>
			<div className="search-form-row">
				<button type="submit" disabled={loading}>
					{loading ? "Searching…" : "Search"}
				</button>
				<button
					type="button"
					className="search-options-toggle"
					onClick={() => setExpanded((current) => !current)}
					aria-expanded={expanded}
				>
					Search options {expanded ? "▲" : "▼"}
				</button>
			</div>

			{expanded && (
				<>
					<div className="search-form-row">
						<label>
							Latitude
							<input
								type="number"
								step="any"
								value={form.latitude}
								onChange={(e) =>
									updateForm("latitude", e.target.value)
								}
								required
							/>
						</label>

						<label>
							Longitude
							<input
								type="number"
								step="any"
								value={form.longitude}
								onChange={(e) =>
									updateForm("longitude", e.target.value)
								}
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
