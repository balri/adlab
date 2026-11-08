import type { ReactNode } from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { LabSummary, LatLng } from "../types";
import SearchMap from "./SearchMap";

const mockMap = vi.hoisted(() => {
	const container = {
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
	};
	return {
		fitBounds: vi.fn(),
		flyTo: vi.fn(),
		getCenter: vi.fn(() => ({ lat: 0, lng: 0 })),
		getContainer: vi.fn(() => container),
		on: vi.fn(),
		off: vi.fn(),
	};
});

vi.mock("react-leaflet", () => ({
	MapContainer: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	Marker: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	Popup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	TileLayer: () => null,
	useMap: () => mockMap,
}));

function lab(guid: string, location: LatLng): LabSummary {
	return {
		adventureGuid: guid,
		title: guid,
		keyImageUrl: "",
		smartLink: "",
		deepLink: "",
		firebaseDynamicLink: "",
		description: "",
		ownerPublicGuid: "",
		createdUtc: "",
		publishedUtc: "",
		ratingsAverage: 0,
		ratingsTotalCount: 0,
		isHighlyRecommended: false,
		location,
		stagesTotalCount: 0,
		adventureType: "Nonsequential",
		completionStatus: "NotStarted",
		adventureThemes: [],
	};
}

function renderMap({
	centre,
	searchCentre,
	labs,
	centreMapRequest = 0,
}: {
	centre: LatLng;
	searchCentre: LatLng;
	labs: LabSummary[];
	centreMapRequest?: number;
}) {
	return render(
		<MemoryRouter>
			<SearchMap
				centre={centre}
				radius={5000}
				labs={labs}
				searchCentre={searchCentre}
				centreMapRequest={centreMapRequest}
				distanceCentre={searchCentre}
				onUserMapMove={vi.fn()}
			/>
		</MemoryRouter>,
	);
}

describe("SearchMap", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("keeps result bounds centered after results arrive", () => {
		const searchCentre = { latitude: 0, longitude: 0 };
		const resultCentre = { latitude: 10.5, longitude: 10.5 };
		const labs = [
			lab("lab-1", { latitude: 10, longitude: 10 }),
			lab("lab-2", { latitude: 11, longitude: 11 }),
		];
		const { rerender } = renderMap({
			centre: searchCentre,
			searchCentre,
			labs: [],
		});

		rerender(
			<MemoryRouter>
				<SearchMap
					centre={resultCentre}
					radius={5000}
					labs={labs}
					searchCentre={searchCentre}
					distanceCentre={searchCentre}
					onUserMapMove={vi.fn()}
				/>
			</MemoryRouter>,
		);

		expect(mockMap.fitBounds).toHaveBeenCalledWith(
			[
				[10, 10],
				[11, 11],
			],
			expect.objectContaining({ maxZoom: 15 }),
		);
		expect(mockMap.flyTo).toHaveBeenCalledTimes(1);
		expect(mockMap.flyTo).toHaveBeenCalledWith(
			[searchCentre.latitude, searchCentre.longitude],
			expect.any(Number),
		);
	});

	it("honors an explicit Centre map request with loaded results", () => {
		const resultCentre = { latitude: 10.5, longitude: 10.5 };
		const searchCentre = { latitude: 12, longitude: 12 };
		const labs = [
			lab("lab-1", { latitude: 10, longitude: 10 }),
			lab("lab-2", { latitude: 11, longitude: 11 }),
		];
		const { rerender } = renderMap({
			centre: resultCentre,
			searchCentre,
			labs,
		});
		expect(mockMap.flyTo).not.toHaveBeenCalled();

		rerender(
			<MemoryRouter>
				<SearchMap
					centre={resultCentre}
					radius={5000}
					labs={labs}
					searchCentre={searchCentre}
					centreMapRequest={1}
					distanceCentre={searchCentre}
					onUserMapMove={vi.fn()}
				/>
			</MemoryRouter>,
		);

		expect(mockMap.flyTo).toHaveBeenCalledWith(
			[searchCentre.latitude, searchCentre.longitude],
			expect.any(Number),
		);
	});
});
