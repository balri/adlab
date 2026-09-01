import { useEffect, useState } from "react";
import type { CompletionStatus, SearchParams } from "../types";

interface Props {
	onSearch: (params: SearchParams) => void;
	loading: boolean;
}

export const DEFAULT_LATITUDE = -27.4698;
export const DEFAULT_LONGITUDE = 153.0251;
export const DEFAULT_RADIUS = 20000;
export const DEFAULT_TAKE = 25;

const STORAGE_KEY = "searchForm";

interface FormState {
	latitude: string;
	longitude: string;
	radius: number;
	take: number;
	statuses: CompletionStatus[];
}

const DEFAULT_FORM: FormState = {
	latitude: String(DEFAULT_LATITUDE),
	longitude: String(DEFAULT_LONGITUDE),
	radius: DEFAULT_RADIUS,
	take: DEFAULT_TAKE,
	statuses: ["NotStarted", "InProgress"],
};

function loadForm(): FormState {
	try {
		const saved = localStorage.getItem(STORAGE_KEY);

		if (saved) {
			return {
				...DEFAULT_FORM,
				...JSON.parse(saved),
			};
		}
	} catch {
		// Ignore invalid saved data
	}

	return DEFAULT_FORM;
}

export default function SearchForm({ onSearch, loading }: Props) {
	const [form, setForm] = useState<FormState>(loadForm);
	const [geoError, setGeoError] = useState<string | null>(null);

	useEffect(() => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
	}, [form]);

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
				setForm((current) => ({
					...current,
					latitude: position.coords.latitude.toFixed(6),
					longitude: position.coords.longitude.toFixed(6),
				}));
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
						value={form.latitude}
						onChange={(e) => updateForm("latitude", e.target.value)}
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
			</div>

			<div className="search-form-row">
				<button type="submit" disabled={loading}>
					{loading ? "Searching…" : "Search"}
				</button>
			</div>

			{geoError && <p className="error-text">{geoError}</p>}
		</form>
	);
}
