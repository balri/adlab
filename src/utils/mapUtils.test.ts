import { describe, expect, it } from "vitest";
import type { LabSummary, LatLng } from "../types";
import { distanceBetween } from "./distanceBetween";
import { getBounds, getCentre, getRadius, radiusToZoom } from "./mapUtils";

function locations(...coordinates: Array<[number, number]>): LabSummary[] {
	return coordinates.map(([latitude, longitude]) => ({
		location: { latitude, longitude },
	})) as LabSummary[];
}

describe("map utilities", () => {
	it("returns no bounds or centre for an empty result set", () => {
		expect(getCentre([])).toBeNull();
		expect(getBounds([])).toBeNull();
		expect(getRadius({ latitude: 0, longitude: 0 }, [])).toBe(0);
	});

	it("calculates the centre and bounds of result locations", () => {
		const items = locations([-27, 152], [-25, 156]);

		expect(getCentre(items)).toEqual({ latitude: -26, longitude: 154 });
		expect(getBounds(items)).toEqual([
			[-27, 152],
			[-25, 156],
		]);
	});

	it("keeps a minimum map radius and expands it to cover distant items", () => {
		const centre: LatLng = { latitude: 0, longitude: 0 };

		expect(getRadius(centre, locations([0, 0]))).toBe(2000);
		expect(getRadius(centre, locations([0, 1]))).toBeGreaterThan(100_000);
	});

	it("uses a default zoom for invalid radii and zooms out for larger radii", () => {
		expect(radiusToZoom(0, 0, 800)).toBe(15);
		expect(radiusToZoom(Number.NaN, 0, 800)).toBe(15);
		expect(radiusToZoom(20_000, 0, 800)).toBeLessThan(
			radiusToZoom(10_000, 0, 800),
		);
	});

	it("calculates great-circle distance in metres", () => {
		const origin: LatLng = { latitude: 0, longitude: 0 };

		expect(distanceBetween(origin, origin)).toBe(0);
		expect(
			distanceBetween(origin, { latitude: 0, longitude: 1 }),
		).toBeCloseTo(111_195, -2);
	});
});
