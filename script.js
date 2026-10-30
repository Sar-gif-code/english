// Email service endpoints. Leave empty until MailerLite / Brevo is connected:
// while empty, forms run in demo mode and never store or send addresses.
const FORM_ENDPOINTS = {
  guide: "",
  waitlist: "",
  test: ""
};

const SUCCESS = {
  guide: "Thank you! Please check your inbox to confirm your email and get the guide.",
  waitlist: "You’re on the list! Please check your inbox to confirm your email.",
  test: "Thank you! Please check your inbox to confirm your email and get your study plan."
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

document.querySelectorAll(".signup").forEach((form) => {
  const email = form.querySelector('input[name="email"]');
  const consent = form.querySelector('input[name="consent"]');
  const button = form.querySelector('button[type="submit"]');
  const status = form.querySelector(".form-status");
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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const value = email.value.trim();

    if (!value) {
      email.setAttribute("aria-invalid", "true");
      email.focus();
      return show("Please enter your email address.", "error");
    }
    if (!EMAIL_RE.test(value)) {
      email.setAttribute("aria-invalid", "true");
      email.focus();
      return show("Please enter a valid email address, e.g. name@example.com.", "error");
    }
    email.removeAttribute("aria-invalid");
    if (!consent.checked) {
      consent.setAttribute("aria-invalid", "true");
      consent.focus();
      return show("Please confirm that you agree to receive emails.", "error");
    }

    const endpoint = FORM_ENDPOINTS[form.dataset.form];
    if (!endpoint) {
      return show("Demo mode: this form is not connected to an email service yet, so nothing was sent or saved.", "info");
    }

    button.disabled = true;
    button.textContent = "Sending…";
    show("", "");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: value,
          language: form.querySelector('select[name="language"]').value,
          level: form.querySelector('[name="level"]')?.value || "",
          source: form.dataset.form
        })
      });
      if (!res.ok) throw new Error(res.status);
      form.reset();
      show(SUCCESS[form.dataset.form], "success");
    } catch {
      show("Something went wrong. Please try again in a moment.", "error");
    } finally {
      button.disabled = false;
      button.textContent = label;
    }
  });
});
