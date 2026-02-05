import json
import random
import sys

ALPHABET = list("abcdefghijklmnñopqrstuvwxyz")

def select_random_words(filepath="SpanishBFF/SpanishBFF_0_2.json"):
    with open(filepath, "r", encoding="utf-8") as f:
        words = json.load(f)

    by_letter = {letter: [] for letter in ALPHABET}
    for word in words:
        first = word["lemma"][0].lower()
        if first in by_letter:
            by_letter[first].append(word)

    selected = []
    for letter in ALPHABET:
        candidates = by_letter[letter]
        if candidates:
            selected.append(random.choice(candidates))
        else:
            print(f"No se encontraron palabras que empiecen por '{letter}'", file=sys.stderr)

    return selected


if __name__ == "__main__":
    result = select_random_words()
    print(json.dumps(result, ensure_ascii=False, indent=2))
