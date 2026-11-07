import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { CompletionStatus, LabSummary, LatLng } from "../types";
import { distanceBetween } from "../utils/distanceBetween";
import StatusChips from "./StatusChips";
import LabMeta from "./LabMeta";
import SortControls, { type SortOption } from "./SortControls";

type LabSortField =
	| "name"
	| "date"
	| "rating"
	| "ratingsCount"
	| "answers"
	| "distance"
	| "status";

const completionStatusOrder: Record<CompletionStatus, number> = {
	NotStarted: 0,
	InProgress: 1,
	Completed: 2,
};

const sortOptions: SortOption<LabSortField>[] = [
	{ value: "name", label: "Name" },
	{ value: "date", label: "Date" },
	{ value: "rating", label: "Rating" },
	{ value: "ratingsCount", label: "Number of ratings" },
	{ value: "answers", label: "Number of answers" },
	{ value: "distance", label: "Distance" },
	{ value: "status", label: "Status" },
];

const sortFieldStorageKey = "searchSortField";
const sortDirectionStorageKey = "searchSortDirection";

function loadSortField(): LabSortField {
	const saved = sessionStorage.getItem(sortFieldStorageKey);
	return sortOptions.some((option) => option.value === saved)
		? (saved as LabSortField)
		: "distance";
}

function loadSortDirection(): "asc" | "desc" {
	return sessionStorage.getItem(sortDirectionStorageKey) === "desc"
		? "desc"
		: "asc";
}

interface Props {
	labs: LabSummary[];
	searchCentre: LatLng | null;
}

export default function ResultsList({ labs, searchCentre }: Props) {
	const [sortField, setSortField] = useState<LabSortField>(loadSortField);
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">(
		loadSortDirection,
	);
	const directionMultiplier = sortDirection === "asc" ? 1 : -1;
	const sortedLabs = [...labs].sort((a, b) => {
		let comparison = 0;
		switch (sortField) {
			case "name":
				comparison = a.title.localeCompare(b.title, undefined, {
					sensitivity: "base",
				});
				break;
			case "date": {
				const aDate = Date.parse(a.publishedUtc || "");
				const bDate = Date.parse(b.publishedUtc || "");
				if (Number.isNaN(aDate) || Number.isNaN(bDate)) {
					return Number.isNaN(aDate)
						? Number.isNaN(bDate)
							? 0
							: 1
						: -1;
				}
				comparison = aDate - bDate;
				break;
			}
			case "rating":
				comparison = a.ratingsAverage - b.ratingsAverage;
				break;
			case "ratingsCount":
				comparison = a.ratingsTotalCount - b.ratingsTotalCount;
				break;
			case "answers":
				comparison = (a.numAnswers ?? 0) - (b.numAnswers ?? 0);
				break;
			case "distance":
				comparison = searchCentre
					? distanceBetween(a.location, searchCentre) -
						distanceBetween(b.location, searchCentre)
					: 0;
				break;
			case "status":
				comparison =
					completionStatusOrder[a.completionStatus] -
					completionStatusOrder[b.completionStatus];
				break;
		}
		return comparison * directionMultiplier;
	});

	useEffect(() => {
		sessionStorage.setItem(sortFieldStorageKey, sortField);
		sessionStorage.setItem(sortDirectionStorageKey, sortDirection);
	}, [sortField, sortDirection]);

	return (
		<>
			<SortControls
				options={sortOptions}
				value={sortField}
				onValueChange={setSortField}
				direction={sortDirection}
				onDirectionChange={setSortDirection}
			/>
			<ul className="results-list">
				{sortedLabs.map((lab) => (
					<li key={lab.adventureGuid} className="results-list-item">
						<Link to={`/labs/${lab.adventureGuid}`}>
							{lab.title}
						</Link>
						<StatusChips lab={lab} />
						<LabMeta lab={lab} searchCentre={searchCentre} />
					</li>
				))}
			</ul>
		</>
	);
}
