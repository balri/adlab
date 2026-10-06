import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

	it("submits the entered search params", async () => {
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

		fireEvent.change(screen.getByLabelText("Location"), {
			target: { value: "10, 20" },
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

		await waitFor(() => {
			expect(onSearch).toHaveBeenCalledWith({
				latitude: 10,
				longitude: 20,
				radiusInMeters: 5000,
				take: 10,
				statuses: ["NotStarted", "InProgress", "Completed"],
				excludeOwned: false,
			});
		});
	});

	it("does not search when location is left empty", () => {
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

		fireEvent.change(screen.getByLabelText("Location"), {
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

	it("updates the location field and centre from browser geolocation", async () => {
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
		const onSearch = vi.fn();

		render(
			<SearchForm
				onSearch={onSearch}
				loading={false}
				searchCentre={null}
				onSearchCentreChange={onSearchCentreChange}
			/>,
		);

		fireEvent.click(
			screen.getByRole("button", { name: "Use my location" }),
		);

		expect(onSearchCentreChange).toHaveBeenCalledWith({
			latitude: 51.5,
			longitude: -0.12,
		});
		expect(screen.getByLabelText("Location")).toHaveValue("51.5, -0.12");

		fireEvent.click(screen.getByRole("button", { name: "Search" }));
		await waitFor(() => {
			expect(onSearch).toHaveBeenCalledWith(
				expect.objectContaining({
					latitude: 51.5,
					longitude: -0.12,
				}),
			);
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

		expect(screen.getByLabelText("Location")).toHaveValue(
			"-27.4698, 153.0251",
		);
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

		const location = screen.getByLabelText("Location");

		await user.clear(location);
		await user.type(location, "Brisbane");

		const saved = JSON.parse(localStorage.getItem("searchForm")!);

		expect(saved.location).toBe("Brisbane");
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

		expect(screen.getByLabelText("Location")).toHaveValue(
			`${DEFAULT_LATITUDE}, ${DEFAULT_LONGITUDE}`,
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

		expect(screen.getByLabelText("Location")).toBeInTheDocument();
		expect(screen.queryByLabelText("Radius (m)")).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: /Search options/ }));

		expect(screen.getByLabelText("Location")).toBeInTheDocument();
		expect(screen.getByLabelText("Radius (m)")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: /Search options/ }));

		expect(screen.getByLabelText("Location")).toBeInTheDocument();
		expect(screen.queryByLabelText("Radius (m)")).not.toBeInTheDocument();
	});

	it("centres on coordinates entered in the location field", async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);
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
		fireEvent.change(screen.getByLabelText("Location"), {
			target: { value: "51.5, -0.12" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Centre" }));

		await waitFor(() => {
			expect(onSearchCentreChange).toHaveBeenCalledWith({
				latitude: 51.5,
				longitude: -0.12,
			});
		});
		expect(screen.getByLabelText("Location")).toHaveValue("51.5, -0.12");
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("searches the new location after the map is moved", async () => {
		const onSearch = vi.fn();
		const { rerender } = render(
			<SearchForm
				onSearch={onSearch}
				loading={false}
				searchCentre={null}
				onSearchCentreChange={() => {}}
				mapInteractionCentre={null}
			/>,
		);

		rerender(
			<SearchForm
				onSearch={onSearch}
				loading={false}
				searchCentre={{ latitude: 51.5, longitude: -0.12 }}
				onSearchCentreChange={() => {}}
				mapInteractionCentre={{ latitude: 48.8566, longitude: 2.3522 }}
			/>,
		);

		expect(screen.getByLabelText("Location")).toHaveValue(
			"48.8566, 2.3522",
		);
		fireEvent.click(screen.getByRole("button", { name: "Search" }));

		await waitFor(() => {
			expect(onSearch).toHaveBeenCalledWith(
				expect.objectContaining({
					latitude: 48.8566,
					longitude: 2.3522,
				}),
			);
		});
	});

	it("centres on a place name returned by the geocoder", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => [{ lat: "51.5", lon: "-0.12" }],
			}),
		);
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
		fireEvent.change(screen.getByLabelText("Location"), {
			target: { value: "London" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Centre" }));

		await waitFor(() => {
			expect(onSearchCentreChange).toHaveBeenCalledWith({
				latitude: 51.5,
				longitude: -0.12,
			});
		});
		expect(screen.getByLabelText("Location")).toHaveValue("London");
		expect(fetch).toHaveBeenCalledWith(
			"https://nominatim.openstreetmap.org/search?q=London&format=jsonv2&limit=1",
		);
	});
});
