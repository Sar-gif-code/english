// Sign-up endpoint: Google Apps Script web app URL that writes rows to the waitlist Google Sheet.
// While empty, forms run in demo mode and never store or send anything.
const SHEET_ENDPOINT = "https://script.google.com/macros/s/AKfycbx_i5BUJMOmWlSvKuXf-nDThOYY3Fvv7wDetm5yGUFNH4vEW2BDdTvu1cwTsYhbfwgr/exec";

// Free A0 flashcards PDF per native language. Empty = not uploaded yet.
const FLASHCARDS_PDF = {
  Russian: "",
  Spanish: "",
  Turkish: ""
};

const RU = document.documentElement.lang === "ru";
const T = RU ? {
  emailEmpty: "Введите email.",
  emailBad: "Проверьте email, например name@example.com.",
  consent: "Подтвердите согласие получать письма.",
  demo: "Форма пока в тестовом режиме: данные не сохраняются.",
  sending: "Отправляем…",
  error: "Что-то пошло не так. Попробуйте ещё раз через минуту.",
  waitlist: "Готово! Вы в списке ожидания курса.",
  pdf: "Скачать карточки (PDF)",
  pdfLater: "Карточки пришлём на ваш email, как только они будут готовы."
} : {
  emailEmpty: "Please enter your email address.",
  emailBad: "Please enter a valid email address, e.g. name@example.com.",
  consent: "Please confirm that you agree to receive emails.",
  demo: "Demo mode: this form is not connected yet, so nothing was sent or saved.",
  sending: "Sending…",
  error: "Something went wrong. Please try again in a moment.",
  waitlist: "You’re on the waitlist!",
  guide: "Thank you! You’re subscribed.",
  test: "Thank you! You’re subscribed.",
  pdf: "Download the flashcards (PDF)",
  pdfLater: "We’ll email you the flashcards as soon as they’re ready."
};

// Mobile menu
const toggle = document.querySelector(".menu-toggle");
const nav = document.getElementById("main-nav");
toggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(open));
});
nav.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  })
);

// Pronunciation via the browser's built-in speech engine
document.querySelectorAll(".listen").forEach((btn) => {
  if (!("speechSynthesis" in window)) { btn.hidden = true; return; }
  btn.addEventListener("click", () => {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(btn.dataset.say);
    u.lang = "en-US";
    u.rate = 0.9;
    speechSynthesis.speak(u);
  });
});

// Forms
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// "Other" language reveals a text field
document.querySelectorAll("select[data-other]").forEach((sel) => {
  const box = sel.form.querySelector(`[data-other-for="${sel.name}"]`);
  sel.addEventListener("change", () => { box.hidden = sel.value !== "Other"; });
});

document.querySelectorAll(".signup").forEach((form) => {
  const email = form.querySelector('input[name="email"]');
  const consent = form.querySelector('input[name="consent"]');
  const button = form.querySelector('button[type="submit"]');
  const status = form.querySelector(".form-status");
  const pdfBox = form.querySelector(".pdf-download");
  const label = button.textContent;

  const show = (text, type) => {
    status.textContent = text;
    status.className = "form-status" + (type ? " " + type : "");
  };

  [email, consent].forEach((el) =>
    el.addEventListener("input", () => {
      el.removeAttribute("aria-invalid");
      if (status.classList.contains("error")) show("", "");
    })
  );

  const showPdf = (language) => {
    if (!pdfBox) return;
    const url = FLASHCARDS_PDF[language];
    // Unlisted language: offer every available version to pick the closest one.
    const links = url ? [[language, url]]
      : language in FLASHCARDS_PDF ? []
      : Object.entries(FLASHCARDS_PDF).filter(([, u]) => u);
    pdfBox.hidden = false;
    pdfBox.innerHTML = links.length
      ? links.map(([lang, u]) => `<a class="btn btn-dark btn-block" href="${u}" download>${T.pdf}${links.length > 1 ? " — " + lang : ""}</a>`).join("")
      : `<p class="muted">${T.pdfLater}</p>`;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const value = email.value.trim();

    if (!value) {
      email.setAttribute("aria-invalid", "true");
      email.focus();
      return show(T.emailEmpty, "error");
    }
    if (!EMAIL_RE.test(value)) {
      email.setAttribute("aria-invalid", "true");
      email.focus();
      return show(T.emailBad, "error");
    }
    email.removeAttribute("aria-invalid");
    if (!consent.checked) {
      consent.setAttribute("aria-invalid", "true");
      consent.focus();
      return show(T.consent, "error");
    }

    if (!SHEET_ENDPOINT) return show(T.demo, "info");

    const data = Object.fromEntries(new FormData(form));
    delete data.consent;
    data.email = value;
    data.form = form.dataset.form;
    data.source = form.dataset.source || location.pathname;
    data.page_lang = RU ? "ru" : "en";

    button.disabled = true;
    button.textContent = T.sending;
    show("", "");
    try {
      // Simple form-encoded POST: no CORS preflight, works with Apps Script.
      await fetch(SHEET_ENDPOINT, { method: "POST", mode: "no-cors", body: new URLSearchParams(data) });
      if (typeof gtag === "function") gtag("event", "sign_up", { method: data.form, page_lang: data.page_lang });
      form.reset();
      form.querySelectorAll("[data-other-for]").forEach((b) => (b.hidden = true));
      show(T[data.form] || T.waitlist, "success");
      if (data.form === "waitlist") showPdf(data.language);
    } catch {
      show(T.error, "error");
    } finally {
      button.disabled = false;
      button.textContent = label;
    }
  });
});
