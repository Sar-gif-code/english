// English for Real Estate — homepage (Mrs. Kami → six levels → the world)
(() => {
  const $ = (s) => document.querySelector(s);
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (el) => { const r = el.getBoundingClientRect(); return clamp(-r.top / (r.height - innerHeight)); };

  // Mobile menu
  const menuBtn = $("#menu-btn"), menu = $("#menu");
  menuBtn.addEventListener("click", () => { const open = menu.classList.toggle("open"); menuBtn.setAttribute("aria-expanded", open); });
  menu.addEventListener("click", (e) => { if (e.target.tagName === "A") { menu.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); } });

  // Header: clear over Mrs. Kami, light over the plain sections, dark over the cities
  const topBar = $("#top"), world = $("#world");
  function headerState() {
    const rw = world.getBoundingClientRect(), dark = rw.top <= 60 && rw.bottom > 60;
    topBar.classList.toggle("dark", dark);
    topBar.classList.toggle("solid", !dark && scrollY > 40);
  }
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

  const motion = document.documentElement.classList.contains("motion");
  const hero = $("#hero");
  if (!motion) { if (hero) { hero.removeAttribute("autoplay"); hero.pause(); } return; }

  // Unlock the world: cities one after another, then the final line (eased, so it never jumps)
  const cities = [...document.querySelectorAll(".city")], names = [...document.querySelectorAll(".city-name")];
  let tw = 0, dw = 0, running = false;
  function kick() { if (!running) { running = true; requestAnimationFrame(tick); } }
  function tick() {
    tw = prog(world); dw += (tw - dw) * .15;
    if (Math.abs(tw - dw) < .0004) dw = tw;
    render(dw);
    if (dw !== tw) requestAnimationFrame(tick); else running = false;
  }
  function render(pw) {
    const n = cities.length, cp = seg(pw, 0, .7) * n;
    cities.forEach((c, i) => {
      const local = cp - i;
      const o = i === 0 && local < 1 ? 1 : clamp(local < 0 ? 0 : local < 1 ? Math.min(local * 3, 1) : 1 - (local - 1) * 3);
      c.style.opacity = i === n - 1 && local >= 1 ? 1 : o;
      c.style.transform = `scale(${lerp(1.12, 1, clamp(local))})`;
    });
    names.forEach((m, i) => { const local = cp - i; m.style.opacity = clamp(local * 4) * (1 - clamp((local - .7) * 4)); });
    const fin = seg(pw, .72, .9);
    $("#finale-title").style.opacity = fin;
    $("#finale-title").style.transform = `translateY(${30 * (1 - fin)}px)`;
    $("#finale-actions").style.opacity = seg(pw, .85, .97);
  }
  addEventListener("scroll", kick, { passive: true });
  addEventListener("resize", kick);
  tw = dw = prog(world); render(dw);

  // Smooth wheel scrolling on computers (touch keeps the phone's own natural scrolling)
  if (window.Lenis && matchMedia("(pointer: fine)").matches) {
    const lenis = new Lenis({ lerp: .1, smoothWheel: true });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
})();
