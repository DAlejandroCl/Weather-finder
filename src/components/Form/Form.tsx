import styles from "./Form.module.css";
import { countries } from "../../data/countries";
import { useState } from "react";
import { SearchSchema } from "../../schemas/searchSchema";
import type { SearchType } from "../../types";
import type { ChangeEvent, FormEvent } from "react";
import Alert from "../Alert/Alert";

type FormProps = {
  fetchWeather: (search: SearchType) => Promise<void>;
};

export default function Form({ fetchWeather }: FormProps) {
  const [search, setSearch] = useState<SearchType>({
    country: "",
    city: "",
  });

  const [alert, setAlert] = useState<string>("");

  const handleChange = (
    e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLSelectElement>
  ) => {
    setSearch({
      ...search,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validated = SearchSchema.safeParse(search);

    if (validated.success === false) {
      setAlert(validated.error.issues[0].message);
      return;
    }

    setAlert("");
    fetchWeather(validated.data);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {alert && <Alert>{alert}</Alert>}

      <div className={styles.field}>
        <label htmlFor="country">Country: </label>
        <select
          name="country"
          id="country"
          value={search.country}
          onChange={handleChange}
        >
          <option value="">--- Select Country ---</option>
          {countries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="city">City: </label>
        <input
          id="city"
          type="text"
          name="city"
          placeholder="City"
          value={search.city}
          onChange={handleChange}
        />
      </div>

      <input type="submit" value="Check weather" />
    </form>
  );
}
