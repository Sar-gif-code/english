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
    topBar.classList.toggle("solid", !dark && (motion ? rw.bottom <= 60 : scrollY > innerHeight * .8));
  }
  const motion = document.documentElement.classList.contains("motion");
  addEventListener("scroll", headerState, { passive: true });
  headerState();
  const hero = $("#hero");
  if (!motion) { if (hero) { hero.removeAttribute("autoplay"); hero.pause(); } return; }

  const A = "/assets/home/";
  const top = $("#top"), scene = $("#film-scene"), world = $("#world");
  const film = $("#film"), ctx = film.getContext("2d");
  const inside = $("#inside"), car = $("#car"), tower = $("#tower");
  const cities = [...document.querySelectorAll(".city")], names = [...document.querySelectorAll(".city-name")];

  // V1 (key leaves her hand) and V2 (door A0) as frame sequences: smooth scrubbing on every phone
  const small = innerWidth < 900;
  const clips = [
    { dir: small ? "v1m" : "v1d", n: small ? 60 : 75, px: small ? .58 : .5, imgs: [] },
    { dir: small ? "v2m" : "v2d", n: 72, px: .5, imgs: [] }
  ];
  let last = "";
  const ready = (im) => im && im.complete && im.naturalWidth;
  function load(c, i) {
    if (c.imgs[i]) return c.imgs[i];
    const im = new Image(); im.decoding = "async";
    im.src = `${A}${c.dir}/${String(i + 1).padStart(3, "0")}.webp`;
    im.onload = () => { last = ""; requestAnimationFrame(frame); };
    return (c.imgs[i] = im);
  }
  function preload() {
    clips.forEach((c) => { load(c, 0); load(c, c.n - 1); });
    clips.forEach((c) => { for (let i = 1; i < c.n - 1; i++) load(c, i); });
  }
  function size() { const r = devicePixelRatio > 1 ? 1.5 : 1; film.width = innerWidth * r; film.height = innerHeight * r; last = ""; }
  function draw(k, t) {
    const c = clips[k];
    let i = Math.round(t * (c.n - 1));
    while (i > 0 && !ready(c.imgs[i])) i--;
    const im = c.imgs[i]; if (!ready(im)) { load(c, 0); return; }
    const id = k + ":" + i; if (id === last) return; last = id;
    const cw = film.width, ch = film.height, sc = Math.max(cw / im.naturalWidth, ch / im.naturalHeight);
    const w = im.naturalWidth * sc, h = im.naturalHeight * sc;
    ctx.drawImage(im, (cw - w) * c.px, (ch - h) * .3, w, h);
  }

  function frame() {
    // the last part of the film is a calm pause to read the levels
    const p = clamp(prog(scene) * 1100 / 960), pw = prog(world);

    // Mrs. Kami live (V0) → V1, the key leaves her hand → dissolve → V2, the key opens door A0
    $(".hero-bg").style.transform = `scale(${lerp(1, 1.04, seg(p, 0, .09))})`;
    $(".hero-text").style.transform = `translateY(${-50 * ease(seg(p, 0, .09))}px)`;
    $(".hero-text").style.opacity = 1 - seg(p, .02, .08);
    $(".hero-text").style.visibility = p > .09 ? "hidden" : "visible";
    const fade = seg(p, .055, .075);
    film.style.opacity = fade;
    if (hero) { if (fade > .01 && !hero.paused) hero.pause(); else if (fade <= .01 && hero.paused) hero.play().catch(() => {}); }
    let blur = 0;
    if (p < .51) { draw(0, seg(p, .09, .48)); blur = seg(p, .48, .51) * 12; }
    else { draw(1, seg(p, .54, .8)); blur = (1 - seg(p, .51, .55)) * 12 + seg(p, .8, .86) * 6; }
    film.style.filter = blur ? `blur(${blur}px)` : "none";
    $("#cap-key").style.opacity = seg(p, .33, .39) * (1 - seg(p, .46, .5));

    // Inside the open door: the levels appear and light up from A0
    const inn = seg(p, .81, .86);
    inside.style.opacity = inn;
    inside.style.transform = `scale(${lerp(1.06, 1, inn)})`;
    inside.classList.toggle("on", inn > .5);
    const lit = Math.max(inn > .5 ? 1 : 0, Math.round(seg(p, .86, .93) * floors.length));
    floors.forEach((f, i) => f.classList.toggle("lit", i < lit));
    const tr = tower.getBoundingClientRect(), lf = floors[Math.max(0, lit - 1)].getBoundingClientRect();
    car.style.top = (lit ? lf.top - tr.top + lf.height / 2 - 15 : tr.height - 30) + "px";

    // Unlock the world: cities one after another, then the final line
    const n = cities.length, cp = seg(pw, 0, .7) * n;
    cities.forEach((c, i) => {
      const local = cp - i;
      const o = clamp(local < 0 ? 0 : local < 1 ? Math.min(local * 3, 1) : 1 - (local - 1) * 3);
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
  let ticking = false;
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; frame(); }); } }, { passive: true });
  addEventListener("resize", () => { size(); frame(); });
  addEventListener("load", () => { preload(); frame(); });
  frame();
})();
