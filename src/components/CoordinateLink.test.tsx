import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CoordinateLink from "./CoordinateLink";

const location = { latitude: -27.20575, longitude: 153.0761166667 };

describe("CoordinateLink", () => {
	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it("navigates to Google Maps and copies formatted coordinates", async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		vi.useFakeTimers();
		Object.defineProperty(navigator, "clipboard", {
			configurable: true,
			value: { writeText },
		});
		vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Android");

		render(<CoordinateLink location={location} />);

		expect(screen.getByRole("link", { name: "Navigate" })).toHaveAttribute(
			"href",
			"https://www.google.com/maps/search/?api=1&query=-27.20575,153.0761166667",
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Copy coordinates" }),
		);

		expect(writeText).toHaveBeenCalledWith("S27 12.345 E153 04.567");
		await act(async () => {
			await Promise.resolve();
		});
		expect(screen.getByText("Copied")).toBeInTheDocument();
		await act(async () => {
			await vi.advanceTimersByTimeAsync(1500);
		});
		expect(screen.getByText("Copy")).toBeInTheDocument();
	});

	it("uses Apple Maps on iOS", () => {
		vi.spyOn(navigator, "userAgent", "get").mockReturnValue("iPhone");

		render(<CoordinateLink location={location} />);

		expect(screen.getByRole("link", { name: "Navigate" })).toHaveAttribute(
			"href",
			"https://maps.apple.com/?ll=-27.20575,153.0761166667&q=-27.20575,153.0761166667",
		);
	});
});
