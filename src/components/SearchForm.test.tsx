import { fireEvent, render, screen } from "@testing-library/react";
import SearchForm from "./SearchForm";

describe("SearchForm", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("submits the entered search params", () => {
		const onSearch = vi.fn();
		render(<SearchForm onSearch={onSearch} loading={false} />);

		fireEvent.change(screen.getByLabelText("Latitude"), {
			target: { value: "10" },
		});
		fireEvent.change(screen.getByLabelText("Longitude"), {
			target: { value: "20" },
		});
		fireEvent.change(screen.getByLabelText("Radius (m)"), {
			target: { value: "5000" },
		});
		fireEvent.change(screen.getByLabelText("Max results"), {
			target: { value: "10" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Search" }));

		expect(onSearch).toHaveBeenCalledWith({
			latitude: 10,
			longitude: 20,
			radiusInMeters: 5000,
			take: 10,
		});
	});

	it("does not search when latitude is left empty", () => {
		const onSearch = vi.fn();
		render(<SearchForm onSearch={onSearch} loading={false} />);

		fireEvent.change(screen.getByLabelText("Latitude"), {
			target: { value: "" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Search" }));

		expect(onSearch).not.toHaveBeenCalled();
	});

	it("disables the search button and shows a status while loading", () => {
		render(<SearchForm onSearch={() => {}} loading />);

		expect(
			screen.getByRole("button", { name: "Searching…" }),
		).toBeDisabled();
	});

	it("fills in latitude and longitude from the browser's geolocation", () => {
		vi.stubGlobal("navigator", {
			...navigator,
			geolocation: {
				getCurrentPosition: (success: PositionCallback) =>
					success({
						coords: { latitude: 51.5, longitude: -0.12 },
					} as GeolocationPosition),
			},
		});
		render(<SearchForm onSearch={() => {}} loading={false} />);

		fireEvent.click(
			screen.getByRole("button", { name: "Use my location" }),
		);

		expect(screen.getByLabelText("Latitude")).toHaveValue(51.5);
		expect(screen.getByLabelText("Longitude")).toHaveValue(-0.12);
	});

	it("shows an error when geolocation is not supported", () => {
		vi.stubGlobal("navigator", { ...navigator, geolocation: undefined });
		render(<SearchForm onSearch={() => {}} loading={false} />);

		fireEvent.click(
			screen.getByRole("button", { name: "Use my location" }),
		);

		expect(
			screen.getByText("Geolocation is not supported by this browser"),
		).toBeInTheDocument();
	});
});
