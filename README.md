# 🌤 Weather Finder App

[![CI](https://github.com/DAlejandroCl/Weather-finder/actions/workflows/ci.yml/badge.svg)](https://github.com/DAlejandroCl/Weather-finder/actions/workflows/ci.yml)
[![Live Demo](https://img.shields.io/badge/demo-live-green)](https://weather-finder-devacl.vercel.app)

A weather application built with **React + TypeScript** that lets users search for current weather by city and country.
The browser talks to two small serverless endpoints that hold the **OpenWeatherMap** API key, every API response is validated with **Zod**, and the project has a layered test suite.

## 🚀 Live Demo

👉 https://weather-finder-devacl.vercel.app

---

## ✨ Features
- Search weather by **city and country**
- When several places share the name (Springfield, Santa Cruz), the app lists them and the person chooses one
- Display:
  - Temperature and feels like
  - Humidity
  - Wind speed
  - Atmospheric pressure
  - Sunrise and sunset, in the local time of the searched city
- Weather condition icon
- Input and response validation with **Zod**
- Errors announced to screen readers (`role="alert"`); the list of places receives focus when it appears
- Loading state with spinner
- A newer search cancels the one still in flight, so a slow answer cannot replace a newer result
- The city is sent as an encoded query parameter, so characters such as `&` or `#` cannot change the request

---

## 🛠 Tech Stack
- **React** (functional components) and **TypeScript**
- **Vite**
- **Vercel Functions** (Node) for `/api/geocode` and `/api/weather`
- **Axios** for HTTP requests
- **Zod** for schema validation
- **Tailwind CSS** and **CSS Modules**
- A custom hook for the API logic (`useWeather`)
- **Vitest**, **React Testing Library**, **MSW** and **jest-axe** for tests

---

## 🧠 Architecture & Concepts
- The browser never sees the API key: it calls `/api/geocode?city=…&country=…` and `/api/weather?lat=…&lon=…`, and those functions call OpenWeatherMap with `OPENWEATHER_API_KEY`
- The endpoint logic (`api/_lib/openweather.ts`) does not depend on a server framework: it takes a method and a query and returns a status, headers and body, so it is tested without a server. `api/_lib/node.ts` adapts it to Node, and the same adapter serves Vercel and the Vite dev server
- The endpoints validate the city (1 to 100 characters), the country (two capital letters) and the coordinates (ranges), map upstream failures to `429` or `502` without passing on the upstream body, and let the CDN cache answers (a day for geocoding, five minutes for weather)
- API logic on the client lives in one custom hook (`useWeather`); components only render state
- Types are inferred from the Zod schemas, so a type and its schema cannot drift apart
- The hook keeps an `AbortController` for the request in flight and aborts it when a new one starts or the component unmounts

---

## 🧪 Tests

```bash
npm test          # run the suite once
npm run test:watch
```

| Layer | What it covers | Tools |
| --- | --- | --- |
| Endpoints | Validation, upstream mapping (429, 502), no key or upstream body in answers, caching, 405 | Vitest |
| Schemas and utilities | Valid, missing and wrong-typed fields; local time of sunrise and sunset | Vitest |
| Hook | Success, empty list, failures, 429, encoded query, several places, choosing one, a slow earlier search | Vitest, React Testing Library, MSW |
| Components | Form validation and alert, weather card, the list of places (focus, keyboard) | React Testing Library, jest-axe |
| App | Search, choosing between places, not found and failure, inside jsdom | React Testing Library, MSW, jest-axe |

Requests are answered by MSW, so no test reaches OpenWeatherMap, and an unmatched request fails the test.
jest-axe runs in jsdom, which does not compute layout or colors: it does not check color contrast. Contrast was checked with axe-core in Chromium against the build; there is no browser-based test in the CI yet.

CI (`.github/workflows/ci.yml`) runs lint, the type check (inside `npm run build`), the tests and the build on every push to `main` and every pull request.

## 🔐 Known limitations

- The endpoints are public: anyone can call them and use up the OpenWeatherMap quota, although nobody can read the key. The CDN cache and the input validation reduce the load, but there is no per-visitor rate limit.
- A key that was used with the earlier version of this app (which put it in the browser bundle) should be treated as public and replaced.
- There is no browser-based end-to-end test yet.

---

## 🗂 Project Structure
```txt
api/
├── _lib/
│   ├── openweather.ts, openweather.test.ts   Endpoint logic
│   └── node.ts, node.test.ts                 Node adapter
├── geocode.ts
└── weather.ts
src/
├── components/
│   ├── Alert/
│   ├── Form/
│   ├── PlacePicker/
│   ├── Spinner/
│   └── WeatherDetails/
├── hooks/
│   └── useWeather.ts
├── data/
│   └── countries.ts
├── schemas/
├── test/               MSW server, fixtures and setup shared by the tests
├── types/
├── utils/
│   └── time.ts
├── App.tsx
└── main.tsx
```
(each file with logic has a `.test` file next to it)

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

3. Create a `.env.local` file in the root with your OpenWeatherMap API key. The name has no `VITE_` prefix on purpose: only the server code reads it.
```bash
OPENWEATHER_API_KEY=your_api_key_here
```

4. Start the development server and open http://localhost:5173. The dev server runs the same two endpoints as production:
```bash
npm run dev
```

## ☁️ Deploying on Vercel

Add `OPENWEATHER_API_KEY` in Project Settings → Environment Variables (Production and Preview) **before** deploying this version; without it the endpoints answer `500`. The old `VITE_OPENWEATHER_API_KEY` variable is no longer used and can be deleted.

## 📄 License

This project is for learning and portfolio purposes.
