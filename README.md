# 🌤 Weather Finder App

[![CI](https://github.com/DAlejandroCl/Weather-finder/actions/workflows/ci.yml/badge.svg)](https://github.com/DAlejandroCl/Weather-finder/actions/workflows/ci.yml)
[![Live Demo](https://img.shields.io/badge/demo-live-green)](https://weather-finder-devacl.vercel.app)

A weather application built with **React + TypeScript** that lets users search for current weather by city and country.
The app consumes the **OpenWeatherMap API**, validates the form and every API response with **Zod**, and has a layered test suite.

## 🚀 Live Demo

👉 https://weather-finder-devacl.vercel.app

---

## ✨ Features
- Search weather by **city and country**
- Current data from the **OpenWeatherMap API** (geocoding first, then weather for the coordinates)
- Display:
  - Temperature and feels like
  - Humidity
  - Wind speed
  - Atmospheric pressure
  - Sunrise and sunset, in the local time of the searched city
- Weather condition icon
- Input and response validation with **Zod**
- Errors announced to screen readers (`role="alert"`)
- Loading state with spinner
- A newer search cancels the one still in flight, so a slow answer cannot replace a newer result
- The city is sent as an encoded query parameter, so characters such as `&` or `#` cannot change the request

---

## 🛠 Tech Stack
- **React** (functional components) and **TypeScript**
- **Vite**
- **Axios** for HTTP requests
- **Zod** for schema validation
- **Tailwind CSS** and **CSS Modules**
- A custom hook for the API logic (`useWeather`)
- **Vitest**, **React Testing Library**, **MSW** and **jest-axe** for tests

---

## 🧠 Architecture & Concepts
- API logic lives in one custom hook (`useWeather`); components only render state
- Types are inferred from the Zod schemas, so a type and its schema cannot drift apart
- The hook keeps an `AbortController` for the search in flight and aborts it when a new search starts or the component unmounts

---

## 🧪 Tests

```bash
npm test          # run the suite once
npm run test:watch
```

| Layer | What it covers | Tools |
| --- | --- | --- |
| Schemas | Valid, missing and wrong-typed fields | Vitest |
| Utilities | Local time of sunrise and sunset | Vitest |
| Hook | Success, empty list, network error, invalid response, encoded query, and a slow earlier search that must not replace a newer one | Vitest, React Testing Library, MSW |
| Components | Form validation and alert, weather card values | React Testing Library, jest-axe |
| App | Search, not found and failure, end to end inside jsdom | React Testing Library, MSW, jest-axe |

Requests are answered by MSW, so no test reaches the real API, and an unmatched request fails the test.
jest-axe runs in jsdom, which does not compute layout or colors: it does not check color contrast. There is no browser-based end-to-end test yet.

CI (`.github/workflows/ci.yml`) runs lint, the tests and the build on every push to `main` and every pull request.

## 🔐 Known limitations

- **The API key is public.** Vite embeds `VITE_OPENWEATHER_API_KEY` in the JavaScript bundle, so anyone can read it from the browser, and OpenWeatherMap free keys cannot be restricted by domain. The fix is a small server-side proxy that holds the key.
- Only the first result of the geocoding request is used, so two cities with the same name in one country are not told apart.

---

## 🗂 Project Structure
```txt
src/
├── components/
│   ├── Alert/          Alert.tsx
│   ├── Form/           Form.tsx, Form.test.tsx
│   ├── Spinner/        Spinner.tsx
│   └── WeatherDetails/ WeatherDetails.tsx, WeatherDetails.test.tsx
├── hooks/
│   └── useWeather.ts, useWeather.test.ts
├── data/
│   └── countries.ts
├── schemas/
│   ├── searchSchema.ts
│   ├── weatherSchemas.ts
│   └── schemas.test.ts
├── test/               MSW server, fixtures and setup shared by the tests
├── types/
│   └── index.ts
├── utils/
│   └── time.ts, time.test.ts
├── App.tsx, App.test.tsx
└── main.tsx
```

## ⚙️ Installation & Local Setup

1. Clone the repository and enter it:

```bash
git clone https://github.com/DAlejandroCl/Weather-finder.git
cd Weather-finder
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root and add your OpenWeatherMap API key (`.env.example` shows the name):
```bash
VITE_OPENWEATHER_API_KEY=your_api_key_here
```

4. Start the development server and open http://localhost:5173:
```bash
npm run dev
```

## 📄 License

This project is for learning and portfolio purposes.
