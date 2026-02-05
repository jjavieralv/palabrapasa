#!/usr/bin/env python3
import json
import os
from datetime import date
from select_words import select_random_words

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
HISTORIAL_DIR = os.path.join(SCRIPT_DIR, "historial")


def generate():
    selected = select_random_words()
    today = date.today().isoformat()
    data = {"date": today, "words": selected}

    os.makedirs(HISTORIAL_DIR, exist_ok=True)

    daily_file = os.path.join(HISTORIAL_DIR, f"{today}.json")
    latest_file = os.path.join(HISTORIAL_DIR, "latest.json")

    for path in (daily_file, latest_file):
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, ensure_ascii=False, indent=2, fp=f)

    print(f"Generado {daily_file}")
    print(f"Actualizado {latest_file}")


if __name__ == "__main__":
    generate()
