const ALPHABET = [..."abcdefghijklmnñopqrstuvwxyz"];

let words = {};
let letterStates = {};
let currentIndex = 0;
let timerInterval = null;
let elapsedSeconds = 0;
let gameActive = false;
let userAnswers = {};
let gameDate = "";

document.addEventListener("DOMContentLoaded", init);

async function init() {
  try {
    const res = await fetch("historial/historial.json");
    const historial = await res.json();
    const data = historial[historial.length - 1];
    gameDate = data.date;

    data.words.forEach((word) => {
      const letter = word.lemma[0].toLowerCase();
      words[letter] = word;
    });

    ALPHABET.forEach((l) => {
      letterStates[l] = words[l] ? "pending" : "skip";
    });

    // Show date
    var parts = gameDate.split("-");
    document.getElementById("game-date").textContent =
      parts[2] + "/" + parts[1] + "/" + parts[0];

    buildRosco();
    setupEvents();
  } catch {
    document.getElementById("definition").textContent =
      "Error cargando las palabras. Genera el fichero diario con generate_daily.py";
    document.getElementById("start-btn").style.display = "none";
  }

  loadCommitHash();
}

function buildRosco() {
  const rosco = document.getElementById("rosco");
  const count = ALPHABET.length;

  ALPHABET.forEach((letter, i) => {
    const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
    const x = 50 + 44 * Math.cos(angle);
    const y = 50 + 44 * Math.sin(angle);

    const el = document.createElement("div");
    el.className = "letter-circle letter-intro";
    el.id = "letter-" + i;
    el.dataset.letter = letter;
    el.textContent = letter.toUpperCase();
    // Start at center
    el.style.left = "50%";
    el.style.top = "50%";
    el.style.opacity = "0";
    el.style.transform = "translate(-50%, -50%) scale(0)";

    if (letterStates[letter] === "skip") {
      el.dataset.skip = "1";
    }

    rosco.appendChild(el);

    // Animate to final position with staggered delay
    setTimeout(() => {
      el.style.left = x + "%";
      el.style.top = y + "%";
      el.style.opacity = el.dataset.skip ? "0.3" : "1";
      el.style.transform = "translate(-50%, -50%) scale(1)";
    }, 80 + i * 50);
  });
}

function setupEvents() {
  document.getElementById("start-btn").addEventListener("click", startGame);
  document.getElementById("submit-btn").addEventListener("click", submitAnswer);
  document.getElementById("pass-btn").addEventListener("click", pasapalabra);
  document.getElementById("answer-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      if (gameActive) {
        e.stopPropagation();
        submitAnswer();
      }
    }
  });
  document.getElementById("wrong-accept-btn").addEventListener("click", acceptWrong);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !document.getElementById("wrong-overlay").classList.contains("hidden")) {
      acceptWrong();
    }
  });
  document.getElementById("share-btn").addEventListener("click", shareResult);
  document
    .getElementById("replay-btn")
    .addEventListener("click", () => location.reload());
}

function startGame() {
  gameActive = true;
  document.getElementById("start-btn").classList.add("hidden");
  document.getElementById("input-area").classList.remove("hidden");

  currentIndex = findNextPending(0);
  if (currentIndex === -1) return;

  showCurrentLetter();
  startTimer();
}

function findNextPending(from) {
  const len = ALPHABET.length;
  for (let n = 0; n < len; n++) {
    const idx = (from + n) % len;
    const state = letterStates[ALPHABET[idx]];
    if (state === "pending" || state === "passed") return idx;
  }
  return -1;
}

function showCurrentLetter() {
  const letter = ALPHABET[currentIndex];
  const word = words[letter];

  document
    .querySelectorAll(".letter-circle")
    .forEach((el) => el.classList.remove("active"));
  document.getElementById("letter-" + currentIndex).classList.add("active");

  document.getElementById("definition").textContent =
    "Empieza por " + letter.toUpperCase() + ": " + word.definition;

  const input = document.getElementById("answer-input");
  input.value = "";
  input.focus();
}

function normalize(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[áàâä]/g, "a")
    .replace(/[éèêë]/g, "e")
    .replace(/[íìîï]/g, "i")
    .replace(/[óòôö]/g, "o")
    .replace(/[úùûü]/g, "u");
}

function submitAnswer() {
  if (!gameActive) return;
  const input = document.getElementById("answer-input");
  const answer = input.value.trim();
  if (!answer) return;

  const letter = ALPHABET[currentIndex];
  const word = words[letter];
  const el = document.getElementById("letter-" + currentIndex);

  el.classList.remove("active");
  userAnswers[letter] = answer;

  if (normalize(answer) === normalize(word.lemma)) {
    letterStates[letter] = "correct";
    el.classList.add("correct", "flash-correct");
    updateScore();
    moveToNext();
  } else {
    letterStates[letter] = "wrong";
    el.classList.add("wrong", "flash-wrong");
    updateScore();
    showWrongAnswer(word.lemma, word.definition);
  }
}

function showWrongAnswer(correctWord, definition) {
  gameActive = false;
  document.getElementById("wrong-answer").textContent = correctWord;
  document.getElementById("wrong-definition").textContent = definition;
  document.getElementById("wrong-overlay").classList.remove("hidden");
}

function acceptWrong() {
  document.getElementById("wrong-overlay").classList.add("hidden");
  gameActive = true;
  moveToNext();
}

function pasapalabra() {
  if (!gameActive) return;
  const letter = ALPHABET[currentIndex];
  const el = document.getElementById("letter-" + currentIndex);

  el.classList.remove("active");
  letterStates[letter] = "passed";
  moveToNext();
}

function moveToNext() {
  const next = findNextPending((currentIndex + 1) % ALPHABET.length);
  if (next === -1) {
    endGame();
  } else {
    currentIndex = next;
    showCurrentLetter();
  }
}

function updateScore() {
  const correct = ALPHABET.filter((l) => letterStates[l] === "correct").length;
  const wrong = ALPHABET.filter((l) => letterStates[l] === "wrong").length;
  document.getElementById("correct-count").textContent = correct;
  document.getElementById("wrong-count").textContent = wrong;
}

function startTimer() {
  elapsedSeconds = 0;
  timerInterval = setInterval(() => {
    elapsedSeconds++;
    document.getElementById("timer").textContent = formatTime(elapsedSeconds);
  }, 1000);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return m + ":" + s;
}

function endGame() {
  gameActive = false;
  clearInterval(timerInterval);
  document.getElementById("input-area").classList.add("hidden");
  document.getElementById("definition").textContent = "Rosco completado!";
  showResults();
}

function showResults() {
  const correct = ALPHABET.filter((l) => letterStates[l] === "correct").length;
  const wrong = ALPHABET.filter((l) => letterStates[l] === "wrong").length;
  const time = formatTime(elapsedSeconds);

  document.getElementById("results-time").innerHTML = "&#9201; " + time;
  document.getElementById("results-stats").innerHTML =
    '<span style="color:var(--color-correct)">&#10004; ' +
    correct +
    "</span>" +
    '<span style="color:var(--color-wrong)">&#10006; ' +
    wrong +
    "</span>";

  // Mini rosco
  const lettersContainer = document.getElementById("results-letters");
  lettersContainer.innerHTML = "";
  ALPHABET.forEach((letter) => {
    if (!words[letter]) return;
    const div = document.createElement("div");
    div.className = "result-letter " + letterStates[letter];
    div.textContent = letter.toUpperCase();
    lettersContainer.appendChild(div);
  });

  // Details
  const details = document.getElementById("results-details");
  details.innerHTML = "";
  ALPHABET.forEach((letter) => {
    if (!words[letter]) return;
    const word = words[letter];
    const state = letterStates[letter];
    const row = document.createElement("div");
    row.className = "detail-row " + state;

    if (state === "correct") {
      row.innerHTML =
        '<span class="letter-label">' +
        letter.toUpperCase() +
        "</span>" +
        '<span class="correct-answer">' +
        word.lemma +
        "</span>";
    } else {
      row.innerHTML =
        '<span class="letter-label">' +
        letter.toUpperCase() +
        "</span>" +
        '<span class="user-answer">' +
        (userAnswers[letter] || "-") +
        "</span> &rarr; " +
        '<span class="correct-answer">' +
        word.lemma +
        "</span>";
    }

    details.appendChild(row);
  });

  document.getElementById("results-overlay").classList.remove("hidden");
}

function generateResultImage() {
  var size = 600;
  var canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  var ctx = canvas.getContext("2d");
  var cx = size / 2;
  var cy = size / 2;

  // Background
  ctx.fillStyle = "#0d1b2a";
  ctx.fillRect(0, 0, size, size);

  // Rosco letters
  var roscoR = 230;
  var letterR = 21;
  var count = ALPHABET.length;

  ALPHABET.forEach(function (letter, i) {
    if (!words[letter]) return;
    var angle = (i / count) * 2 * Math.PI - Math.PI / 2;
    var x = cx + roscoR * Math.cos(angle);
    var y = cy + roscoR * Math.sin(angle);

    // Circle
    ctx.beginPath();
    ctx.arc(x, y, letterR, 0, 2 * Math.PI);
    ctx.fillStyle =
      letterStates[letter] === "correct" ? "#27ae60" : "#c0392b";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Letter
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 15px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(letter.toUpperCase(), x, y + 1);
  });

  // Title
  ctx.fillStyle = "#f39c12";
  ctx.font = "bold 36px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("PALABRAPASA", cx, cy - 70);

  // Date
  var parts = gameDate.split("-");
  var dateStr = parts[2] + "/" + parts[1] + "/" + parts[0];
  ctx.fillStyle = "#7f8c8d";
  ctx.font = "16px sans-serif";
  ctx.fillText(dateStr, cx, cy - 35);

  // Time
  ctx.fillStyle = "#ecf0f1";
  ctx.font = "bold 48px sans-serif";
  ctx.fillText(formatTime(elapsedSeconds), cx, cy + 15);

  // Scores
  var correct = ALPHABET.filter(function (l) {
    return letterStates[l] === "correct";
  }).length;
  var wrong = ALPHABET.filter(function (l) {
    return letterStates[l] === "wrong";
  }).length;

  ctx.font = "bold 24px sans-serif";
  ctx.fillStyle = "#27ae60";
  ctx.fillText(correct + " aciertos", cx, cy + 60);
  ctx.fillStyle = "#c0392b";
  ctx.fillText(wrong + " fallos", cx, cy + 90);

  return canvas;
}

function shareResult() {
  var canvas = generateResultImage();
  canvas.toBlob(function (blob) {
    var file = new File([blob], "palabrapasa.png", { type: "image/png" });
    var shareText = "Ven a disfrutar del reto diario de palabrapasa: https://jjavieralv.github.io/palabrapasa/";
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: "Palabrapasa", text: shareText }).catch(function () {
        downloadImage(canvas);
      });
    } else {
      downloadImage(canvas);
    }
  }, "image/png");
}

function downloadImage(canvas) {
  var link = document.createElement("a");
  link.download = "palabrapasa.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function loadCommitHash() {
  fetch("https://api.github.com/repos/jjavieralv/palabrapasa/commits/main")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var short = data.sha.substring(0, 7);
      document.getElementById("commit-hash").textContent = short;
      document.getElementById("commit-link").href = data.html_url;
    })
    .catch(function () {});
}
