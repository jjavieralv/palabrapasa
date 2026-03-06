# CLAUDE.md — Palabrapasa

AI assistant guide for the **Palabrapasa** codebase.

## What is this project?

Palabrapasa is a browser-based daily word-guessing game inspired by the Spanish TV show *Pasapalabra*. Players cycle through the 27 Spanish alphabet letters (including Ñ) and must provide a word matching each clue. A new "rosco" (alphabet circle) is generated automatically every day.

**Stack:**
- Frontend: Vanilla HTML5 / CSS3 / JavaScript (ES6+), zero npm dependencies
- Data: Python 3 (stdlib only) for daily word generation
- Storage: JSON files committed to the repository
- Hosting: GitHub Pages
- Automation: GitHub Actions (daily word generation at 06:00 UTC)

---

## Repository layout

```
palabrapasa/
├── index.html                    # Single-page app entry point
├── css/style.css                 # All styling, uses CSS custom properties
├── js/game.js                    # All game logic (~420 lines)
├── scripts/
│   ├── generate_daily.py         # Entrypoint for the daily GitHub Actions run
│   └── select_words.py           # Picks one word per letter from the dictionary
├── data/
│   └── SpanishBFF/
│       └── SpanishBFF_0_2.json   # Master Spanish dictionary (6.8 MB, read-only)
├── historial/
│   └── historial.json            # Append-only log of daily roscos (generated)
└── .github/workflows/daily.yml   # Scheduled GitHub Actions workflow
```

---

## Running locally

No build step needed. Serve the root directory over HTTP (required for `fetch()` to work):

```bash
python3 -m http.server 8080
# Visit http://localhost:8080
```

---

## Data flow

```
scripts/select_words.py          ← reads SpanishBFF_0_2.json
        ↓
scripts/generate_daily.py        ← appends today's entry to historial/historial.json
        ↓
GitHub Actions commits & pushes  ← runs daily at 06:00 UTC
        ↓
js/game.js fetches historial/historial.json at runtime
        ↓
Browser renders today's rosco
```

### historial.json format

```json
[
  {
    "date": "YYYY-MM-DD",
    "words": [
      {
        "id": 1234,
        "lemma": "abeja",
        "definition": "Insecto...",
        "type": "empieza",
        "letter": "a"
      }
    ]
  }
]
```

- `type` is either `"empieza"` (word starts with the letter) or `"contiene"` (word contains the letter).
- One entry per letter of the Spanish alphabet (27 entries per day).

### SpanishBFF_0_2.json format

```json
[{ "id": 1234, "lemma": "palabra", "definition": "Definición aquí." }]
```

This file is immutable source data — never modify it.

---

## JavaScript conventions (js/game.js)

- **No framework, no bundler.** Plain ES6+ served directly.
- Initialises on `DOMContentLoaded`.
- Alphabet constant: `const ALPHABET = [..."abcdefghijklmnñopqrstuvwxyz"]` (27 letters).
- Game state per letter is one of: `pending`, `passed`, `correct`, `wrong`, `skip`.
- Answer comparison normalises accents: `á→a`, `é→e`, etc. Comparisons are case-insensitive.
- Results are shared as a Canvas-generated PNG image.
- External network call: GitHub REST API (`/repos/jjavieralv/palabrapasa/commits/main`) — read-only, used only for the footer version stamp.

### Key variables / functions

| Name | Purpose |
|---|---|
| `words` | Object keyed by letter, each value is the word+definition for today |
| `letterStates` | Object keyed by letter with current state string |
| `currentLetterIndex` | Index into `ALPHABET` for active letter |
| `normalizeText(str)` | Strips accents and lowercases for comparison |
| `generateShareImage()` | Renders Canvas PNG for social sharing |

---

## CSS conventions (css/style.css)

- Theme colours defined as CSS custom properties on `:root`.
- Key palette: `#0d1b2a` (background), `#27ae60` (correct), `#c0392b` (wrong).
- Responsive breakpoints: 540 px and 380 px.
- Animations: `pulse` on active letter; `flash-correct` / `flash-wrong` on answers.
- Layout: Flexbox throughout.

---

## Python conventions (scripts/)

- Python 3, stdlib only (no `pip install` needed).
- snake_case naming throughout.
- Paths resolved relative to the script's `ROOT_DIR = os.path.dirname(os.path.dirname(...))`.
- JSON written with `ensure_ascii=False` to preserve Spanish characters (ñ, á, etc.).
- `select_words.py` tries the preferred mode (`empieza` or `contiene`) randomly per letter; falls back to the other mode if no candidates exist.

### Running the daily generator manually

```bash
python3 scripts/generate_daily.py
```

This appends a new entry to `historial/historial.json` and prints the selected words.

---

## GitHub Actions (`.github/workflows/daily.yml`)

- Trigger: schedule `0 6 * * *` (06:00 UTC daily) + `workflow_dispatch` for manual runs.
- Steps: checkout → run `generate_daily.py` → commit & push `historial/historial.json`.

---

## No test suite

There are no automated tests. Validation is done by:
1. Running `generate_daily.py` manually and inspecting its output.
2. Loading `localhost:8080` and playing through the game.

When adding features, manually verify the game loads correctly, letters cycle properly, and scoring works. Do not introduce a test framework unless the user explicitly asks for one.

---

## What NOT to do

- Do not add npm/Node dependencies or a build pipeline — the zero-dependency approach is intentional.
- Do not modify `data/SpanishBFF/SpanishBFF_0_2.json` — it is immutable source data.
- Do not add a backend server — the project is designed to be served entirely from GitHub Pages.
- Do not add a database — `historial.json` is the intentional storage mechanism.
- Do not add comments, docstrings, or type annotations to code you did not change.

---

## Common tasks

### Add a new UI feature
Edit `index.html` for structure, `css/style.css` for styling, and `js/game.js` for behaviour. No build step; refresh the browser.

### Change word selection logic
Edit `scripts/select_words.py`. Run `python3 scripts/generate_daily.py` to test.

### Update the daily schedule
Edit the cron expression in `.github/workflows/daily.yml`.

### Inspect today's words
```bash
python3 -c "import json; h=json.load(open('historial/historial.json')); print(h[-1])"
```
