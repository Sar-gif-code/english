// Level filter and search for Vocabulary, Terms and Phrases pages
const chipButtons = document.querySelectorAll(".chip");
const searchInput = document.getElementById("term-search");
const items = document.querySelectorAll("main [data-level]");
const emptyNote = document.querySelector(".empty-note");
let level = "all";

function apply() {
  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
  let shown = 0;
  items.forEach((item) => {
    const okLevel = level === "all" || item.dataset.level === level;
    const okSearch = !query || (item.dataset.search || item.textContent.toLowerCase()).includes(query);
    item.hidden = !(okLevel && okSearch);
    if (!item.hidden) shown++;
  });

  // Hide topic sections with nothing left in them
  document.querySelectorAll(".filter-group").forEach((group) => {
    group.hidden = !group.querySelector("[data-level]:not([hidden])");
  });

  // Hide A–Z letters on the glossary when all their terms are hidden
  document.querySelectorAll(".letter").forEach((letter) => {
    let el = letter.nextElementSibling;
    let any = false;
    while (el && !el.classList.contains("letter")) {
      if (!el.hidden) any = true;
      el = el.nextElementSibling;
    }
    letter.hidden = !any;
  });

  if (emptyNote) emptyNote.hidden = shown > 0;
}

chipButtons.forEach((chip) =>
  chip.addEventListener("click", () => {
    level = chip.dataset.filter;
    chipButtons.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
    apply();
  })
);
if (searchInput) searchInput.addEventListener("input", apply);
