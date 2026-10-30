// Real Estate English level test: 3 questions per level, A1 → C1.
// The first option in each list is the correct one; options are shuffled on screen.
const QUESTIONS = [
  { level: "A1", q: "This apartment ___ two bedrooms.", options: ["has", "have", "is"] },
  { level: "A1", q: "You cook in the ___.", options: ["kitchen", "bathroom", "balcony"] },
  { level: "A1", q: "How do you say the price “€250,000”?", options: ["Two hundred and fifty thousand euros", "Two million fifty euros", "Twenty-five thousand euros"] },

  { level: "A2", q: "___ you like to see the apartment on Monday?", options: ["Would", "Do", "Are"] },
  { level: "A2", q: "The flat is ___ the third floor.", options: ["on", "in", "at"] },
  { level: "A2", q: "A client asks: “Is it far from the beach?” Choose the best answer.", options: ["No, it’s a five-minute walk.", "Yes, I am far.", "It is beach."] },

  { level: "B1", q: "If you ___ an offer today, the seller may accept it.", options: ["make", "will make", "made"] },
  { level: "B1", q: "The property ___ last year, so everything is new.", options: ["was renovated", "renovated", "has renovate"] },
  { level: "B1", q: "Which sentence is best for a professional email?", options: ["Please find attached the floor plan.", "Here floor plan for you.", "I send you plan in attach."] },

  { level: "B2", q: "What is a “down payment”?", options: ["The part of the price the buyer pays upfront; the rest is usually a loan", "A monthly fee for building maintenance", "The commission paid to the agent"] },
  { level: "B2", q: "A buyer says: “The price is too high.” Choose the most professional reply.", options: ["I understand. Let me show you comparable properties in the area.", "No, it isn’t.", "Then you should buy something cheaper."] },
  { level: "B2", q: "The seller is willing to ___ on the price.", options: ["negotiate", "discuss about", "talk over it"] },

  { level: "C1", q: "What does “leasehold” mean?", options: ["You own the property for a fixed number of years, not permanently", "You rent the property month by month", "You own the property and the land forever"] },
  { level: "C1", q: "The property has been ___ priced, so I expect strong interest.", options: ["competitively", "competitive", "competition"] },
  { level: "C1", q: "Which sentence best softens bad news for a client?", options: ["I’m afraid the seller has declined your offer, but there may be room for a revised one.", "The seller said no.", "Your offer was bad, sorry."] }
];

const LEVELS = {
  A1: { name: "Start", color: "var(--teal)", text: "You’re starting from the basics — perfect. You’ll learn your first words for work: greetings, numbers and prices, property types and rooms." },
  A2: { name: "Basic", color: "#2BB673", text: "You know the basics. Next step: simple conversations and messages — arranging viewings, describing the area, WhatsApp replies." },
  B1: { name: "Confident", color: "var(--yellow)", text: "You can communicate. Now let’s make you confident running a viewing on your own, answering questions and writing client emails." },
  B2: { name: "Professional", color: "var(--coral)", text: "Strong level! Focus on negotiations, handling objections and explaining mortgages and contract terms." },
  C1: { name: "Pro", color: "#7C5CFF", text: "Excellent! Polish your presentations, complex negotiations and investment and legal vocabulary." }
};
const ORDER = ["A1", "A2", "B1", "B2", "C1"];

const shuffle = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);

const intro = document.getElementById("test-intro");
const quiz = document.getElementById("test-quiz");
const result = document.getElementById("test-result");
const qText = document.getElementById("q-text");
const qOptions = document.getElementById("q-options");
const qCount = document.getElementById("q-count");
const progress = document.getElementById("q-progress");
const nextBtn = document.getElementById("q-next");
const backBtn = document.getElementById("q-back");

let current = 0;
let answers = [];
let shuffled = [];

function start() {
  current = 0;
  answers = new Array(QUESTIONS.length).fill(null);
  shuffled = QUESTIONS.map((q) => shuffle(q.options.map((text, i) => ({ text, correct: i === 0 }))));
  const status = result.querySelector(".form-status");
  status.textContent = "";
  status.className = "form-status";
  intro.hidden = true;
  result.hidden = true;
  quiz.hidden = false;
  render();
}

function render() {
  const q = QUESTIONS[current];
  qCount.textContent = `Question ${current + 1} of ${QUESTIONS.length}`;
  progress.style.width = `${(current / QUESTIONS.length) * 100}%`;
  qText.textContent = q.q;
  qOptions.innerHTML = "";
  shuffled[current].forEach((opt, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "option";
    b.textContent = opt.text;
    b.setAttribute("aria-pressed", String(answers[current] === i));
    b.addEventListener("click", () => {
      answers[current] = i;
      qOptions.querySelectorAll(".option").forEach((o, j) => o.setAttribute("aria-pressed", String(j === i)));
      nextBtn.disabled = false;
    });
    qOptions.appendChild(b);
  });
  nextBtn.disabled = answers[current] === null;
  nextBtn.textContent = current === QUESTIONS.length - 1 ? "See my result" : "Next";
  backBtn.hidden = current === 0;
  qText.focus();
}

function finish() {
  progress.style.width = "100%";
  const score = Object.fromEntries(ORDER.map((l) => [l, 0]));
  QUESTIONS.forEach((q, i) => {
    if (shuffled[i][answers[i]].correct) score[q.level]++;
  });

  // A level counts as passed with at least 2 of 3 correct; levels must be passed in order.
  let passed = -1;
  for (let i = 0; i < ORDER.length; i++) {
    if (score[ORDER[i]] >= 2) passed = i; else break;
  }
  const level = ORDER[Math.min(passed + 1, ORDER.length - 1)];
  const info = LEVELS[level];
  const total = Object.values(score).reduce((a, b) => a + b, 0);

  document.getElementById("r-badge").textContent = level;
  document.getElementById("r-badge").style.background = info.color;
  document.getElementById("r-name").textContent = `${level} — ${info.name}`;
  document.getElementById("r-text").textContent = info.text;
  document.getElementById("r-score").textContent = `${total} of ${QUESTIONS.length} correct`;
  document.getElementById("r-level-input").value = level;
  document.getElementById("r-bars").innerHTML = ORDER.map((l) => `
    <div class="bar-row"><span class="lvl">${l}</span>
      <div class="bar"><div style="width:${(score[l] / 3) * 100}%; background:${LEVELS[l].color}"></div></div>
      <span class="bar-num">${score[l]}/3</span></div>`).join("");

  quiz.hidden = true;
  result.hidden = false;
  result.scrollIntoView({ behavior: "smooth", block: "start" });
}

document.getElementById("test-start").addEventListener("click", start);
document.getElementById("test-retake").addEventListener("click", start);
nextBtn.addEventListener("click", () => {
  if (current < QUESTIONS.length - 1) { current++; render(); } else finish();
});
backBtn.addEventListener("click", () => { if (current > 0) { current--; render(); } });
