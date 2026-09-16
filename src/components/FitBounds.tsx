import { useEffect } from "react";
import { useMap } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";

interface Props {
	bounds: LatLngBoundsExpression | null;
}

export default function FitBounds({ bounds }: Props) {
	const map = useMap();

	useEffect(() => {
		if (!bounds) {
			return;
		}

		map.fitBounds(bounds, {
			padding: [30, 30],
			maxZoom: 15,
		});
	}, [map, bounds]);

	return null;
}
