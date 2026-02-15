# Pablo's Bangkok — Insider Guide

A curated, personal city guide to Bangkok built as a single-page web app. Not a travel magazine list — these are the places I actually go to and love.

**Live site:** [balpomorelitm.github.io/mibangkok](https://balpomorelitm.github.io/mibangkok)

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=flat&logo=leaflet&logoColor=white)

## Features

- **Interactive Map** — Leaflet.js with CARTO dark tiles. 32 custom pins with click-to-open modals.
- **Spot Directory** — Searchable, filterable card grid with photos, insider tips, and Google Maps links.
- **Itinerary Builder** — Save spots, reorder via drag-and-drop, auto-generate walking route on the map.
- **Proximity Connections** — Each spot modal shows nearby places (Haversine distance).
- **Practical Tips** — Transport, scams, etiquette, weather, health, and money advice.
- **Vibe & Budget Charts** — Chart.js bubble chart (chaos vs. cost) and doughnut (category breakdown).
- **Thai Food Guide** — 21 regional dishes across 5 categories with photos, spice levels, and where to eat.
- **Geolocation** — "Near Me" button sorts spots by distance from your location.
- **Fully responsive** — Mobile-first design with emoji-only navbar on small screens.

## Sections

| Section | Description |
|---------|-------------|
| 🗺️ Map | Interactive Leaflet map with 32 pins |
| 📋 Directory | Filterable card grid of all spots |
| 🧳 Itinerary | Drag-and-drop saved spots planner |
| 💡 Tips | 9 practical tip cards for travelers |
| 📊 Data | Vibe vs. budget scatter + category doughnut |
| 🍜 Food | 21 Thai dishes with photos, spice scale, and restaurant recommendations |

## Tech Stack

- **Frontend:** Vanilla HTML / CSS / JavaScript — no frameworks, no build step
- **Map:** [Leaflet.js 1.9.4](https://leafletjs.com/) with [CARTO Dark](https://carto.com/basemaps/) tiles
- **Charts:** [Chart.js 3.9.1](https://www.chartjs.org/)
- **Fonts:** [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) + [Inter](https://fonts.google.com/specimen/Inter)
- **Photos:** Local assets (`assets/fotos/`) for spots, [Pixabay API](https://pixabay.com/api/docs/) for food dishes
- **Data:** 32 spots defined in `data/spots.json`, exported as `const SPOTS_DATA` in `data/spots.js`

## Project Structure

```
mibangkok/
├── index.html          # Single-page app (all sections)
├── css/
│   └── styles.css      # All styles (~1850 lines)
├── js/
│   └── app.js          # All interactivity (~740 lines)
├── data/
│   ├── spots.json      # Master data for 32 spots
│   └── spots.js        # Auto-generated JS export of spots.json
├── assets/
│   └── fotos/          # Local spot photos (50+ images)
└── README.md
```

## Spots (32)

Bars & nightlife, temples, parks, markets, restaurants, cultural spots, and unique Bangkok experiences — including speakeasy bars, rooftop terraces, Muay Thai stadiums, floating markets, and hidden neighborhoods.

## Running Locally

No build step needed. Just open `index.html` in a browser, or serve with any static server:

```bash
# Python
python -m http.server 8000

# Node.js
npx serve .
```

## Author

**Pablo** — *"If you are unsure about anything or want a specific recommendation, just ask me. Enjoy the chaos!"*

## License

Personal project. All photos are either personal or sourced from Pixabay (free license).
