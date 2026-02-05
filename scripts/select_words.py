import json
import random
import sys

ALPHABET = list("abcdefghijklmnñopqrstuvwxyz")


def select_random_words(filepath="SpanishBFF/SpanishBFF_0_2.json"):
    with open(filepath, "r", encoding="utf-8") as f:
        all_words = json.load(f)

    starts_with = {letter: [] for letter in ALPHABET}
    contains = {letter: [] for letter in ALPHABET}

    for word in all_words:
        lemma = word["lemma"].lower()
        first = lemma[0]
        if first in starts_with:
            starts_with[first].append(word)
        for letter in ALPHABET:
            if letter in lemma and lemma[0] != letter:
                contains[letter].append(word)

    selected = []
    for letter in ALPHABET:
        mode = random.choice(["empieza", "contiene"])
        candidates = contains[letter] if mode == "contiene" else starts_with[letter]

        # Fallback if no candidates for chosen mode
        if not candidates:
            mode = "empieza" if mode == "contiene" else "contiene"
            candidates = starts_with[letter] if mode == "empieza" else contains[letter]

        if candidates:
            entry = random.choice(candidates)
            selected.append({**entry, "type": mode, "letter": letter})
        else:
            print(f"No se encontraron palabras para '{letter}'", file=sys.stderr)

    return selected


if __name__ == "__main__":
    result = select_random_words()
    print(json.dumps(result, ensure_ascii=False, indent=2))
