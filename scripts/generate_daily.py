#!/usr/bin/env python3
import json
import os
from datetime import date
from select_words import select_random_words

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HISTORIAL_FILE = os.path.join(ROOT_DIR, "historial", "historial.json")
DATA_FILE = os.path.join(ROOT_DIR, "data", "SpanishBFF", "SpanishBFF_0_2.json")


def generate():
    os.makedirs(os.path.dirname(HISTORIAL_FILE), exist_ok=True)

    # Load existing history
    if os.path.exists(HISTORIAL_FILE):
        with open(HISTORIAL_FILE, "r", encoding="utf-8") as f:
            historial = json.load(f)
    else:
        historial = []

    today = date.today().isoformat()

    # Skip if today already exists
    if any(entry["date"] == today for entry in historial):
        print(f"Ya existe una entrada para {today}, saltando.")
        return

    selected = select_random_words(DATA_FILE)
    historial.append({"date": today, "words": selected})

    with open(HISTORIAL_FILE, "w", encoding="utf-8") as f:
        json.dump(historial, ensure_ascii=False, indent=2, fp=f)

    print(f"Añadida entrada para {today} en historial.json")


if __name__ == "__main__":
    generate()
