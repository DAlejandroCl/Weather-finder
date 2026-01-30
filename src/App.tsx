import styles from "./App.module.css";
import Form from "./components/Form/Form";
import WeatherDetails from "./components/WeatherDetails/WeatherDetails";
import Spinner from "./components/Spinner/Spinner";
import Alert from "./components/Alert/Alert";
import useWeather from "./hooks/useWeather";

function App() {
  const { weather, loading, error, fetchWeather } = useWeather();

  return (
    <>
      <h1 className={styles.title}>Weather Finder</h1>

      <div className={styles.container}>
        <Form fetchWeather={fetchWeather} />

        {loading && <Spinner />}

        {!loading && error && <Alert>{error}</Alert>}

        {!loading && weather && (
          <WeatherDetails weather={weather} />
        )}
      </div>
    </>
  );
}

export default App;
