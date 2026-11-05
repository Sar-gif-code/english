// English for Real Estate — homepage (Mrs. Kami → six-floor house → cities → resources → app)
(() => {
  const $ = (s) => document.querySelector(s);

  // Mobile menu
  const menuBtn = $("#menu-btn"), menu = $("#menu");
  menuBtn.addEventListener("click", () => { const open = menu.classList.toggle("open"); menuBtn.setAttribute("aria-expanded", open); });
  menu.addEventListener("click", (e) => { if (e.target.tagName === "A") { menu.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); } });

  // Header turns solid once the page moves
  const topBar = $("#top");
  const headerState = () => topBar.classList.toggle("solid", scrollY > 40);
  addEventListener("scroll", headerState, { passive: true });
  headerState();

  // The house: one floor per level. Hover or tap a floor (or a row) and both light up together
  const spots = [...document.querySelectorAll(".spot")], levels = [...document.querySelectorAll(".level")];
  function choose(i) {
    spots.forEach((s) => s.classList.toggle("on", +s.dataset.i === i));
    levels.forEach((l) => { const on = +l.dataset.i === i; l.classList.toggle("on", on); l.querySelector(".row").setAttribute("aria-expanded", on); });
  }
  const hover = matchMedia("(hover: hover) and (pointer: fine)").matches;
  spots.forEach((s) => { s.addEventListener("click", () => choose(+s.dataset.i)); if (hover) s.addEventListener("mouseenter", () => choose(+s.dataset.i)); });
  levels.forEach((l) => { const r = l.querySelector(".row"); r.addEventListener("click", () => choose(+l.dataset.i)); if (hover) r.addEventListener("mouseenter", () => choose(+l.dataset.i)); });
  choose(0);

  // The phone screen: the listen button really speaks the word
  const say = $(".scr-listen");
  if (say && "speechSynthesis" in window) say.addEventListener("click", () => {
    speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(say.dataset.say); u.lang = "en-US"; u.rate = .9; speechSynthesis.speak(u);
  });

  // Waitlist form (same fields and sheet as /waitlist), with the free A0 flashcards right after
  const ENDPOINT = "https://script.google.com/macros/s/AKfycbx_i5BUJMOmWlSvKuXf-nDThOYY3Fvv7wDetm5yGUFNH4vEW2BDdTvu1cwTsYhbfwgr/exec";
  const PDF = { Russian: "/downloads/free-flashcards-ru.pdf", Spanish: "/downloads/free-flashcards-es.pdf", Turkish: "/downloads/free-flashcards-tr.pdf" };
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  document.querySelectorAll("select[data-other]").forEach((sel) => {
    const box = sel.form.querySelector(`[data-other-for="${sel.name}"]`);
    sel.addEventListener("change", () => { box.hidden = sel.value !== "Other"; });
  });
  document.querySelectorAll(".signup").forEach((form) => {
    const email = form.querySelector('[name="email"]'), consent = form.querySelector('[name="consent"]');
    const button = form.querySelector('button[type="submit"]'), status = form.querySelector(".form-status"), pdfBox = form.querySelector(".pdf-download");
    const label = button.textContent;
    const show = (t, type) => { status.textContent = t; status.className = "form-status" + (type ? " " + type : ""); };
    [email, consent].forEach((el) => el.addEventListener("input", () => el.removeAttribute("aria-invalid")));
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const value = email.value.trim();
      if (!value || !EMAIL.test(value)) { email.setAttribute("aria-invalid", "true"); email.focus(); return show(value ? "Please enter a valid email address, e.g. name@example.com." : "Please enter your email address.", "error"); }
      if (!consent.checked) { consent.setAttribute("aria-invalid", "true"); consent.focus(); return show("Please confirm that you agree to receive emails.", "error"); }
      const data = Object.fromEntries(new FormData(form)); delete data.consent;
      data.email = value; data.form = form.dataset.form;
      const q = new URLSearchParams(location.search);
      data.source = (q.get("utm_source") || q.get("src") || "").trim().toLowerCase().slice(0, 50) || form.dataset.source || location.pathname;
      data.page_lang = "en";
      button.disabled = true; button.textContent = "Sending…"; show("", "");
      try {
        await fetch(ENDPOINT, { method: "POST", mode: "no-cors", body: new URLSearchParams(data) });
        if (typeof gtag === "function") gtag("event", "sign_up", { method: data.form, page_lang: "en" });
        form.reset(); form.querySelectorAll("[data-other-for]").forEach((b) => (b.hidden = true));
        show("You’re on the waitlist!", "success");
        const links = PDF[data.language] ? [[data.language, PDF[data.language]]] : Object.entries(PDF);
        pdfBox.hidden = false;
        pdfBox.innerHTML = links.map(([l, u]) => `<a href="${u}" download>Download the flashcards (PDF)${links.length > 1 ? " — " + l : ""}</a>`).join("");
      } catch { show("Something went wrong. Please try again in a moment.", "error"); }
      finally { button.disabled = false; button.textContent = label; }
    });
  });

  // Smooth wheel scrolling on computers (touch keeps the phone's own natural scrolling)
  let lenis = null;
  if (document.documentElement.classList.contains("motion") && window.Lenis && matchMedia("(pointer: fine)").matches) {
    lenis = new Lenis({ lerp: .1, smoothWheel: true });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  // In-page links (App) glide to their section
  document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const el = document.querySelector(a.getAttribute("href")); if (!el) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(el, { offset: -70 }); else el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    history.replaceState(null, "", a.getAttribute("href"));
  }));

  // The golden key turns as you scroll through the finale
  const key = $("#key");
  if (key && document.documentElement.classList.contains("motion")) {
    let ticking = false;
    const turn = () => {
      ticking = false;
      const r = key.getBoundingClientRect(), mid = r.top + r.height / 2;
      // one full turn while the key rises to the middle of the screen; face-on from there
      const t = Math.min(1, Math.max(0, (innerHeight - mid) / (innerHeight * .5)));
      const e = 1 - Math.pow(1 - t, 3);
      key.style.transform = `perspective(700px) translateY(${(1 - e) * 40}px) rotate(${(1 - e) * -18}deg) rotateY(${e * 360}deg)`;
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(turn); } }, { passive: true });
    turn();
  }

  const hero = $("#hero");
  if (!document.documentElement.classList.contains("motion") && hero) { hero.removeAttribute("autoplay"); hero.pause(); }
})();
