# Logboek Webapp - Setup & Start

Een React webapp voor het logboek van zeilclub de Rederij.

## Wat je nodig hebt

- Node.js (v18 of hoger)
- npm (komt met Node.js)

## Installation

```bash
cd de-rederij-logboek
npm install
```

## Development (Local Testing)

Terminal 1 - React dev server:
```bash
npm run dev
```
Dit draait op `http://localhost:5173`

Terminal 2 - Node.js API server:
```bash
npm run server
```
Dit draait op `http://localhost:3000`

Open in je browser: `http://localhost:3000`

## Production (Build & Run)

```bash
npm run start
```

Dit:
1. Bouwt React app naar `dist/`
2. Draait Node.js server (port 3000)
3. Serveert de app via `http://localhost:3000`

## Deploy op Render

1. Push naar GitHub
2. Maak new Web Service op Render
3. Build command: `npm install`
4. Start command: `npm run start`
5. Environment: Node 18

Database wordt automatisch aangemaakt in `data/rederij.sqlite`

## Features

- ✅ Logboek-formulier (datum, schipper, route, etc)
- ✅ Logboek-overzicht (tabel met alle tochten)
- ✅ Leden uit database (dynamisch)
- ✅ REST API (`/api/logbook`, `/api/members`)
- ✅ Responsive design (mobiel + desktop)

## API Endpoints

- `GET /api/members` - Alle leden
- `GET /api/logbook` - Alle logboek entries
- `POST /api/logbook` - Maak nieuwe entry
- `GET /api/logbook/:id` - Specifieke entry
- `PUT /api/logbook/:id` - Update entry
- `DELETE /api/logbook/:id` - Verwijder entry

## Testen

Test data met curl:

```bash
# Maak logboek entry
curl -X POST http://localhost:3000/api/logbook \
  -H "Content-Type: application/json" \
  -d '{
    "entryDate": "2026-05-09",
    "skipperId": 1,
    "crewMembers": "Tom, Rob",
    "route": "Colijnsplaat - Zierikzee",
    "notes": "Mooie zeedag!"
  }'

# Haal alle entries op
curl http://localhost:3000/api/logbook
```

## Volgende stappen

- [ ] Planning (bootreservering)
- [ ] Zeildagen (punten bijhouden)
- [ ] Kasboek (geld)
- [ ] Info (documenten, regels)
- [ ] Admin dashboard
- [ ] User authentication
