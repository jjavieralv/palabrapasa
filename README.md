# Palabrapasa

A daily word-guessing game inspired by the Spanish TV show *Pasapalabra*. Each day a new set of 27 words is generated (one per letter of the Spanish alphabet, including **Ñ**). Players try to guess each word from its definition.

**Play it here:** [https://jjavieralv.github.io/palabrapasa/](https://jjavieralv.github.io/palabrapasa/)

## How to play

1. Press **EMPEZAR** to start the game and the timer.
2. The active letter blinks on the rosco. Its definition is shown below.
3. Type your answer and press **Enter** or click **ENVIAR**.
   - Correct answer: the letter turns **green**.
   - Wrong answer: the letter turns **red** and the correct word is revealed.
4. Click **PASAPALABRA** to skip the current letter and come back to it later.
5. Once all letters are answered, a results screen shows your score, time, and the option to share an image of your rosco.

Accents on vowels are ignored when comparing answers (e.g. `cafe` matches `café`), but **Ñ** is treated as a separate letter.

## Run locally

```bash
# 1. Clone the repo
git clone https://github.com/jjavieralv/palabrapasa.git
cd palabrapasa

# 2. Generate the daily words (requires Python 3)
python3 scripts/generate_daily.py

# 3. Start a local server
python3 -m http.server 8080

# 4. Open http://localhost:8080 in your browser
```

## Project structure

```
palabrapasa/
├── index.html                          # Main game page
├── css/
│   └── style.css                       # All styles and responsive design
├── js/
│   └── game.js                         # Game logic, canvas image, share
├── scripts/
│   ├── generate_daily.py               # Generates daily words and appends to historial
│   └── select_words.py                 # Picks one random word per letter
├── data/
│   └── SpanishBFF/
│       └── SpanishBFF_0_2.json         # Full Spanish word dictionary
├── historial/
│   └── historial.json                  # All daily word sets (one entry per day)
└── .github/
    └── workflows/
        └── daily.yml                   # GitHub Action: auto-generates words at 6:00 UTC
```

## Daily generation

A GitHub Action runs every day at 06:00 UTC. It executes `scripts/generate_daily.py`, which:

1. Loads the existing `historial/historial.json`.
2. Selects one random word starting with each letter of the Spanish alphabet from the dictionary.
3. Appends the new entry with today's date.
4. Commits and pushes the updated file.

You can also trigger it manually from the **Actions** tab or by running `python3 scripts/generate_daily.py` locally.

## Data source

Word definitions come from the [SpanishBFF dataset](https://huggingface.co/datasets/MMG/SpanishBFF) on Hugging Face.
