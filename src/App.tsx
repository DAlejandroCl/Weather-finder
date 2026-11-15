import styles from "./App.module.css";
import Form from "./components/Form/Form";
import WeatherDetails from "./components/WeatherDetails/WeatherDetails";
import Spinner from "./components/Spinner/Spinner";
import Alert from "./components/Alert/Alert";
import PlacePicker from "./components/PlacePicker/PlacePicker";
import useWeather from "./hooks/useWeather";

function App() {
  const { weather, places, loading, error, fetchWeather, selectPlace } = useWeather();

  return (
    <>
      <h1 className={styles.title}>Weather Finder</h1>

      <div className={styles.container}>
        <Form fetchWeather={fetchWeather} />

        {loading && <Spinner />}

        {!loading && error && <Alert>{error}</Alert>}

        {!loading && places.length > 0 && (
          <PlacePicker places={places} onSelect={selectPlace} />
        )}

        {!loading && weather && (
          <WeatherDetails weather={weather} />
        )}
      </div>
    </>
  );
}

export default App;
