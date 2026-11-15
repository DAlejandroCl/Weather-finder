import { useEffect, useRef } from "react";
import type { Place } from "../../types";
import styles from "./PlacePicker.module.css";

type PlacePickerProps = {
  places: Place[];
  onSelect: (place: Place) => void;
};

/** "Springfield, Illinois, US": the name, the state when there is one, and the country. */
const placeLabel = (place: Place) =>
  [place.name, place.state, place.country].filter(Boolean).join(", ");

export default function PlacePicker({ places, onSelect }: PlacePickerProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Moving focus here announces the heading and puts keyboard users at the choices.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section className={styles.picker} aria-labelledby="place-picker-title">
      <h2 id="place-picker-title" ref={headingRef} tabIndex={-1} className={styles.title}>
        {places.length} places match
      </h2>
      <p className={styles.hint}>Choose the one you mean.</p>

      <ul className={styles.list}>
        {places.map((place) => (
          <li key={`${place.lat},${place.lon}`}>
            <button type="button" className={styles.option} onClick={() => onSelect(place)}>
              <span>{placeLabel(place)}</span>{" "}
              <span className={styles.coordinates}>
                {place.lat.toFixed(2)}°, {place.lon.toFixed(2)}°
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
