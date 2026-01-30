# 🌤 Weather Finder App

[![Live Demo](https://img.shields.io/badge/demo-live-green)](https://weather-finder-devacl.vercel.app)

A modern weather application built with **React + TypeScript** that allows users to search for real-time weather information by city and country.  
The app consumes data from the **OpenWeatherMap API**, validates inputs and responses using **Zod**, and provides a clean, responsive user interface.

## 🚀 Live Demo

You can try the application here:

👉 https://weather-finder-devacl.vercel.app

---

## ✨ Features
- Search weather by **city and country**
- Real-time data from **OpenWeatherMap API**
- Display:
  - Temperature
  - Feels like
  - Humidity
  - Wind speed
  - Atmospheric pressure
- Weather condition icon
- Input validation with **Zod**
- Error handling with user-friendly alerts
- Loading state with spinner
- Modular and scalable architecture

---

## 🛠 Tech Stack
- **React** (Functional Components)
- **TypeScript**
- **Vite**
- **Axios** for HTTP requests
- **Zod** for schema validation
- **Tailwind CSS**
- **CSS Modules**
- **Custom React Hook** for API logic

---

## 🧠 Architecture & Concepts
- Clear separation of concerns
- API logic encapsulated in a custom hook (`useWeather`)
- Strong runtime and compile-time validation using Zod
- Reusable UI components
- Environment variables for secure API key handling

---

## 🗂 Project Structure
```txt
src/
├── components/
│   ├── Alert/
│   │   ├── Alert.tsx
│   │   └── Alert.module.css
│   ├── Form/
│   │   ├── Form.tsx
│   │   └── Form.module.css
│   ├── Spinner/
│   │   ├── Spinner.tsx
│   │   └── Spinner.module.css
│   └── WeatherDetails/
│   │   ├── WeatherDetails.tsx
│   │   └── WeatherDetails.module.css
├── hooks/
│   └── useWeather.ts
├── data/
│   └── countries.ts
├── schemas/
│   ├── searchSchema.ts
│   └── weatherSchema.ts
├── types/
│   └── index.ts
├── App.tsx
├── App.module.css
├── main.tsx
└── index.css
```

## ⚙️ Installation & Local Setup

1. Clone the repository:

```bash
git clone https://github.com/DAlejandroCl/Weather-finder.git
```

2. Navigate to the project directory:
```bash
cd Weather-finder
```

3. Install dependencies:
```bash
npm install
```

4. Configure environment variables
Create a .env.local file in the root of the project and add your OpenWeatherMap API key:
```bash
VITE_OPENWEATHER_API_KEY=your_api_key_here
```
An example file .env.example is included in the repository.

5. Start the development server
```bash
npm run dev
```

6. Open your browser and visit:
```txt
http://localhost:5173
```

## 📄 License

This project is for learning and portfolio purposes.