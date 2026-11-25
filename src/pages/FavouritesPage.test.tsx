import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { FavouritesProvider } from "../FavouritesProvider";
import type { LabSummary } from "../types";
import FavouritesPage from "./FavouritesPage";

const favouriteLab: LabSummary = {
	adventureGuid: "favourite-guid",
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
			<FavouritesProvider>
				<FavouritesPage />
			</FavouritesProvider>
		</MemoryRouter>,
	);
}

describe("FavouritesPage", () => {
	beforeEach(() => {
		localStorage.clear();
		sessionStorage.clear();
	});

	it("shows saved labs without requiring a search", () => {
		localStorage.setItem("favouriteLabs", JSON.stringify([favouriteLab]));
		renderPage();

		expect(
			screen.getByRole("heading", { name: "Favourite labs (1)" }),
		).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Saved Lab" })).toHaveAttribute(
			"href",
			"/labs/favourite-guid",
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

	it("migrates saved labs from the previous local storage key", () => {
		localStorage.setItem("favoriteLabs", JSON.stringify([favouriteLab]));
		renderPage();

		expect(
			screen.getByRole("heading", { name: "Favourite labs (1)" }),
		).toBeInTheDocument();
		expect(localStorage.getItem("favouriteLabs")).toBe(
			JSON.stringify([favouriteLab]),
		);
		expect(localStorage.getItem("favoriteLabs")).toBeNull();
	});

	it("moves calculated favourite fields into meta when loading older data", () => {
		localStorage.setItem(
			"favouriteLabs",
			JSON.stringify([
				{ ...favouriteLab, ownedByUser: true, numAnswers: 1 },
			]),
		);
		renderPage();

		expect(screen.getByText("Owned")).toBeInTheDocument();
		expect(screen.getByText("Has All Answers*")).toBeInTheDocument();
		const [storedFavourite] = JSON.parse(
			localStorage.getItem("favouriteLabs")!,
		);
		expect(storedFavourite.meta).toMatchObject({
			ownedByUser: true,
			numAnswers: 1,
		});
		expect(storedFavourite).not.toHaveProperty("ownedByUser");
		expect(storedFavourite).not.toHaveProperty("numAnswers");
	});

	it("removes a saved lab from the favourites list", () => {
		localStorage.setItem("favouriteLabs", JSON.stringify([favouriteLab]));
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
		expect(localStorage.getItem("favouriteLabs")).toBe("[]");
	});

	it("sorts favourites and displays distances from the saved search location", () => {
		const fartherLab = {
			...favouriteLab,
			adventureGuid: "farther-guid",
			title: "Farther Lab",
			location: { latitude: -27.5, longitude: 153 },
		};
		localStorage.setItem(
			"favouriteLabs",
			JSON.stringify([fartherLab, favouriteLab]),
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
			...favouriteLab,
			adventureGuid: "farther-guid",
			title: "Farther Lab",
			location: { latitude: -27.5, longitude: 153 },
		};
		localStorage.setItem(
			"favouriteLabs",
			JSON.stringify([favouriteLab, fartherLab]),
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
