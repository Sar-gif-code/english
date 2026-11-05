// English for Real Estate — homepage film (Mrs. Kami → key → door A0 → levels → world)
(() => {
  const $ = (s) => document.querySelector(s);
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const ease = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (el) => { const r = el.getBoundingClientRect(); return clamp(-r.top / (r.height - innerHeight)); };

  // Mobile menu
  const menuBtn = $("#menu-btn"), menu = $("#menu");
  menuBtn.addEventListener("click", () => { const open = menu.classList.toggle("open"); menuBtn.setAttribute("aria-expanded", open); });
  menu.addEventListener("click", (e) => { if (e.target.tagName === "A") { menu.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); } });

  // Levels: only one open at a time
  const floors = [...document.querySelectorAll(".floor")];
  floors.forEach((d) => d.addEventListener("toggle", () => { if (d.open) floors.forEach((o) => { if (o !== d) o.open = false; }); }));

  // Header turns solid over the plain sections
  const topBar = $("#top"), filmScene = $("#film-scene"), worldScene = $("#world");
  function headerState() {
    const rw = worldScene.getBoundingClientRect(), dark = rw.top <= 60 && rw.bottom > 60;
    topBar.classList.toggle("dark", dark);
    topBar.classList.toggle("solid", !dark && (motion ? filmScene.getBoundingClientRect().bottom <= 60 : scrollY > innerHeight * .8));
  }
  const motion = document.documentElement.classList.contains("motion");
  addEventListener("scroll", headerState, { passive: true });
  headerState();
  const hero = $("#hero");
  if (!motion) { if (hero) { hero.removeAttribute("autoplay"); hero.pause(); } return; }

  const A = "/assets/home/";
  const top = $("#top"), scene = $("#film-scene"), world = $("#world");
  const film = $("#film"), ctx = film.getContext("2d");
  const light = $("#light");
  const cities = [...document.querySelectorAll(".city")], names = [...document.querySelectorAll(".city-name")];

  // V1 (key leaves her hand) and V2 (door A0) as frame sequences: smooth scrubbing on every phone
  const small = innerWidth < 900;
  const clips = [
    { dir: small ? "v1m" : "v1d", n: small ? 60 : 75, px: small ? .58 : .5, imgs: [] },
    { dir: small ? "v2m" : "v2d", n: 72, px: .5, imgs: [] }
  ];
  const ready = (im) => im && im.complete && im.naturalWidth;
  function load(c, i) {
    if (c.imgs[i]) return c.imgs[i];
    const im = new Image(); im.decoding = "async";
    im.src = `${A}${c.dir}/${String(i + 1).padStart(3, "0")}.webp`;
    im.onload = () => { lastDraw = ""; kick(); };
    return (c.imgs[i] = im);
  }
  function preload() {
    clips.forEach((c) => { load(c, 0); load(c, c.n - 1); });
    clips.forEach((c) => { for (let i = 1; i < c.n - 1; i++) load(c, i); });
  }
  function size() { const r = devicePixelRatio > 1 ? 1.5 : 1; film.width = innerWidth * r; film.height = innerHeight * r; lastDraw = ""; }
  function nearest(c, i) { let j = i; while (j > 0 && !ready(c.imgs[j])) j--; return ready(c.imgs[j]) ? j : -1; }
  function paint(c, im, alpha) {
    const cw = film.width, ch = film.height, sc = Math.max(cw / im.naturalWidth, ch / im.naturalHeight);
    const w = im.naturalWidth * sc, h = im.naturalHeight * sc;
    ctx.globalAlpha = alpha;
    ctx.drawImage(im, (cw - w) * c.px, (ch - h) * .3, w, h);
    ctx.globalAlpha = 1;
  }
  // Draw between two neighbouring frames, blending them, so the motion has no steps
  let lastDraw = "";
  function draw(k, t) {
    const c = clips[k], f = t * (c.n - 1), i = Math.floor(f), a = f - i;
    const i0 = nearest(c, i); if (i0 < 0) { load(c, 0); return; }
    const i1 = Math.min(c.n - 1, i + 1), next = i0 === i && a > .02 && ready(c.imgs[i1]) ? i1 : -1;
    const id = `${k}:${i0}:${next}:${Math.round(a * 20)}`; if (id === lastDraw) return; lastDraw = id;
    paint(c, c.imgs[i0], 1);
    if (next >= 0) paint(c, c.imgs[next], a);
  }

  // Smooth follow: the film eases toward the scroll position instead of jumping with it
  let tp = 0, dp = 0, tw = 0, dw = 0, running = false;
  const follow = small ? .2 : .12;
  function readScroll() { tp = prog(scene); tw = prog(world); }
  function kick() { if (!running) { running = true; requestAnimationFrame(tick); } }
  function tick() {
    readScroll();
    dp += (tp - dp) * follow; dw += (tw - dw) * follow;
    if (Math.abs(tp - dp) < .0004) dp = tp;
    if (Math.abs(tw - dw) < .0004) dw = tw;
    render(dp, dw);
    if (dp !== tp || dw !== tw) requestAnimationFrame(tick); else running = false;
  }

  function render(p, pw) {
    // Mrs. Kami live (V0) → V1, the key leaves her hand → dissolve → V2, the key opens door A0 → light
    $(".hero-bg").style.transform = `scale(${lerp(1, 1.04, seg(p, 0, .1))})`;
    $(".hero-text").style.transform = `translateY(${-50 * ease(seg(p, 0, .1))}px)`;
    $(".hero-text").style.opacity = 1 - seg(p, .02, .08);
    $(".hero-text").style.visibility = p > .1 ? "hidden" : "visible";
    const fade = seg(p, .06, .085);
    film.style.opacity = fade;
    if (hero) { if (fade > .01 && !hero.paused) hero.pause(); else if (fade <= .01 && hero.paused && !hero.ended) hero.play().catch(() => {}); }
    let blur = 0;
    if (p < .55) { draw(0, seg(p, .1, .52)); blur = seg(p, .52, .55) * 12; }
    else { draw(1, seg(p, .58, .88)); blur = (1 - seg(p, .55, .59)) * 12; }
    film.style.filter = blur ? `blur(${blur}px)` : "none";
    $("#cap-key").style.opacity = seg(p, .34, .4) * (1 - seg(p, .48, .52));
    // The door opens into light, and the light becomes the levels section below
    light.style.opacity = ease(seg(p, .86, .925));

    // Unlock the world: cities one after another, then the final line
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

  size();
  addEventListener("scroll", kick, { passive: true });
  addEventListener("resize", () => { size(); readScroll(); dp = tp; dw = tw; render(dp, dw); });
  addEventListener("load", () => { preload(); kick(); });

  // Smooth wheel scrolling on computers (touch keeps the phone's own natural scrolling)
  if (window.Lenis && matchMedia("(pointer: fine)").matches) {
    const lenis = new Lenis({ lerp: .1, smoothWheel: true });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  readScroll(); dp = tp; dw = tw; render(dp, dw);
})();
