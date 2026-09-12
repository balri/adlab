import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchForm from "./SearchForm";
import {
	DEFAULT_LATITUDE,
	DEFAULT_LONGITUDE,
	DEFAULT_RADIUS,
	DEFAULT_TAKE,
} from "../utils/loadForm";
import { beforeEach } from "vitest";

beforeEach(() => {
	localStorage.clear();
});

describe("SearchForm", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	function expandOptions() {
		fireEvent.click(screen.getByRole("button", { name: /Search options/ }));
	}

	it("submits the entered search params", () => {
		const onSearch = vi.fn();

		render(
			<SearchForm
				onSearch={onSearch}
				loading={false}
				searchCentre={null}
				onSearchCentreChange={() => {}}
			/>,
		);

		expandOptions();

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
		fireEvent.click(screen.getByLabelText("Completed"));
		fireEvent.click(screen.getByLabelText("Owned"));
		fireEvent.click(screen.getByRole("button", { name: "Search" }));

		expect(onSearch).toHaveBeenCalledWith({
			latitude: 10,
			longitude: 20,
			radiusInMeters: 5000,
			take: 10,
			statuses: ["NotStarted", "InProgress", "Completed"],
			excludeOwned: false,
		});
	});

	it("does not search when latitude is left empty", () => {
		const onSearch = vi.fn();

		render(
			<SearchForm
				onSearch={onSearch}
				loading={false}
				searchCentre={null}
				onSearchCentreChange={() => {}}
			/>,
		);

		expandOptions();

		fireEvent.change(screen.getByLabelText("Latitude"), {
			target: { value: "" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Search" }));

		expect(onSearch).not.toHaveBeenCalled();
	});

	it("disables the search button and shows a status while loading", () => {
		render(
			<SearchForm
				onSearch={() => {}}
				loading
				searchCentre={null}
				onSearchCentreChange={() => {}}
			/>,
		);

		expect(
			screen.getByRole("button", { name: "Searching…" }),
		).toBeDisabled();
	});

	it("reports the browser's geolocation via onSearchCentreChange", () => {
		vi.stubGlobal("navigator", {
			...navigator,
			geolocation: {
				getCurrentPosition: (success: PositionCallback) =>
					success({
						coords: { latitude: 51.5, longitude: -0.12 },
					} as GeolocationPosition),
			},
		});

		const onSearchCentreChange = vi.fn();

		render(
			<SearchForm
				onSearch={() => {}}
				loading={false}
				searchCentre={null}
				onSearchCentreChange={onSearchCentreChange}
			/>,
		);

		expandOptions();

		fireEvent.click(
			screen.getByRole("button", { name: "Use my location" }),
		);

		expect(onSearchCentreChange).toHaveBeenCalledWith({
			latitude: 51.5,
			longitude: -0.12,
		});
	});

	it("shows an error when geolocation is not supported", () => {
		vi.stubGlobal("navigator", {
			...navigator,
			geolocation: undefined,
		});

		render(
			<SearchForm
				onSearch={() => {}}
				loading={false}
				searchCentre={null}
				onSearchCentreChange={() => {}}
			/>,
		);

		expandOptions();

		fireEvent.click(
			screen.getByRole("button", { name: "Use my location" }),
		);

		expect(
			screen.getByText("Geolocation is not supported by this browser"),
		).toBeInTheDocument();
	});

	it("loads saved form values from localStorage", () => {
		localStorage.setItem(
			"searchForm",
			JSON.stringify({
				latitude: "-27.4698",
				longitude: "153.0251",
				radius: 5000,
				take: 25,
			}),
		);

		render(
			<SearchForm
				onSearch={() => {}}
				loading={false}
				searchCentre={null}
				onSearchCentreChange={() => {}}
			/>,
		);

		expandOptions();

		expect(screen.getByLabelText("Latitude")).toHaveValue(-27.4698);
		expect(screen.getByLabelText("Longitude")).toHaveValue(153.0251);
		expect(screen.getByLabelText("Radius (m)")).toHaveValue(5000);
		expect(screen.getByLabelText("Max results")).toHaveValue(25);
	});

	it("saves form values to localStorage when they change", async () => {
		const user = userEvent.setup();

		render(
			<SearchForm
				onSearch={() => {}}
				loading={false}
				searchCentre={null}
				onSearchCentreChange={() => {}}
			/>,
		);

		expandOptions();

		const latitude = screen.getByLabelText("Latitude");

		await user.clear(latitude);
		await user.type(latitude, "-27.4698");

		const saved = JSON.parse(localStorage.getItem("searchForm")!);

		expect(saved.latitude).toBe("-27.4698");
	});

	it("uses default values when nothing is saved", () => {
		render(
			<SearchForm
				onSearch={() => {}}
				loading={false}
				searchCentre={null}
				onSearchCentreChange={() => {}}
			/>,
		);

		expandOptions();

		expect(screen.getByLabelText("Latitude")).toHaveValue(DEFAULT_LATITUDE);
		expect(screen.getByLabelText("Longitude")).toHaveValue(
			DEFAULT_LONGITUDE,
		);
		expect(screen.getByLabelText("Radius (m)")).toHaveValue(DEFAULT_RADIUS);
		expect(screen.getByLabelText("Max results")).toHaveValue(DEFAULT_TAKE);
	});

	it("expands and collapses the search options", () => {
		render(
			<SearchForm
				onSearch={() => {}}
				loading={false}
				searchCentre={null}
				onSearchCentreChange={() => {}}
			/>,
		);

		expect(screen.queryByLabelText("Latitude")).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: /Search options/ }));

		expect(screen.getByLabelText("Latitude")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: /Search options/ }));

		expect(screen.queryByLabelText("Latitude")).not.toBeInTheDocument();
	});
});
