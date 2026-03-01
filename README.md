# Weather App

React app that displays real-time and historical weather using the [Weatherstack API](https://weatherstack.com/). Built with Vite.

## Features

- **Current weather** — Real-time conditions for any city, region, or ZIP (works on free plan).
- **Units** — Celsius (°C), Fahrenheit (°F), or Kelvin (K).
- **7-day forecast** — Multi-day forecast (Professional plan and above).
- **Historical weather** — Past weather by date (Standard plan and above).
- **Location search** — Type a location and search; autocomplete when supported by your plan.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file (or copy `.env.example`):
   ```
   VITE_WEATHERSTACK_ACCESS_KEY=your_api_key
   ```

3. Run the app:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## API

- [Weatherstack API documentation](https://docs.apilayer.com/weatherstack/docs/api-documentation)
- Free plan: current weather only, 100 requests/month.
- Forecast and historical data require higher plans; the app shows clear messages when a feature is not available.
