import { describe, expect, it } from "vitest";
import type { LatLng } from "../types";
import { compassDirection } from "./compassDirection";

describe("compassDirection", () => {
	const origin: LatLng = { latitude: 0, longitude: 0 };

	it.each([
		[{ latitude: 1, longitude: 0 }, "N"],
		[{ latitude: 1, longitude: 1 }, "NE"],
		[{ latitude: 0, longitude: 1 }, "E"],
		[{ latitude: -1, longitude: 1 }, "SE"],
		[{ latitude: -1, longitude: 0 }, "S"],
		[{ latitude: -1, longitude: -1 }, "SW"],
		[{ latitude: 0, longitude: -1 }, "W"],
		[{ latitude: 1, longitude: -1 }, "NW"],
	] as const)(
		"returns %s for a point in the expected direction",
		(destination, expected) => {
			expect(compassDirection(origin, destination)).toBe(expected);
		},
	);

	it("returns null when both points are the same", () => {
		expect(compassDirection(origin, origin)).toBeNull();
	});
});
