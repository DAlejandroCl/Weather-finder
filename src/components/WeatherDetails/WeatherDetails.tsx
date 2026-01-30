import styles from "./WeatherDetails.module.css";
import type { WeatherData } from "../../types";

type Props = {
  weather: WeatherData;
};

export default function WeatherDetails({ weather }: Props) {
  const iconUrl = `https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`;

  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <h2>
          {weather.name}, {weather.sys.country}
        </h2>
        <img
          src={iconUrl}
          alt={weather.weather[0].description}
        />
      </header>

      <p className={styles.description}>
        {weather.weather[0].description}
      </p>

      <div className={styles.grid}>
        <div className={styles.item}>
          <span>🌡 Temperature</span>
          <strong>{weather.main.temp} °C</strong>
        </div>

        <div className={styles.item}>
          <span>🤗 Feels Like</span>
          <strong>{weather.main.feels_like} °C</strong>
        </div>

        <div className={styles.item}>
          <span>💧 Humidity</span>
          <strong>{weather.main.humidity}%</strong>
        </div>

        <div className={styles.item}>
          <span>🌬 Wind Speed</span>
          <strong>{weather.wind.speed} m/s</strong>
        </div>

        <div className={styles.item}>
          <span>📈 Pressure</span>
          <strong>{weather.main.pressure} hPa</strong>
        </div>
      </div>
    </section>
  );
}
