/* =========================================================================
   Metara Admin — editor completo della homepage
   ========================================================================= */
let CFG = null;
const $ = (sel, ctx = document) => ctx.querySelector(sel);

/* ---------- Toast ---------- */
function toast(msg, isError = false) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.toggle("error", isError);
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2600);
}

/* ---------- Helpers DOM ---------- */
function el(html) { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; }

function colorField(label, getVal, onChange) {
  const wrap = el(`<div class="field"><label>${label}</label>
    <div class="color-field"><input type="color"><input type="text"></div></div>`);
  const color = wrap.querySelector('input[type=color]');
  const text = wrap.querySelector('input[type=text]');
  const v = getVal() || "#000000";
  color.value = /^#[0-9a-f]{6}$/i.test(v) ? v : "#000000";
  text.value = v;
  color.addEventListener("input", () => { text.value = color.value; onChange(color.value); });
  text.addEventListener("input", () => { if (/^#[0-9a-f]{6}$/i.test(text.value)) color.value = text.value; onChange(text.value); });
  return wrap;
}

function textField(label, value, onChange, type = "text", note = "") {
  const wrap = el(`<div class="field"><label>${label}</label><input type="${type}"></div>`);
  const input = wrap.querySelector("input");
  input.value = value == null ? "" : value;
  if (type === "number") { input.step = "0.05"; input.min = "0"; }
  input.addEventListener("input", () => onChange(input.value));
  if (note) wrap.appendChild(el(`<span class="dim-note">${note}</span>`));
  return wrap;
}

function checkboxField(label, value, onChange, note = "") {
  const wrap = el(`<div class="field field-check"><label class="check-label"><input type="checkbox"><span>${label}</span></label></div>`);
  const input = wrap.querySelector("input");
  input.checked = !!value;
  input.addEventListener("change", () => onChange(input.checked));
  if (note) wrap.appendChild(el(`<span class="dim-note">${note}</span>`));
  return wrap;
}

function selectField(label, value, options, onChange, note = "") {
  const opts = options.map(o => `<option value="${o.value}"${String(o.value) === String(value) ? " selected" : ""}>${o.label}</option>`).join("");
  const wrap = el(`<div class="field"><label>${label}</label><select>${opts}</select></div>`);
  const sel = wrap.querySelector("select");
  sel.addEventListener("change", () => onChange(sel.value));
  if (note) wrap.appendChild(el(`<span class="dim-note">${note}</span>`));
  return wrap;
}

function areaField(label, value, onChange) {
  const wrap = el(`<div class="field"><label>${label}</label><textarea></textarea></div>`);
  const input = wrap.querySelector("textarea");
  input.value = value == null ? "" : value;
  input.addEventListener("input", () => onChange(input.value));
  return wrap;
}

function imageField(label, value, onChange, note = "") {
  const wrap = el(`<div class="field"><label>${label}</label>
    <div class="img-row">
      <img class="thumb" alt="" />
      <input type="text" placeholder="URL immagine o carica un file" />
      <label class="btn small ghost">⬆ Carica<input type="file" accept="image/*" hidden></label>
      <button type="button" class="btn small danger">✕</button>
    </div></div>`);
  const thumb = wrap.querySelector(".thumb");
  const input = wrap.querySelector('input[type=text]');
  const file = wrap.querySelector('input[type=file]');
  const clear = wrap.querySelector(".danger");
  const setVal = (v) => { input.value = v || ""; thumb.src = v || ""; thumb.style.display = v ? "block" : "none"; onChange(v || ""); };
  setVal(value);
  input.addEventListener("input", () => setVal(input.value));
  clear.addEventListener("click", () => setVal(""));
  file.addEventListener("change", async () => {
    if (!file.files[0]) return;
    const fd = new FormData(); fd.append("image", file.files[0]);
    toast("Caricamento immagine…");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) { setVal(data.url); toast("Immagine caricata ✓"); }
      else toast(data.error || "Errore upload", true);
    } catch (e) { toast("Errore di rete nell'upload", true); }
  });
  if (note) wrap.appendChild(el(`<span class="dim-note">${note}</span>`));
  return wrap;
}

function switchField(label, value, onChange) {
  const wrap = el(`<label class="switch"><input type="checkbox"><span class="track"></span><span>${label}</span></label>`);
  const input = wrap.querySelector("input");
  input.checked = !!value;
  input.addEventListener("change", () => onChange(input.checked));
  return wrap;
}

function card(title, actions = "") {
  return el(`<div class="card"><div class="card-head"><h3>${title}</h3><div>${actions}</div></div></div>`);
}

/* =========================================================================
   PANELS
   ========================================================================= */
const panels = {};

/* --- Tema --- */
panels.tema = () => {
  const c = CFG.theme.colors, f = CFG.theme.fonts;
  const p = el(`<div class="panel" data-panel="tema"><h2>Tema</h2>
    <p class="hint">Colori e tipografia di tutto il sito. Le anteprime cromatiche dei lavori restano personalizzabili per ogni progetto.</p></div>`);

  const cc = card("Colori principali");
  const g = el(`<div class="grid3"></div>`);
  const colorMap = [
    ["bg", "Sfondo"], ["paper", "Carta / superfici"], ["ink", "Testo scuro"],
    ["ink2", "Testo scuro 2"], ["muted", "Testo tenue"], ["mutedDark", "Tenue su scuro"],
    ["rust", "Accento principale (rosso)"], ["rustDark", "Accento scuro"],
    ["basil", "Verde basilico (secondario)"], ["olive", "Oliva (hover verde)"],
    ["sand", "Sabbia"], ["sage", "Salvia"],
    ["tricolorGreen", "Tricolore — Verde"], ["tricolorWhite", "Tricolore — Bianco"], ["tricolorRed", "Tricolore — Rosso"],
    ["heroFrom", "Hero gradiente 1"], ["heroMid", "Hero gradiente 2"], ["heroTo", "Hero gradiente 3"]
  ];
  colorMap.forEach(([key, label]) => g.appendChild(colorField(label, () => c[key], (v) => c[key] = v)));
  cc.appendChild(g);
  p.appendChild(cc);

  const fc = card("Tipografia &amp; dimensioni");
  fc.appendChild(textField("Font family (CSS)", f.family, (v) => f.family = v, "text", "Es: Inter, system-ui, sans-serif"));
  fc.appendChild(textField("URL Google Font (opzionale)", f.googleFontUrl, (v) => f.googleFontUrl = v, "url", "Incolla il link <link> di Google Fonts per usare un font diverso."));
  fc.appendChild(textField("Font per i titoli (heading)", f.headingFamily, (v) => f.headingFamily = v, "text", "Es: 'Fraunces', serif (per titoli decorativi)"));
  const fg = el(`<div class="grid3"></div>`);
  fg.appendChild(textField("Dimensione base", f.baseSize, (v) => f.baseSize = v, "text", "Es: 16px"));
  fg.appendChild(textField("Dimensione titoli H1", f.h1Size, (v) => f.h1Size = v));
  fg.appendChild(textField("Dimensione titoli H2", f.h2Size, (v) => f.h2Size = v));
  fc.appendChild(fg);
  fc.appendChild(textField("Raggio bordi (radius)", f.radius, (v) => f.radius = v, "text", "Es: 26px"));
  p.appendChild(fc);
  return p;
};

/* --- Brand & Logo --- */
panels.brand = () => {
  const b = CFG.brand;
  const p = el(`<div class="panel" data-panel="brand"><h2>Brand &amp; Logo</h2>
    <p class="hint">Nome, logo e contatti del brand.</p></div>`);
  const c = card("Identità");
  c.appendChild(textField("Nome brand", b.name, (v) => b.name = v));
  c.appendChild(textField("Tagline / payoff", b.tagline, (v) => b.tagline = v));
  c.appendChild(textField("Lettera logo (se non usi immagine)", b.logoText, (v) => b.logoText = v, "text", "Mostrata nel quadratino del logo. Es: M"));
  c.appendChild(imageField("Logo immagine (opzionale)", b.logoImage, (v) => b.logoImage = v, "Icona/monogramma del logo (la M con la faccina). Consigliato SVG o PNG quadrato ~256×256px."));
  c.appendChild(imageField("Wordmark / scritta a mano (opzionale)", b.logoWordmark || "", (v) => b.logoWordmark = v, "SVG della scritta 'Meikasait' scritta a mano. Se caricato, sostituisce il testo accanto al logo. Consigliato SVG orizzontale (colore nero: si inverte automaticamente su sfondo scuro)."));

  const bgCard = card("Sfondo del logo (badge)");
  bgCard.appendChild(el(`<p class="hint">Utile se il tuo logo ha parti bianche/trasparenti che scompaiono quando la navbar diventa chiara allo scroll.</p>`));
  bgCard.appendChild(selectField("Forma dello sfondo", b.logoBgShape || "none", [
    { value: "none",    label: "Nessuno (trasparente)" },
    { value: "circle",  label: "Cerchio" },
    { value: "square",  label: "Quadrato" },
    { value: "rounded", label: "Quadrato arrotondato" },
    { value: "custom",  label: "Personalizzato (raggio a scelta)" }
  ], (v) => b.logoBgShape = v, "Scegli la forma del riquadro dietro al logo."));
  const visGrid = el(`<div class="grid2"></div>`);
  visGrid.appendChild(checkboxField("Mostra il badge su sezioni chiare", b.logoBgOnLight !== false, (v) => b.logoBgOnLight = v, "Quando la navbar è sopra sezioni chiare (Servizi, Lavori, Marketing)."));
  visGrid.appendChild(checkboxField("Mostra il badge su sezioni scure", b.logoBgOnDark !== false, (v) => b.logoBgOnDark = v, "Quando la navbar è sopra l'hero o altre sezioni scure."));
  bgCard.appendChild(visGrid);
  const colGrid = el(`<div class="grid2"></div>`);
  colGrid.appendChild(colorField("Colore badge su sezioni chiare", () => b.logoBgColor || "#ffffff", (v) => b.logoBgColor = v));
  colGrid.appendChild(colorField("Colore badge su sezioni scure", () => b.logoBgColorDark || b.logoBgColor || "#ffffff", (v) => b.logoBgColorDark = v));
  bgCard.appendChild(colGrid);
  bgCard.appendChild(checkboxField("Aggiungi un bordo sottile al badge", b.logoBgBorder, (v) => b.logoBgBorder = v, "Filo di contorno per staccare meglio il badge dallo sfondo, senza appesantirlo."));
  bgCard.appendChild(el(`<p class="hint">💡 <strong>Suggerimenti palette Meikasait</strong>: <br>
    • Cream: <code>#f6f1e6</code> · Basilico: <code>#3e6b3a</code> · Verde tricolore: <code>#009246</code><br>
    • Ink (scuro): <code>#13201c</code> · Rosso pomodoro: <code>#c0392b</code> · Sabbia: <code>#ead3ad</code></p>`));
  const bgGrid = el(`<div class="grid2"></div>`);
  bgGrid.appendChild(textField("Padding interno (px)", b.logoBgPadding ?? 6, (v) => b.logoBgPadding = +v || 0, "number", "Spazio bianco intorno al logo. Consigliato 4–10."));
  bgGrid.appendChild(textField("Raggio angoli (px)", b.logoBgRadius ?? 14, (v) => b.logoBgRadius = +v || 0, "number", "Solo per forme 'Arrotondato' e 'Personalizzato'."));
  bgCard.appendChild(bgGrid);
  p.appendChild(c);
  p.appendChild(bgCard);

  const cc = card("Contatti");
  cc.appendChild(textField("Email", b.email, (v) => b.email = v, "email"));
  cc.appendChild(textField("Telefono", b.phone, (v) => b.phone = v));
  const g = el(`<div class="grid2"></div>`);
  g.appendChild(textField("Instagram (testo)", b.instagram, (v) => b.instagram = v));
  g.appendChild(textField("Instagram (URL)", b.instagramUrl, (v) => b.instagramUrl = v, "url"));
  cc.appendChild(g);
  cc.appendChild(areaField("Nota Instagram (mostrata sotto i contatti)", b.instagramNote || "", (v) => b.instagramNote = v));
  p.appendChild(cc);
  return p;
};

/* --- Nav --- */
panels.nav = () => {
  const n = CFG.nav;
  const p = el(`<div class="panel" data-panel="nav"><h2>Menu di navigazione</h2>
    <p class="hint">Voci del menu in alto. Usa # per ancore interne (es. #lavori) o un URL completo.</p></div>`);
  const c = card("Voci menu", `<button class="btn small primary" id="addNav">+ Aggiungi voce</button>`);
  const list = el(`<div id="navList"></div>`);
  function renderList() {
    list.innerHTML = "";
    n.links.forEach((link, i) => {
      const item = el(`<div class="repeat-item"><div class="repeat-head"><strong>Voce ${i + 1}</strong>
        <div class="repeat-actions">
          <button class="btn small" data-up>↑</button>
          <button class="btn small" data-down>↓</button>
          <button class="btn small danger" data-del>✕</button>
        </div></div><div class="grid2"></div></div>`);
      const g = item.querySelector(".grid2");
      g.appendChild(textField("Etichetta", link.label, (v) => link.label = v));
      g.appendChild(textField("Link", link.href, (v) => link.href = v));
      item.querySelector("[data-del]").onclick = () => { n.links.splice(i, 1); renderList(); };
      item.querySelector("[data-up]").onclick = () => { if (i > 0) { [n.links[i - 1], n.links[i]] = [n.links[i], n.links[i - 1]]; renderList(); } };
      item.querySelector("[data-down]").onclick = () => { if (i < n.links.length - 1) { [n.links[i + 1], n.links[i]] = [n.links[i], n.links[i + 1]]; renderList(); } };
      list.appendChild(item);
    });
  }
  renderList();
  c.appendChild(list);
  p.appendChild(c);
  const cta = card("Pulsante CTA (a destra)");
  cta.appendChild(textField("Etichetta CTA", n.ctaLabel, (v) => n.ctaLabel = v));
  cta.appendChild(textField("Link CTA", n.ctaHref, (v) => n.ctaHref = v));
  p.appendChild(cta);
  setTimeout(() => { $("#addNav").onclick = () => { n.links.push({ label: "Nuova voce", href: "#" }); renderList(); }; }, 0);
  return p;
};

/* --- Banner --- */
panels.banner = () => {
  const b = CFG.banner;
  const p = el(`<div class="panel" data-panel="banner"><h2>Banner promozionale</h2>
    <p class="hint">Striscia in cima al sito. Attivala o disattivala con l'interruttore.</p></div>`);
  const c = card("Configurazione banner");
  c.appendChild(switchField("Banner attivo", b.enabled, (v) => b.enabled = v));
  c.appendChild(el(`<div style="height:1rem"></div>`));
  c.appendChild(textField("Testo banner", b.text, (v) => b.text = v));
  const g = el(`<div class="grid2"></div>`);
  g.appendChild(textField("Etichetta link (opzionale)", b.linkLabel, (v) => b.linkLabel = v));
  g.appendChild(textField("URL link", b.linkHref, (v) => b.linkHref = v));
  c.appendChild(g);
  const g2 = el(`<div class="grid2"></div>`);
  g2.appendChild(colorField("Colore sfondo", () => b.background, (v) => b.background = v));
  g2.appendChild(colorField("Colore testo", () => b.color, (v) => b.color = v));
  c.appendChild(g2);
  p.appendChild(c);
  return p;
};

/* --- Layout / ordine sezioni + sfondo pagina globale --- */
panels.layout = () => {
  const p = el(`<div class="panel" data-panel="layout"><h2>Composizione homepage</h2>
    <p class="hint">Ordina e attiva/disattiva ogni sezione. Configura anche lo sfondo globale della pagina.</p></div>`);
  const labels = { hero: "🚀 Hero (intro)", services: "⚙️ Servizi", works: "🖼️ Vetrina lavori", marketing: "📣 Marketing/Social", packages: "📦 Pacchetti & contatto" };
  const enabledMap = {
    hero: () => (CFG.hero = CFG.hero || {}),
    services: () => (CFG.services = CFG.services || {}),
    works: () => (CFG.works = CFG.works || {}),
    marketing: () => (CFG.marketing = CFG.marketing || {}),
    packages: () => (CFG.packages = CFG.packages || {})
  };
  ["hero", "services", "works", "marketing", "packages"].forEach(k => { if (!CFG.sectionsOrder.includes(k)) CFG.sectionsOrder.push(k); });
  const c = card("Ordine e visibilità delle sezioni");
  const list = el(`<div class="order-list" id="orderList"></div>`);
  function renderOrder() {
    list.innerHTML = "";
    CFG.sectionsOrder.forEach((key, i) => {
      const sec = enabledMap[key] ? enabledMap[key]() : null;
      const item = el(`<div class="order-item">
        <label class="switch"><input type="checkbox"><span class="track"></span><span>${labels[key] || key}</span></label>
        <div class="order-btns">
          <button class="btn small" data-up>↑</button>
          <button class="btn small" data-down>↓</button>
        </div></div>`);
      const chk = item.querySelector("input");
      chk.checked = sec ? sec.enabled !== false : true;
      chk.onchange = () => { if (sec) sec.enabled = chk.checked; };
      item.querySelector("[data-up]").onclick = () => { if (i > 0) { [CFG.sectionsOrder[i - 1], CFG.sectionsOrder[i]] = [CFG.sectionsOrder[i], CFG.sectionsOrder[i - 1]]; renderOrder(); } };
      item.querySelector("[data-down]").onclick = () => { if (i < CFG.sectionsOrder.length - 1) { [CFG.sectionsOrder[i + 1], CFG.sectionsOrder[i]] = [CFG.sectionsOrder[i], CFG.sectionsOrder[i + 1]]; renderOrder(); } };
      list.appendChild(item);
    });
  }
  renderOrder();
  c.appendChild(list);
  p.appendChild(c);

  // Toggle rapide per elementi fissi
  const tc = card("Elementi fissi (attiva/disattiva)");
  CFG.contact = CFG.contact || {}; CFG.footer = CFG.footer || {}; CFG.banner = CFG.banner || {};
  tc.appendChild(switchField("📢 Banner promozionale in cima", CFG.banner.enabled !== false, (v) => CFG.banner.enabled = v));
  tc.appendChild(el(`<div style="height:.5rem"></div>`));
  tc.appendChild(switchField("✉️ Riquadro Contatti (dentro Pacchetti)", CFG.contact.enabled !== false, (v) => CFG.contact.enabled = v));
  tc.appendChild(el(`<div style="height:.5rem"></div>`));
  tc.appendChild(switchField("🦶 Footer (in fondo alla pagina)", CFG.footer.enabled !== false, (v) => CFG.footer.enabled = v));
  p.appendChild(tc);

  // Sfondo globale della pagina
  CFG.pageBackground = CFG.pageBackground || { enabled: false, image: "", color: "", opacity: 1, position: "center center", size: "cover", blur: 0, overlayColor: "#000000", overlayOpacity: 0 };
  const pb = CFG.pageBackground;
  const bgc = card("🌄 Sfondo di tutta la pagina");
  bgc.appendChild(el(`<p class="hint">Sfondo applicato dietro a tutte le sezioni (fisso in scroll). Se attivo, sostituisce il colore di base del sito.</p>`));
  bgc.appendChild(switchField("Sfondo pagina attivo", pb.enabled === true, (v) => pb.enabled = v));
  bgc.appendChild(el(`<div style="height:.8rem"></div>`));
  const bgg0 = el(`<div class="grid2"></div>`);
  bgg0.appendChild(colorField("Colore di sfondo (opzionale)", () => pb.color, (v) => pb.color = v));
  bgg0.appendChild(imageField("Immagine di sfondo (opzionale)", pb.image, (v) => pb.image = v, "Puoi combinare colore + immagine, oppure usarne uno solo."));
  bgc.appendChild(bgg0);
  const bgg1 = el(`<div class="grid2"></div>`);
  bgg1.appendChild(textField("Posizione", pb.position, (v) => pb.position = v, "text", "Es: center center / top / 50% 30%"));
  bgg1.appendChild(textField("Dimensione", pb.size, (v) => pb.size = v, "text", "cover / contain / auto"));
  bgc.appendChild(bgg1);
  const bgg2 = el(`<div class="grid2"></div>`);
  bgg2.appendChild(textField("Opacità immagine (0–1)", pb.opacity, (v) => pb.opacity = v === "" ? 1 : Math.max(0, Math.min(1, parseFloat(v) || 0)), "number"));
  bgg2.appendChild(textField("Sfocatura blur (px)", pb.blur, (v) => pb.blur = Math.max(0, parseInt(v) || 0), "number"));
  bgc.appendChild(bgg2);
  const bgg3 = el(`<div class="grid2"></div>`);
  bgg3.appendChild(colorField("Colore overlay", () => pb.overlayColor, (v) => pb.overlayColor = v));
  bgg3.appendChild(textField("Opacità overlay (0–1)", pb.overlayOpacity, (v) => pb.overlayOpacity = v === "" ? 0 : Math.max(0, Math.min(1, parseFloat(v) || 0)), "number"));
  bgc.appendChild(bgg3);
  p.appendChild(bgc);

  return p;
};

/* --- Hero --- */
panels.hero = () => {
  const h = CFG.hero;
  const p = el(`<div class="panel" data-panel="hero"><h2>Sezione Hero</h2>
    <p class="hint">L'intro principale con titolo, testo, pulsanti, riquadri e metodo di lavoro.</p></div>`);
  const c = card("Testi");
  c.appendChild(switchField("Sezione attiva", h.enabled !== false, (v) => h.enabled = v));
  c.appendChild(el(`<div style="height:1rem"></div>`));
  c.appendChild(textField("Sopra-titolo (eyebrow)", h.eyebrow, (v) => h.eyebrow = v));
  c.appendChild(textField("Titolo", h.title, (v) => h.title = v));
  c.appendChild(areaField("Testo", h.text, (v) => h.text = v));
  const g = el(`<div class="grid2"></div>`);
  g.appendChild(textField("Pulsante 1 — etichetta", h.primaryCtaLabel, (v) => h.primaryCtaLabel = v));
  g.appendChild(textField("Pulsante 1 — link", h.primaryCtaHref, (v) => h.primaryCtaHref = v));
  g.appendChild(textField("Pulsante 2 — etichetta", h.secondaryCtaLabel, (v) => h.secondaryCtaLabel = v));
  g.appendChild(textField("Pulsante 2 — link", h.secondaryCtaHref, (v) => h.secondaryCtaHref = v));
  c.appendChild(g);
  c.appendChild(textField("Titolo riquadro 'In breve'", h.summaryTitle, (v) => h.summaryTitle = v));
  p.appendChild(c);

  // Summary cards
  const sc = card("Riquadri servizi", `<button class="btn small primary" id="addSummary">+ Aggiungi</button>`);
  const sl = el(`<div id="summaryList"></div>`);
  function renderSummary() {
    sl.innerHTML = "";
    h.summaryCards.forEach((s, i) => {
      const item = el(`<div class="repeat-item"><div class="repeat-head"><strong>Riquadro ${i + 1}</strong>
        <div class="repeat-actions"><button class="btn small danger" data-del>✕</button></div></div></div>`);
      item.appendChild(textField("Icona (emoji)", s.icon, (v) => s.icon = v));
      item.appendChild(textField("Titolo", s.title, (v) => s.title = v));
      item.appendChild(textField("Testo", s.text, (v) => s.text = v));
      item.querySelector("[data-del]").onclick = () => { h.summaryCards.splice(i, 1); renderSummary(); };
      sl.appendChild(item);
    });
  }
  renderSummary();
  sc.appendChild(sl);
  p.appendChild(sc);

  // Steps
  const stc = card("Metodo di lavoro (step)", `<button class="btn small primary" id="addStep">+ Aggiungi</button>`);
  const stl = el(`<div id="stepList"></div>`);
  function renderSteps() {
    stl.innerHTML = "";
    h.steps.forEach((s, i) => {
      const item = el(`<div class="repeat-item"><div class="repeat-head"><strong>Step ${i + 1}</strong>
        <div class="repeat-actions"><button class="btn small danger" data-del>✕</button></div></div><div class="grid3"></div></div>`);
      const g3 = item.querySelector(".grid3");
      g3.appendChild(textField("Numero", s.number, (v) => s.number = v));
      g3.appendChild(textField("Titolo", s.title, (v) => s.title = v));
      g3.appendChild(textField("Testo", s.text, (v) => s.text = v));
      item.querySelector("[data-del]").onclick = () => { h.steps.splice(i, 1); renderSteps(); };
      stl.appendChild(item);
    });
  }
  renderSteps();
  stc.appendChild(stl);
  p.appendChild(stc);

  // --- Card Sfondo immagine ---
  if (!h.background) h.background = { image: "", opacity: 1, position: "center center", size: "cover", blur: 0, overlayColor: "#10231b", overlayOpacity: 0 };
  const b = h.background;
  const bgc = card("Sfondo immagine (opzionale)");
  bgc.appendChild(el(`<p class="hint">Carica un'immagine di sfondo per l'hero. L'overlay scuro semi-trasparente sopra l'immagine migliora la leggibilità dei testi bianchi.</p>`));
  bgc.appendChild(imageField("Immagine di sfondo", b.image, (v) => b.image = v, "Consigliato JPG 1920×1080 o superiore. Lascia vuoto per usare lo sfondo verde gradiente predefinito."));
  const bgg1 = el(`<div class="grid2"></div>`);
  bgg1.appendChild(textField("Posizione (CSS background-position)", b.position, (v) => b.position = v, "text", "Es: center center / top / bottom / 50% 30%"));
  bgg1.appendChild(textField("Dimensione (CSS background-size)", b.size, (v) => b.size = v, "text", "cover (riempie tutto) / contain (intera) / auto"));
  bgc.appendChild(bgg1);
  const bgg2 = el(`<div class="grid2"></div>`);
  bgg2.appendChild(textField("Opacità immagine (0–1)", b.opacity, (v) => b.opacity = v === "" ? 1 : Math.max(0, Math.min(1, parseFloat(v) || 0)), "number", "1 = piena, 0.5 = metà, 0 = invisibile."));
  bgg2.appendChild(textField("Sfocatura blur (px)", b.blur, (v) => b.blur = Math.max(0, parseInt(v) || 0), "number", "0 = nessuna. Prova 4–10 per effetto soft."));
  bgc.appendChild(bgg2);
  const bgg3 = el(`<div class="grid2"></div>`);
  bgg3.appendChild(colorField("Colore overlay (sopra immagine)", () => b.overlayColor, (v) => b.overlayColor = v));
  bgg3.appendChild(textField("Opacità overlay (0–1)", b.overlayOpacity, (v) => b.overlayOpacity = v === "" ? 0 : Math.max(0, Math.min(1, parseFloat(v) || 0)), "number", "Es: 0.55 per scurire l'immagine e far risaltare i testi."));
  bgc.appendChild(bgg3);
  p.appendChild(bgc);

  // --- Card Sfondo del riquadro "In breve" ---
  if (!h.summaryBackground) h.summaryBackground = { enabled: false, color: "", image: "", opacity: 1, position: "center center", size: "cover", overlayColor: "#000000", overlayOpacity: 0 };
  const sb = h.summaryBackground;
  const sbc = card('🎯 Sfondo del riquadro "In breve"');
  sbc.appendChild(el(`<p class="hint">Personalizza il riquadro in alto a destra (In breve + Metodo). Sostituisce lo sfondo trasparente vetro.</p>`));
  sbc.appendChild(switchField("Sfondo riquadro attivo", sb.enabled === true, (v) => sb.enabled = v));
  sbc.appendChild(el(`<div style="height:.8rem"></div>`));
  const sbg0 = el(`<div class="grid2"></div>`);
  sbg0.appendChild(colorField("Colore di sfondo", () => sb.color, (v) => sb.color = v));
  sbg0.appendChild(imageField("Immagine (opzionale)", sb.image, (v) => sb.image = v));
  sbc.appendChild(sbg0);
  const sbg1 = el(`<div class="grid2"></div>`);
  sbg1.appendChild(textField("Posizione", sb.position, (v) => sb.position = v, "text"));
  sbg1.appendChild(textField("Dimensione", sb.size, (v) => sb.size = v, "text", "cover / contain / auto"));
  sbc.appendChild(sbg1);
  const sbg2 = el(`<div class="grid2"></div>`);
  sbg2.appendChild(colorField("Colore overlay", () => sb.overlayColor, (v) => sb.overlayColor = v));
  sbg2.appendChild(textField("Opacità overlay (0–1)", sb.overlayOpacity, (v) => sb.overlayOpacity = v === "" ? 0 : Math.max(0, Math.min(1, parseFloat(v) || 0)), "number"));
  sbc.appendChild(sbg2);
  p.appendChild(sbc);

  setTimeout(() => {
    $("#addSummary").onclick = () => { h.summaryCards.push({ icon: "✨", title: "Nuovo", text: "" }); renderSummary(); };
    $("#addStep").onclick = () => { h.steps.push({ number: String(h.steps.length + 1).padStart(2, "0"), title: "Nuovo", text: "" }); renderSteps(); };
  }, 0);
  return p;
};

/* --- Works --- */
panels.works = () => {
  const w = CFG.works;
  const p = el(`<div class="panel" data-panel="works"><h2>Vetrina lavori (carosello)</h2>
    <p class="hint">Carosello orizzontale dei progetti. Per ogni lavoro puoi usare l'anteprima grafica generata (colori + iniziali + icona) oppure caricare una foto/screenshot reale.</p></div>`);
  const c = card("Intestazione");
  c.appendChild(switchField("Sezione attiva", w.enabled !== false, (v) => w.enabled = v));
  c.appendChild(el(`<div style="height:.5rem"></div>`));
  c.appendChild(switchField("Scorrimento automatico", w.autoscroll !== false, (v) => w.autoscroll = v));
  c.appendChild(el(`<div style="height:1rem"></div>`));
  c.appendChild(textField("Sopra-titolo", w.eyebrow, (v) => w.eyebrow = v));
  c.appendChild(textField("Titolo", w.title, (v) => w.title = v));
  c.appendChild(areaField("Testo", w.text, (v) => w.text = v));
  p.appendChild(c);

  const lc = card("Progetti", `<button class="btn small primary" id="addWork">+ Aggiungi lavoro</button>`);
  const list = el(`<div id="workList"></div>`);
  function renderWorks() {
    list.innerHTML = "";
    w.items.forEach((s, i) => {
      // assicura presenza struttura details
      if (!s.details) s.details = { overview: "", challenge: "", approach: "", highlights: [], deliverables: [], duration: "", stack: [], gallery: [] };
      const d = s.details;
      if (!Array.isArray(d.highlights)) d.highlights = [];
      if (!Array.isArray(d.deliverables)) d.deliverables = [];
      if (!Array.isArray(d.stack)) d.stack = [];
      if (!Array.isArray(d.gallery)) d.gallery = [];
      if (!s.slug) s.slug = (s.name || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

      const item = el(`<div class="repeat-item"><div class="repeat-head"><strong>${s.name || "Lavoro"} <span class="dim-note">/lavoro/${s.slug || "..."}</span></strong>
        <div class="repeat-actions">
          <a class="btn small" target="_blank" rel="noreferrer" href="/lavoro/${s.slug || ""}">↗ Anteprima</a>
          <button class="btn small" data-up>↑</button><button class="btn small" data-down>↓</button>
          <button class="btn small danger" data-del>✕</button>
        </div></div></div>`);
      const g = el(`<div class="grid2"></div>`);
      g.appendChild(textField("Nome", s.name, (v) => s.name = v));
      g.appendChild(textField("Slug (URL: /lavoro/...)", s.slug, (v) => s.slug = v.toLowerCase().replace(/[^a-z0-9\-]+/g, "-").replace(/^-+|-+$/g, ""), "text", "Solo lettere minuscole, numeri e trattini. Es: studio-rossi"));
      g.appendChild(textField("Tipo", s.type, (v) => s.type = v));
      g.appendChild(textField("Settore", s.sector, (v) => s.sector = v));
      g.appendChild(textField("URL progetto (link esterno opzionale)", s.url, (v) => s.url = v));
      g.appendChild(textField("Iniziali (anteprima)", s.initials, (v) => s.initials = v));
      item.appendChild(g);

      item.appendChild(areaField("Descrizione breve (mostrata nella vetrina)", s.description, (v) => s.description = v));

      const g2 = el(`<div class="grid3"></div>`);
      g2.appendChild(textField("Icona (emoji)", s.icon, (v) => s.icon = v));
      g2.appendChild(colorField("Colore anteprima", () => s.color, (v) => s.color = v));
      g2.appendChild(colorField("Accento anteprima", () => s.accent, (v) => s.accent = v));
      item.appendChild(g2);

      item.appendChild(imageField("Foto/screenshot reale (sostituisce l'anteprima)", s.image, (v) => s.image = v, "Consigliato 4:3, es. 800×600px."));

      /* === Sezione scheda dettaglio (panoramica generica, no dati sensibili) === */
      const detailsBlock = el(`<details class="repeat-item" style="background:#fafaf7"><summary style="cursor:pointer;font-weight:800;padding:.5rem 0">📄 Scheda dettaglio (pagina /lavoro/${s.slug})</summary></details>`);
      detailsBlock.appendChild(el(`<p class="dim-note" style="margin:.3rem 0 1rem">Compila la scheda mostrata quando il visitatore clicca sul lavoro. Tieni i contenuti generici, senza svelare funzioni specifiche o dati sensibili del cliente.</p>`));
      detailsBlock.appendChild(areaField("Panoramica (overview)", d.overview, (v) => d.overview = v));
      detailsBlock.appendChild(areaField("La sfida (challenge)", d.challenge, (v) => d.challenge = v));
      detailsBlock.appendChild(areaField("Il nostro approccio (approach)", d.approach, (v) => d.approach = v));
      detailsBlock.appendChild(areaField("Punti chiave (uno per riga)", d.highlights.join("\n"), (v) => d.highlights = v.split("\n").map(x => x.trim()).filter(Boolean)));
      const dg = el(`<div class="grid2"></div>`);
      dg.appendChild(areaField("Cosa abbiamo consegnato (uno per riga)", d.deliverables.join("\n"), (v) => d.deliverables = v.split("\n").map(x => x.trim()).filter(Boolean)));
      dg.appendChild(areaField("Tecnologie/Stack (uno per riga)", d.stack.join("\n"), (v) => d.stack = v.split("\n").map(x => x.trim()).filter(Boolean)));
      detailsBlock.appendChild(dg);
      detailsBlock.appendChild(textField("Durata (es. ≈ 3 settimane)", d.duration, (v) => d.duration = v));

      /* Gallery: lista immagini caricate */
      const galWrap = el(`<div class="field"><label>Galleria anteprima (immagini)</label><div class="dim-note">Aggiungi screenshot generici, mockup, mood. Verranno mostrati in fondo alla scheda.</div></div>`);
      const galList = el(`<div id="galList"></div>`);
      function renderGal() {
        galList.innerHTML = "";
        d.gallery.forEach((url, gi) => {
          const row = el(`<div class="repeat-item" style="display:flex;align-items:center;gap:.6rem"><img src="${url}" style="width:80px;height:60px;object-fit:cover;border-radius:8px;border:1px solid var(--line)" alt=""><input type="text" value="${url}" style="flex:1"><button type="button" class="btn small danger">✕</button></div>`);
          row.querySelector("input").oninput = (e) => { d.gallery[gi] = e.target.value; };
          row.querySelector("button").onclick = () => { d.gallery.splice(gi, 1); renderGal(); };
          galList.appendChild(row);
        });
      }
      renderGal();
      galWrap.appendChild(galList);
      const galAdd = el(`<div class="img-row" style="margin-top:.6rem"><label class="btn small ghost">⬆ Carica immagine<input type="file" accept="image/*" hidden></label></div>`);
      galAdd.querySelector("input").addEventListener("change", async (ev) => {
        const file = ev.target.files[0];
        if (!file) return;
        const fd = new FormData(); fd.append("image", file);
        toast("Caricamento immagine…");
        try {
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          const data = await res.json();
          if (data.url) { d.gallery.push(data.url); renderGal(); toast("Immagine aggiunta ✓"); }
          else toast(data.error || "Errore upload", true);
        } catch (e) { toast("Errore di rete nell'upload", true); }
      });
      galWrap.appendChild(galAdd);
      detailsBlock.appendChild(galWrap);

      item.appendChild(detailsBlock);

      item.querySelector("[data-del]").onclick = () => { w.items.splice(i, 1); renderWorks(); };
      item.querySelector("[data-up]").onclick = () => { if (i > 0) { [w.items[i - 1], w.items[i]] = [w.items[i], w.items[i - 1]]; renderWorks(); } };
      item.querySelector("[data-down]").onclick = () => { if (i < w.items.length - 1) { [w.items[i + 1], w.items[i]] = [w.items[i], w.items[i + 1]]; renderWorks(); } };
      list.appendChild(item);
    });
  }
  renderWorks();
  lc.appendChild(list);
  p.appendChild(lc);
  setTimeout(() => { $("#addWork").onclick = () => { w.items.push({ slug: "nuovo-lavoro", name: "Nuovo lavoro", type: "Sito vetrina", sector: "Settore", url: "#", initials: "NL", color: "#273f3a", accent: "#c0392b", icon: "💻", image: "", description: "", details: { overview: "", challenge: "", approach: "", highlights: [], deliverables: [], duration: "", stack: [], gallery: [] } }); renderWorks(); }; }, 0);
  return p;
};

/* --- Packages --- */
panels.packages = () => {
  const pk = CFG.packages;
  const p = el(`<div class="panel" data-panel="packages"><h2>Pacchetti</h2>
    <p class="hint">Pacchetti/servizi con immagine, prezzo e caratteristiche.</p></div>`);
  const c = card("Intestazione");
  c.appendChild(switchField("Sezione attiva", pk.enabled !== false, (v) => pk.enabled = v));
  c.appendChild(el(`<div style="height:1rem"></div>`));
  c.appendChild(textField("Sopra-titolo", pk.eyebrow, (v) => pk.eyebrow = v));
  c.appendChild(textField("Titolo", pk.title, (v) => pk.title = v));
  c.appendChild(areaField("Testo", pk.text, (v) => pk.text = v));
  p.appendChild(c);

  const lc = card("Lista pacchetti", `<button class="btn small primary" id="addPkg">+ Aggiungi pacchetto</button>`);
  const list = el(`<div id="pkgList"></div>`);
  function renderPkgs() {
    list.innerHTML = "";
    pk.items.forEach((s, i) => {
      const item = el(`<div class="repeat-item"><div class="repeat-head"><strong>${s.name || "Pacchetto"}</strong>
        <div class="repeat-actions">
          <button class="btn small" data-up>↑</button><button class="btn small" data-down>↓</button>
          <button class="btn small danger" data-del>✕</button>
        </div></div></div>`);
      const g = el(`<div class="grid3"></div>`);
      g.appendChild(textField("Nome", s.name, (v) => s.name = v));
      g.appendChild(textField("Icona (emoji)", s.icon, (v) => s.icon = v));
      g.appendChild(textField("Badge", s.badge, (v) => s.badge = v));
      item.appendChild(g);
      item.appendChild(textField("Prezzo", s.price, (v) => s.price = v));
      item.appendChild(areaField("Descrizione", s.description, (v) => s.description = v));
      item.appendChild(imageField("Immagine pacchetto", s.image, (v) => s.image = v, "Consigliato 16:9 o quadrata, min 600px lato. Mostrata in alto nella card."));
      item.appendChild(areaField("Caratteristiche (una per riga)", (s.features || []).join("\n"), (v) => s.features = v.split("\n").map(x => x.trim()).filter(Boolean)));
      item.querySelector("[data-del]").onclick = () => { pk.items.splice(i, 1); renderPkgs(); };
      item.querySelector("[data-up]").onclick = () => { if (i > 0) { [pk.items[i - 1], pk.items[i]] = [pk.items[i], pk.items[i - 1]]; renderPkgs(); } };
      item.querySelector("[data-down]").onclick = () => { if (i < pk.items.length - 1) { [pk.items[i + 1], pk.items[i]] = [pk.items[i], pk.items[i + 1]]; renderPkgs(); } };
      list.appendChild(item);
    });
  }
  renderPkgs();
  lc.appendChild(list);
  p.appendChild(lc);
  setTimeout(() => { $("#addPkg").onclick = () => { pk.items.push({ name: "Nuovo pacchetto", icon: "✨", badge: "Nuovo", price: "da €0", image: "", description: "", features: ["Caratteristica 1"] }); renderPkgs(); }; }, 0);
  return p;
};

/* --- Contact --- */
panels.contact = () => {
  const ct = CFG.contact;
  const p = el(`<div class="panel" data-panel="contact"><h2>Contatti</h2>
    <p class="hint">Testi del riquadro contatti. I recapiti si modificano nella scheda Brand.</p></div>`);
  const c = card("Testi contatti");
  c.appendChild(textField("Sopra-titolo", ct.eyebrow, (v) => ct.eyebrow = v));
  c.appendChild(textField("Titolo", ct.title, (v) => ct.title = v));
  c.appendChild(areaField("Testo", ct.text, (v) => ct.text = v));
  p.appendChild(c);
  const f = CFG.footer || (CFG.footer = {});
  const fc = card("Footer");
  fc.appendChild(textField("Testo footer", f.text, (v) => f.text = v));
  fc.appendChild(textField("Etichetta link privacy", f.privacyLabel, (v) => f.privacyLabel = v));
  p.appendChild(fc);
  return p;
};

/* --- Services (Cosa facciamo) --- */
panels.services = () => {
  if (!CFG.services) CFG.services = { enabled: true, eyebrow: "Cosa facciamo", title: "Tre cose. Fatte bene.", text: "", items: [] };
  const s = CFG.services;
  const p = el(`<div class="panel" data-panel="services"><h2>Servizi (sezione "Cosa facciamo")</h2>
    <p class="hint">Sintesi dei servizi offerti, con icone e link. Mostrata in alto sotto l'hero.</p></div>`);
  const c = card("Intestazione");
  c.appendChild(switchField("Sezione attiva", s.enabled !== false, (v) => s.enabled = v));
  c.appendChild(el(`<div style="height:1rem"></div>`));
  c.appendChild(textField("Sopra-titolo", s.eyebrow, (v) => s.eyebrow = v));
  c.appendChild(textField("Titolo", s.title, (v) => s.title = v));
  c.appendChild(areaField("Testo", s.text, (v) => s.text = v));
  p.appendChild(c);

  const lc = card("Card servizi", `<button class="btn small primary" id="addSvc">+ Aggiungi servizio</button>`);
  const list = el(`<div id="svcList"></div>`);
  function renderList() {
    list.innerHTML = "";
    if (!Array.isArray(s.items)) s.items = [];
    s.items.forEach((it, i) => {
      const item = el(`<div class="repeat-item"><div class="repeat-head"><strong>${it.title || "Servizio"}</strong>
        <div class="repeat-actions">
          <button class="btn small" data-up>↑</button><button class="btn small" data-down>↓</button>
          <button class="btn small danger" data-del>✕</button>
        </div></div></div>`);
      item.appendChild(textField("Icona (emoji)", it.icon, (v) => it.icon = v));
      item.appendChild(textField("Titolo", it.title, (v) => it.title = v));
      item.appendChild(areaField("Testo", it.text, (v) => it.text = v));
      const g = el(`<div class="grid2"></div>`);
      g.appendChild(textField("Etichetta link (opzionale)", it.linkLabel, (v) => it.linkLabel = v));
      g.appendChild(textField("URL link", it.linkHref, (v) => it.linkHref = v));
      item.appendChild(g);
      item.querySelector("[data-del]").onclick = () => { s.items.splice(i, 1); renderList(); };
      item.querySelector("[data-up]").onclick = () => { if (i > 0) { [s.items[i - 1], s.items[i]] = [s.items[i], s.items[i - 1]]; renderList(); } };
      item.querySelector("[data-down]").onclick = () => { if (i < s.items.length - 1) { [s.items[i + 1], s.items[i]] = [s.items[i], s.items[i + 1]]; renderList(); } };
      list.appendChild(item);
    });
  }
  renderList();
  lc.appendChild(list);
  p.appendChild(lc);
  setTimeout(() => { $("#addSvc").onclick = () => { s.items.push({ icon: "✨", title: "Nuovo servizio", text: "", linkLabel: "", linkHref: "#" }); renderList(); }; }, 0);
  return p;
};

/* --- Marketing & Social --- */
panels.marketing = () => {
  if (!CFG.marketing) CFG.marketing = { enabled: true, eyebrow: "Marketing & social", title: "Post buoni, sponsor mirate.", text: "", note: "", items: [], soon: { enabled: true, title: "🛎️ Coming soon", text: "" } };
  const m = CFG.marketing;
  if (!m.soon) m.soon = { enabled: true, title: "🛎️ Coming soon", text: "" };
  const p = el(`<div class="panel" data-panel="marketing"><h2>Marketing &amp; Social (abbonamenti)</h2>
    <p class="hint">Servizio di creazione post + gestione sponsorizzate ad abbonamento mensile. La gestione completa dei profili è marcata come "in arrivo".</p></div>`);
  const c = card("Intestazione");
  c.appendChild(switchField("Sezione attiva", m.enabled !== false, (v) => m.enabled = v));
  c.appendChild(el(`<div style="height:1rem"></div>`));
  c.appendChild(textField("Sopra-titolo", m.eyebrow, (v) => m.eyebrow = v));
  c.appendChild(textField("Titolo", m.title, (v) => m.title = v));
  c.appendChild(areaField("Testo", m.text, (v) => m.text = v));
  c.appendChild(areaField("Nota in evidenza (es. \"gestione profilo in arrivo\")", m.note, (v) => m.note = v));
  p.appendChild(c);

  const lc = card("Pacchetti / abbonamenti", `<button class="btn small primary" id="addMkt">+ Aggiungi pacchetto</button>`);
  const list = el(`<div id="mktList"></div>`);
  function renderList() {
    list.innerHTML = "";
    if (!Array.isArray(m.items)) m.items = [];
    m.items.forEach((s, i) => {
      const item = el(`<div class="repeat-item"><div class="repeat-head"><strong>${s.name || "Abbonamento"}</strong>
        <div class="repeat-actions">
          <button class="btn small" data-up>↑</button><button class="btn small" data-down>↓</button>
          <button class="btn small danger" data-del>✕</button>
        </div></div></div>`);
      const g = el(`<div class="grid3"></div>`);
      g.appendChild(textField("Nome", s.name, (v) => s.name = v));
      g.appendChild(textField("Icona (emoji)", s.icon, (v) => s.icon = v));
      g.appendChild(textField("Badge", s.badge, (v) => s.badge = v));
      item.appendChild(g);
      item.appendChild(textField("Prezzo (es. €149/mese)", s.price, (v) => s.price = v));
      item.appendChild(areaField("Descrizione", s.description, (v) => s.description = v));
      item.appendChild(areaField("Caratteristiche (una per riga)", (s.features || []).join("\n"), (v) => s.features = v.split("\n").map(x => x.trim()).filter(Boolean)));
      item.querySelector("[data-del]").onclick = () => { m.items.splice(i, 1); renderList(); };
      item.querySelector("[data-up]").onclick = () => { if (i > 0) { [m.items[i - 1], m.items[i]] = [m.items[i], m.items[i - 1]]; renderList(); } };
      item.querySelector("[data-down]").onclick = () => { if (i < m.items.length - 1) { [m.items[i + 1], m.items[i]] = [m.items[i], m.items[i + 1]]; renderList(); } };
      list.appendChild(item);
    });
  }
  renderList();
  lc.appendChild(list);
  p.appendChild(lc);

  const sc = card("Banner \"Coming soon\" (gestione totale profili)");
  sc.appendChild(switchField("Mostra banner coming soon", m.soon.enabled !== false, (v) => m.soon.enabled = v));
  sc.appendChild(el(`<div style="height:.6rem"></div>`));
  sc.appendChild(textField("Titolo banner", m.soon.title, (v) => m.soon.title = v));
  sc.appendChild(areaField("Testo banner", m.soon.text, (v) => m.soon.text = v));
  p.appendChild(sc);

  setTimeout(() => { $("#addMkt").onclick = () => { m.items.push({ name: "Nuovo abbonamento", icon: "📣", badge: "Nuovo", price: "€... /mese", description: "", features: ["Caratteristica 1"] }); renderList(); }; }, 0);
  return p;
};

/* --- SEO --- */
panels.seo = () => {
  if (!CFG.seo) CFG.seo = { title: "", description: "", ogImage: "", keywords: "", favicon: "" };
  const s = CFG.seo;
  const p = el(`<div class="panel" data-panel="seo"><h2>SEO &amp; condivisione social</h2>
    <p class="hint">Title, description, immagine di anteprima usata da Google e social (WhatsApp, Facebook, Twitter, LinkedIn).</p></div>`);
  const c = card("Meta tag homepage");
  c.appendChild(textField("Titolo (max 60 caratteri)", s.title, (v) => s.title = v, "text", "Compare nelle tab del browser e nei risultati Google."));
  c.appendChild(areaField("Description (max 160 caratteri)", s.description, (v) => s.description = v));
  c.appendChild(textField("Parole chiave (separate da virgola)", s.keywords, (v) => s.keywords = v));
  c.appendChild(imageField("Immagine social (OG image)", s.ogImage, (v) => s.ogImage = v, "Consigliata 1200×630px, formato JPG/PNG."));
  p.appendChild(c);

  const ic = card("Icona scheda browser (favicon)");
  ic.appendChild(el(`<p class="hint">L'iconcina che appare nella tab del browser, tra i preferiti e sulla home screen del cellulare. Se lasci vuoto, verrà usato automaticamente il logo del brand.</p>`));
  ic.appendChild(imageField("Favicon", s.favicon || "", (v) => s.favicon = v, "Consigliato: PNG o SVG quadrato, minimo 64×64px (ideale 256×256 o SVG vettoriale). Sfondo trasparente ok."));
  p.appendChild(ic);
  const seoInfo = card("Sitemap & robots");
  seoInfo.appendChild(el(`<p class="hint">Sono generati automaticamente:</p>
    <ul style="margin:.4rem 0 0;padding-left:1.2rem;line-height:1.8">
      <li><a href="/sitemap.xml" target="_blank">/sitemap.xml</a> — include home, privacy e tutti i lavori</li>
      <li><a href="/robots.txt" target="_blank">/robots.txt</a> — blocca admin e API</li>
    </ul>`));
  p.appendChild(seoInfo);
  return p;
};

/* --- Privacy --- */
panels.privacy = () => {
  const pr = CFG.privacy || (CFG.privacy = {});
  const p = el(`<div class="panel" data-panel="privacy"><h2>Privacy &amp; Cookie</h2>
    <p class="hint">Dati usati nella pagina Privacy & Cookie Policy.</p></div>`);
  const c = card("Dati informativa");
  c.appendChild(textField("Nome azienda / titolare", pr.companyName, (v) => pr.companyName = v));
  c.appendChild(textField("Email del titolare", pr.ownerEmail, (v) => pr.ownerEmail = v, "email"));
  c.appendChild(textField("Data ultimo aggiornamento", pr.lastUpdate, (v) => pr.lastUpdate = v, "text", "Formato AAAA-MM-GG, es. 2026-06-29"));
  p.appendChild(c);
  return p;
};

/* --- Sicurezza / Passkey --- */
panels.sicurezza = () => {
  const p = el(`<div class="panel" data-panel="sicurezza"><h2>Sicurezza account</h2>
    <p class="hint">Aumenta il livello di sicurezza del tuo account admin con una passkey personale. Dopo la registrazione, al prossimo login serviranno password + impronta/Face ID/PIN.</p></div>`);

  const status = card("Il tuo account");
  status.appendChild(el(`<div id="secStatus"><p class="hint">Caricamento stato…</p></div>`));
  p.appendChild(status);

  const reg = card("Aggiungi una passkey a questo account");
  reg.appendChild(el(`<p class="hint">Registra questo dispositivo usando impronta, Face ID, Windows Hello o PIN. Puoi aggiungere più passkey, ad esempio PC e smartphone.</p>`));
  reg.appendChild(el(`<div class="grid2"><div class="field"><label>Nome passkey</label><input id="passkeyName" type="text" value="Dispositivo principale"></div><div></div></div>`));
  reg.appendChild(el(`<button class="btn primary" id="regPasskeyBtn" type="button">🔐 Registra passkey</button>`));
  reg.appendChild(el(`<div id="regResult" style="margin-top:1rem"></div>`));
  p.appendChild(reg);

  const pwd = card("Cambia la tua password");
  pwd.appendChild(el(`<div class="grid2">
    <div class="field"><label>Password attuale</label><input id="curPwd" type="password" autocomplete="current-password"></div>
    <div class="field"><label>Nuova password</label><input id="newPwd" type="password" autocomplete="new-password"></div>
  </div>`));
  pwd.appendChild(el(`<button class="btn" id="changeMyPwd" type="button">Aggiorna password</button>`));
  p.appendChild(pwd);

  setTimeout(() => initSecurity(), 0);
  return p;
};

/* --- Utenti admin --- */
panels.utenti = () => {
  const p = el(`<div class="panel" data-panel="utenti"><h2>Utenti admin</h2>
    <p class="hint">Crea account separati per ogni persona. Ruoli consigliati: <strong>Owner</strong> per il proprietario, <strong>Super Admin</strong> per chi gestisce utenti e sicurezza, <strong>Admin</strong> per gestione contenuti completa, <strong>Editor</strong> per modifiche contenuti.</p></div>`);

  const create = card("Crea nuovo utente");
  create.appendChild(el(`<div class="grid2">
    <div class="field"><label>Username</label><input id="newUserName" type="text" placeholder="es. carmine"></div>
    <div class="field"><label>Email</label><input id="newUserEmail" type="email" placeholder="nome@email.it"></div>
    <div class="field"><label>Password temporanea</label><input id="newUserPass" type="password" placeholder="minimo 8 caratteri"></div>
    <div class="field"><label>Ruolo</label><select id="newUserRole"><option value="editor">Editor</option><option value="admin">Admin</option><option value="superadmin">Super Admin</option><option value="owner">Owner</option></select></div>
  </div>`));
  create.appendChild(el(`<button class="btn primary" id="createUserBtn" type="button">+ Crea utente</button>`));
  p.appendChild(create);

  const list = card("Lista utenti");
  list.appendChild(el(`<div id="usersList"><p class="hint">Caricamento utenti…</p></div>`));
  p.appendChild(list);

  setTimeout(() => initUsersPanel(), 0);
  return p;
};

async function initSecurity() {
  try {
    const res = await fetch("/api/auth/status");
    const s = await res.json();
    const user = s.user;
    const passkeys = user && user.passkeys ? user.passkeys : [];
    document.getElementById("secStatus").innerHTML = `
      <div class="grid2">
        <div><strong>Utente:</strong> ${user ? user.username : "-"}</div>
        <div><strong>Ruolo:</strong> ${user ? user.roleLabel : "-"}</div>
        <div><strong>Email:</strong> ${user && user.email ? user.email : "Non impostata"}</div>
        <div><strong>Passkey registrate:</strong> ${passkeys.length}</div>
      </div>
      <div style="margin-top:1rem">
        ${passkeys.length ? passkeys.map(p => `<div class="repeat-item"><div class="repeat-head"><strong>🔐 ${p.name || "Passkey"}</strong><button class="btn small danger" data-del-passkey="${p.id}">Rimuovi</button></div><p class="dim-note">Creata: ${p.createdAt || "-"} · Ultimo uso: ${p.lastUsedAt || "mai"}</p></div>`).join("") : `<p class="dim-note">⚠️ Nessuna passkey: al momento questo account entra solo con password. Registrane una per attivare il secondo fattore.</p>`}
      </div>`;
    document.querySelectorAll("[data-del-passkey]").forEach(btn => {
      btn.onclick = async () => {
        if (!confirm("Rimuovere questa passkey?")) return;
        const r = await fetch(`/api/users/${user.id}/passkeys/${btn.dataset.delPasskey}`, { method:"DELETE" });
        const out = await r.json();
        if (out.ok) { toast("Passkey rimossa ✓"); initSecurity(); } else toast(out.error || "Errore", true);
      };
    });
  } catch (e) {}

  const btn = document.getElementById("regPasskeyBtn");
  if (btn) btn.onclick = registerPasskey;
  const pwd = document.getElementById("changeMyPwd");
  if (pwd) pwd.onclick = async () => {
    const currentPassword = document.getElementById("curPwd").value;
    const newPassword = document.getElementById("newPwd").value;
    const res = await fetch("/api/me/password", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ currentPassword, newPassword }) });
    const out = await res.json();
    if (out.ok) { toast("Password aggiornata ✓"); document.getElementById("curPwd").value=""; document.getElementById("newPwd").value=""; }
    else toast(out.error || "Errore password", true);
  };
}

async function initUsersPanel() {
  const box = document.getElementById("usersList");
  async function load() {
    const res = await fetch("/api/users");
    if (res.status === 403) { box.innerHTML = `<div class="error-box"><h3>Permessi insufficienti</h3><p>Solo Owner e Super Admin possono gestire gli utenti.</p></div>`; return; }
    const data = await res.json();
    if (!res.ok) { box.innerHTML = `<div class="error-box"><p>${data.error || "Errore caricamento utenti"}</p></div>`; return; }
    box.innerHTML = data.users.map(u => `
      <div class="repeat-item" data-user-row="${u.id}">
        <div class="repeat-head"><strong>${u.active ? "🟢" : "⚪"} ${u.username}</strong><span class="dim-note">${u.roleLabel} · ${u.passkeysCount} passkey</span></div>
        <div class="grid3">
          <div class="field"><label>Username</label><input data-user-field="username" value="${u.username || ""}"></div>
          <div class="field"><label>Email</label><input data-user-field="email" value="${u.email || ""}"></div>
          <div class="field"><label>Ruolo</label><select data-user-field="role">
            <option value="editor" ${u.role === "editor" ? "selected" : ""}>Editor</option>
            <option value="admin" ${u.role === "admin" ? "selected" : ""}>Admin</option>
            <option value="superadmin" ${u.role === "superadmin" ? "selected" : ""}>Super Admin</option>
            <option value="owner" ${u.role === "owner" ? "selected" : ""}>Owner</option>
          </select></div>
        </div>
        <div class="repeat-actions" style="margin-top:.8rem;justify-content:flex-start;gap:.5rem;flex-wrap:wrap">
          <button class="btn small" data-save-user="${u.id}">Salva utente</button>
          <button class="btn small" data-toggle-user="${u.id}" data-active="${u.active}">${u.active ? "Disattiva" : "Attiva"}</button>
          <button class="btn small" data-reset-password="${u.id}">Reset password</button>
          ${u.passkeys.map(p => `<button class="btn small danger" data-remove-user-passkey="${u.id}|${p.id}">Rimuovi ${p.name || "passkey"}</button>`).join("")}
        </div>
      </div>`).join("");

    box.querySelectorAll("[data-save-user]").forEach(btn => btn.onclick = async () => {
      const row = box.querySelector(`[data-user-row="${btn.dataset.saveUser}"]`);
      const payload = Object.fromEntries([...row.querySelectorAll("[data-user-field]")].map(i => [i.dataset.userField, i.value]));
      const r = await fetch(`/api/users/${btn.dataset.saveUser}`, { method:"PATCH", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) });
      const out = await r.json();
      if (out.ok) { toast("Utente salvato ✓"); load(); } else toast(out.error || "Errore", true);
    });
    box.querySelectorAll("[data-toggle-user]").forEach(btn => btn.onclick = async () => {
      const next = btn.dataset.active !== "true";
      const r = await fetch(`/api/users/${btn.dataset.toggleUser}`, { method:"PATCH", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ active: next }) });
      const out = await r.json();
      if (out.ok) { toast("Stato aggiornato ✓"); load(); } else toast(out.error || "Errore", true);
    });
    box.querySelectorAll("[data-reset-password]").forEach(btn => btn.onclick = async () => {
      const password = prompt("Nuova password temporanea (min 8 caratteri):");
      if (!password) return;
      const r = await fetch(`/api/users/${btn.dataset.resetPassword}/password`, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ password }) });
      const out = await r.json();
      if (out.ok) toast("Password aggiornata ✓"); else toast(out.error || "Errore", true);
    });
    box.querySelectorAll("[data-remove-user-passkey]").forEach(btn => btn.onclick = async () => {
      if (!confirm("Rimuovere questa passkey?")) return;
      const [uid, pid] = btn.dataset.removeUserPasskey.split("|");
      const r = await fetch(`/api/users/${uid}/passkeys/${pid}`, { method:"DELETE" });
      const out = await r.json();
      if (out.ok) { toast("Passkey rimossa ✓"); load(); } else toast(out.error || "Errore", true);
    });
  }

  const createBtn = document.getElementById("createUserBtn");
  if (createBtn) createBtn.onclick = async () => {
    const payload = {
      username: document.getElementById("newUserName").value,
      email: document.getElementById("newUserEmail").value,
      password: document.getElementById("newUserPass").value,
      role: document.getElementById("newUserRole").value,
    };
    const res = await fetch("/api/users", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) });
    const out = await res.json();
    if (out.ok) { toast("Utente creato ✓"); document.getElementById("newUserName").value=""; document.getElementById("newUserEmail").value=""; document.getElementById("newUserPass").value=""; load(); }
    else toast(out.error || "Errore creazione", true);
  };
  load();
}

const _b64uToBuf = (s) => { s = s.replace(/-/g, "+").replace(/_/g, "/"); const pad = s.length % 4 ? "=".repeat(4 - s.length % 4) : ""; const bin = atob(s + pad); const b = new Uint8Array(bin.length); for (let i=0;i<bin.length;i++) b[i]=bin.charCodeAt(i); return b.buffer; };
const _bufToB64u = (buf) => { const b = new Uint8Array(buf); let s=""; for (let i=0;i<b.length;i++) s+=String.fromCharCode(b[i]); return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,""); };

async function registerPasskey() {
  const out = document.getElementById("regResult");
  try {
    if (!window.PublicKeyCredential) { toast("Questo browser non supporta le passkey", true); return; }
    const optRes = await fetch("/api/passkey/register/options");
    if (!optRes.ok) { toast("Errore opzioni", true); return; }
    const options = await optRes.json();
    options.challenge = _b64uToBuf(options.challenge);
    options.user.id = _b64uToBuf(options.user.id);
    if (options.excludeCredentials) options.excludeCredentials = options.excludeCredentials.map(c => ({ ...c, id: _b64uToBuf(c.id) }));
    const cred = await navigator.credentials.create({ publicKey: options });
    const payload = {
      passkeyName: (document.getElementById("passkeyName") && document.getElementById("passkeyName").value) || "Passkey",
      id: cred.id, rawId: _bufToB64u(cred.rawId), type: cred.type,
      response: {
        attestationObject: _bufToB64u(cred.response.attestationObject),
        clientDataJSON: _bufToB64u(cred.response.clientDataJSON),
        transports: cred.response.getTransports ? cred.response.getTransports() : []
      },
      clientExtensionResults: cred.getClientExtensionResults ? cred.getClientExtensionResults() : {}
    };
    const vRes = await fetch("/api/passkey/register/verify", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) });
    const v = await vRes.json();
    if (v.ok) {
      out.innerHTML = `<div class="card" style="background:#f1f8f3;border-color:#bfe3cb"><strong>✅ Passkey registrata!</strong><p class="hint" style="margin:.6rem 0">Dal prossimo login, questo account userà password + passkey.</p></div>`;
      toast("Passkey registrata ✓");
      initSecurity();
    } else {
      toast(v.error || "Registrazione non riuscita", true);
    }
  } catch (e) {
    toast("Registrazione annullata o non riuscita", true);
  }
}

/* =========================================================================
   Boot & navigation
   ========================================================================= */
function showTab(name) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
  const content = $("#content");
  content.innerHTML = "";
  const panel = panels[name]();
  panel.classList.add("active");
  content.appendChild(panel);
}

async function loadConfig() {
  const content = $("#content");
  let res;
  try {
    res = await fetch("/api/config", { cache: "no-store" });
  } catch (e) {
    // Tipico quando si apre admin/index.html come file, senza server avviato
    content.innerHTML = `
      <div class="error-box">
        <h3>⚠️ Server non raggiungibile</h3>
        <p>Il pannello di amministrazione ha bisogno del server Node attivo per funzionare (legge e salva i dati tramite le API).</p>
        <p>Probabilmente hai aperto questa pagina come file. Avvia invece il server:</p>
        <p><code>npm install</code> &nbsp;poi&nbsp; <code>npm start</code></p>
        <p>e apri <code>http://localhost:3000/admin</code></p>
        <button class="btn primary" onclick="location.reload()">↻ Riprova</button>
      </div>`;
    return;
  }
  if (res.status === 401) { window.location.href = "/admin/login"; return; }
  if (!res.ok) {
    content.innerHTML = `<div class="error-box"><h3>⚠️ Errore ${res.status}</h3>
      <p>Non è stato possibile caricare la configurazione.</p>
      <button class="btn primary" onclick="location.reload()">↻ Riprova</button></div>`;
    return;
  }
  CFG = await res.json();
  // sanity defaults: garantiamo che tutte le sezioni esistano (retro-compatibilità)
  CFG.theme = CFG.theme || { colors: {}, fonts: {} };
  CFG.theme.colors = CFG.theme.colors || {};
  CFG.theme.fonts = CFG.theme.fonts || {};
  CFG.sectionsOrder = CFG.sectionsOrder || ["hero", "services", "works", "marketing", "packages"];
  CFG.brand = CFG.brand || { name: "Meikasait" };
  CFG.nav = CFG.nav || { links: [], ctaLabel: "Contatti", ctaHref: "#contatti" };
  CFG.banner = CFG.banner || { enabled: false, text: "", linkLabel: "", linkHref: "#", background: "#13201c", color: "#fff" };
  CFG.hero = CFG.hero || { enabled: true, summaryCards: [], steps: [] };
  if (!Array.isArray(CFG.hero.summaryCards)) CFG.hero.summaryCards = [];
  if (!Array.isArray(CFG.hero.steps)) CFG.hero.steps = [];
  if (!CFG.hero.background) CFG.hero.background = { image: "", opacity: 1, position: "center center", size: "cover", blur: 0, overlayColor: "#10231b", overlayOpacity: 0 };
  if (!CFG.hero.summaryBackground) CFG.hero.summaryBackground = { enabled: false, color: "", image: "", opacity: 1, position: "center center", size: "cover", overlayColor: "#000000", overlayOpacity: 0 };
  if (!CFG.pageBackground) CFG.pageBackground = { enabled: false, image: "", color: "", opacity: 1, position: "center center", size: "cover", blur: 0, overlayColor: "#000000", overlayOpacity: 0 };
  CFG.services = CFG.services || { enabled: true, eyebrow: "Cosa facciamo", title: "Tre cose. Fatte bene.", text: "", items: [] };
  if (!Array.isArray(CFG.services.items)) CFG.services.items = [];
  CFG.works = CFG.works || { enabled: true, eyebrow: "Vetrina", title: "I nostri lavori", text: "", autoscroll: true, items: [] };
  if (!Array.isArray(CFG.works.items)) CFG.works.items = [];
  CFG.marketing = CFG.marketing || { enabled: true, eyebrow: "Marketing & social", title: "Post buoni, sponsor mirate.", text: "", note: "", items: [], soon: { enabled: true, title: "", text: "" } };
  if (!Array.isArray(CFG.marketing.items)) CFG.marketing.items = [];
  if (!CFG.marketing.soon) CFG.marketing.soon = { enabled: true, title: "", text: "" };
  CFG.packages = CFG.packages || { enabled: true, eyebrow: "", title: "", text: "", items: [] };
  if (!Array.isArray(CFG.packages.items)) CFG.packages.items = [];
  CFG.contact = CFG.contact || { eyebrow: "", title: "", text: "" };
  CFG.footer = CFG.footer || { text: "", privacyLabel: "Privacy & Cookie Policy" };
  CFG.privacy = CFG.privacy || { companyName: CFG.brand.name, ownerEmail: CFG.brand.email || "", lastUpdate: "" };
  CFG.seo = CFG.seo || { title: "", description: "", ogImage: "", keywords: "" };
  showTab("tema");
}

async function save() {
  const btn = $("#saveBtn");
  btn.disabled = true; btn.textContent = "💾 Salvataggio…";
  try {
    const res = await fetch("/api/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(CFG) });
    const data = await res.json();
    if (data.ok) toast("Modifiche salvate ✓");
    else toast(data.error || "Errore nel salvataggio", true);
  } catch (e) { toast("Errore di rete", true); }
  btn.disabled = false; btn.textContent = "💾 Salva modifiche";
}

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("tab")) showTab(e.target.dataset.tab);
});
$("#saveBtn").onclick = save;
$("#reloadBtn").onclick = () => { if (confirm("Ricaricare la configurazione salvata? Le modifiche non salvate andranno perse.")) loadConfig(); };
$("#logoutBtn").onclick = async () => { await fetch("/api/logout", { method: "POST" }); window.location.href = "/admin/login"; };

// Ctrl/Cmd+S per salvare
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); save(); }
});

loadConfig();
