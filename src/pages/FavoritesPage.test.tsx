import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { FavoritesProvider } from "../FavoritesProvider";
import type { LabSummary } from "../types";
import FavoritesPage from "./FavoritesPage";

const favoriteLab: LabSummary = {
	adventureGuid: "favorite-guid",
	title: "Saved Lab",
	keyImageUrl: "",
	smartLink: "",
	deepLink: "",
	firebaseDynamicLink: "",
	medianTimeToComplete: 0,
	description: "",
	ownerPublicGuid: "",
	createdUtc: "",
	publishedUtc: "",
	ratingsAverage: 4,
	ratingsTotalCount: 1,
	isHighlyRecommended: false,
	location: { latitude: -27.4, longitude: 153 },
	stagesTotalCount: 1,
	adventureType: "Nonsequential",
	completionStatus: "NotStarted",
	adventureThemes: [],
};

function renderPage() {
	return render(
		<MemoryRouter>
			<FavoritesProvider>
				<FavoritesPage />
			</FavoritesProvider>
		</MemoryRouter>,
	);
}

describe("FavoritesPage", () => {
	beforeEach(() => {
		localStorage.clear();
		sessionStorage.clear();
	});

	it("shows saved labs without requiring a search", () => {
		localStorage.setItem("favoriteLabs", JSON.stringify([favoriteLab]));
		renderPage();

		expect(
			screen.getByRole("heading", { name: "Favourite labs (1)" }),
		).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Saved Lab" })).toHaveAttribute(
			"href",
			"/labs/favorite-guid",
		);
		expect(
			screen.getByRole("link", { name: "← Back to search" }),
		).toHaveAttribute("href", "/");
		expect(screen.queryByRole("button", { name: "Search" })).toBeNull();
	});

	it("links to search when there are no saved labs", () => {
		renderPage();

		expect(screen.getByText("No favourite labs yet.")).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: "Favourite labs (0)" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", {
				name: "Search for labs and star the ones you like.",
			}),
		).toHaveAttribute("href", "/");
	});

	it("removes a saved lab from the favourites list", () => {
		localStorage.setItem("favoriteLabs", JSON.stringify([favoriteLab]));
		renderPage();

		fireEvent.click(
			screen.getByRole("button", {
				name: "Remove Saved Lab from favourites",
			}),
		);

		expect(
			screen.queryByRole("link", { name: "Saved Lab" }),
		).not.toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: "Favourite labs (0)" }),
		).toBeInTheDocument();
		expect(localStorage.getItem("favoriteLabs")).toBe("[]");
	});

	it("sorts favourites and displays distances from the saved search location", () => {
		const fartherLab = {
			...favoriteLab,
			adventureGuid: "farther-guid",
			title: "Farther Lab",
			location: { latitude: -27.5, longitude: 153 },
		};
		localStorage.setItem(
			"favoriteLabs",
			JSON.stringify([fartherLab, favoriteLab]),
		);
		localStorage.setItem(
			"searchForm",
			JSON.stringify({ latitude: "-27.4", longitude: "153" }),
		);
		renderPage();

		expect(
			Array.from(
				document.querySelectorAll<HTMLAnchorElement>(
					".results-list-title-row > a",
				),
			).map((link) => link.textContent),
		).toEqual(["Saved Lab", "Farther Lab"]);
		expect(screen.getByText("0.00 km")).toBeInTheDocument();
	});

	it("uses the stored user location before the saved search location", () => {
		const fartherLab = {
			...favoriteLab,
			adventureGuid: "farther-guid",
			title: "Farther Lab",
			location: { latitude: -27.5, longitude: 153 },
		};
		localStorage.setItem(
			"favoriteLabs",
			JSON.stringify([favoriteLab, fartherLab]),
		);
		localStorage.setItem(
			"searchForm",
			JSON.stringify({ latitude: "-27.4", longitude: "153" }),
		);
		sessionStorage.setItem(
			"userLocation",
			JSON.stringify({ latitude: -27.5, longitude: 153 }),
		);
		renderPage();

		expect(
			Array.from(
				document.querySelectorAll<HTMLAnchorElement>(
					".results-list-title-row > a",
				),
			).map((link) => link.textContent),
		).toEqual(["Farther Lab", "Saved Lab"]);
		expect(screen.getByText("0.00 km")).toBeInTheDocument();
	});
});
