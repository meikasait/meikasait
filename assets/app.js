/* =========================================================================
   MEIKASAIT — front-end guidato da configurazione (data/content.json)
   Tutti i contenuti, colori, font, immagini, ordine sezioni, banner
   sono caricati dalla config e modificabili dal pannello admin (/admin).

   v3.0 — aggiunte:
   • Sezione "Servizi" (cosa facciamo)
   • Sezione "Marketing & social" con abbonamenti
   • Pagine dettaglio lavori cliccabili (/lavoro/:slug)
   • SEO dinamico (title, description, OG, JSON-LD)
   • Palette con accenti italiani (verde basilico, rosso pomodoro)
   • prefers-reduced-motion + skip-link + scroll-margin ancore
   ========================================================================= */

/* Config di fallback usata se il fetch fallisce (es. apertura del file
   index.html direttamente senza server). Il server e l'admin usano
   sempre data/content.json. */
const FALLBACK_CONFIG = {
  theme: {
    colors: { bg: "#f6f1e6", paper: "#fffdf6", ink: "#13201c", ink2: "#1d2f29", muted: "#5e6a64", mutedDark: "#b3c0b9", sand: "#ead3ad", sage: "#cfe0d2", rust: "#c0392b", rustDark: "#902418", olive: "#5d7a45", basil: "#3e6b3a", tricolorRed: "#ce2b37", tricolorWhite: "#f4f5f0", tricolorGreen: "#009246", heroFrom: "#10231b", heroMid: "#16322a", heroTo: "#1f4a3a" },
    fonts: { family: "'Plus Jakarta Sans', Inter, system-ui, sans-serif", headingFamily: "'Fraunces', serif", googleFontUrl: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,500;9..144,700;9..144,900&display=swap", baseSize: "16px", h1Size: "clamp(2.8rem, 6.6vw, 5.6rem)", h2Size: "clamp(1.9rem, 3.8vw, 3.2rem)", radius: "26px" }
  },
  brand: { name: "Meikasait", logoText: "M", logoImage: "", logoWordmark: "", logoBgShape: "none", logoBgColor: "#ffffff", logoBgColorDark: "", logoBgOnLight: true, logoBgOnDark: true, logoBgPadding: 6, logoBgRadius: 14, logoBgBorder: false, tagline: "Make-a-site, all'italiana.", email: "ciao@meikasait.it", phone: "+39 000 000 0000", instagram: "@meikasait", instagramUrl: "https://instagram.com" },
  nav: { links: [{ label: "Servizi", href: "#servizi" }, { label: "Lavori", href: "#lavori" }, { label: "Marketing", href: "#marketing" }, { label: "Pacchetti", href: "#preventivo" }], ctaLabel: "Parliamone", ctaHref: "#contatti" },
  banner: { enabled: false, text: "", linkLabel: "", linkHref: "#", background: "#13201c", color: "#fffdf6" },
  sectionsOrder: ["hero", "services", "works", "marketing", "packages"],
  hero: { enabled: true, eyebrow: "Web design & marketing", title: "Make-a-site. Ma sul serio.", text: "", primaryCtaLabel: "Vedi i lavori", primaryCtaHref: "#lavori", secondaryCtaLabel: "Richiedi preventivo", secondaryCtaHref: "#contatti", summaryTitle: "In breve", summaryCards: [], steps: [] },
  services: { enabled: true, eyebrow: "Cosa facciamo", title: "Tre cose. Fatte bene.", text: "", items: [] },
  works: { enabled: true, eyebrow: "Vetrina", title: "I nostri lavori", text: "", autoscroll: true, items: [] },
  marketing: { enabled: true, eyebrow: "Marketing & social", title: "Post buoni, sponsor mirate.", text: "", items: [], soon: { enabled: true, title: "", text: "" } },
  packages: { enabled: true, eyebrow: "Pacchetti", title: "Partiamo da un pacchetto.", text: "", items: [] },
  contact: { eyebrow: "Parliamone", title: "Raccontaci cosa vuoi costruire.", text: "" },
  footer: { text: "Tutti i diritti riservati.", privacyLabel: "Privacy & Cookie Policy" },
  seo: { title: "Meikasait — Siti web e marketing all'italiana", description: "Make-a-site, ma sul serio.", ogImage: "", favicon: "" }
};

let CONFIG = FALLBACK_CONFIG;
const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------- Util ---------------- */
function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function slugify(s = "") {
  return String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/* ---------------- Theme + SEO ---------------- */
function applyPageBackground(cfg) {
  const pb = cfg.pageBackground || {};
  const el = document.getElementById("pageBg") || (() => {
    const d = document.createElement("div"); d.id = "pageBg"; document.body.prepend(d); return d;
  })();
  const ov = document.getElementById("pageBgOverlay") || (() => {
    const d = document.createElement("div"); d.id = "pageBgOverlay"; document.body.prepend(d); return d;
  })();
  if (!pb.enabled) {
    el.style.display = "none"; ov.style.display = "none";
    document.body.classList.remove("has-page-bg");
    return;
  }
  document.body.classList.add("has-page-bg");
  el.style.display = "block";
  el.style.cssText = `
    position:fixed; inset:0; z-index:-2; pointer-events:none;
    ${pb.color ? `background-color:${pb.color};` : ""}
    ${pb.image ? `background-image:url('${pb.image}');background-position:${pb.position || "center center"};background-size:${pb.size || "cover"};background-repeat:no-repeat;` : ""}
    opacity:${(pb.opacity != null && pb.opacity !== "") ? Math.max(0, Math.min(1, Number(pb.opacity))) : 1};
    ${pb.blur ? `filter:blur(${Number(pb.blur)}px);` : ""}
  `;
  const opAlpha = (pb.overlayOpacity != null && pb.overlayOpacity !== "") ? Math.max(0, Math.min(1, Number(pb.overlayOpacity))) : 0;
  if (pb.overlayColor && opAlpha > 0) {
    ov.style.display = "block";
    ov.style.cssText = `position:fixed; inset:0; z-index:-1; pointer-events:none; background:${hexToRgba(pb.overlayColor, opAlpha)};`;
  } else {
    ov.style.display = "none";
  }
}

function applyTheme(cfg) {
  const c = cfg.theme?.colors || {};
  const f = cfg.theme?.fonts || {};
  const root = document.documentElement.style;
  const map = {
    "--bg": c.bg, "--cream": c.bg, "--paper": c.paper, "--ink": c.ink, "--ink-2": c.ink2,
    "--muted": c.muted, "--muted-dark": c.mutedDark, "--sand": c.sand, "--sage": c.sage,
    "--rust": c.rust, "--rust-dark": c.rustDark,
    "--olive": c.olive, "--basil": c.basil,
    "--tricolor-red": c.tricolorRed, "--tricolor-white": c.tricolorWhite, "--tricolor-green": c.tricolorGreen,
    "--hero-from": c.heroFrom, "--hero-mid": c.heroMid, "--hero-to": c.heroTo,
    "--font-family": f.family, "--font-heading": f.headingFamily,
    "--h1-size": f.h1Size, "--h2-size": f.h2Size, "--radius": f.radius
  };
  Object.entries(map).forEach(([k, v]) => { if (v) root.setProperty(k, v); });
  if (f.baseSize) root.setProperty("font-size", f.baseSize);

  if (f.googleFontUrl && /^https:\/\/fonts\.googleapis\.com\//.test(f.googleFontUrl)) {
    let link = document.getElementById("dynamicFont");
    if (!link) { link = document.createElement("link"); link.id = "dynamicFont"; link.rel = "stylesheet"; document.head.appendChild(link); }
    link.href = f.googleFontUrl;
  }
}

function applySeo(cfg, override = {}) {
  const seo = cfg.seo || {};
  const brand = cfg.brand || {};
  const title = override.title || seo.title || `${brand.name} — ${brand.tagline || ""}`;
  const desc = override.description || seo.description || brand.tagline || "";
  document.title = title;
  const set = (sel, attr, value) => { const el = document.querySelector(sel); if (el && value != null) el.setAttribute(attr, value); };
  set("#pageTitle", "textContent", title);
  // safari
  const t = document.getElementById("pageTitle"); if (t) t.textContent = title;
  set('meta[name="description"]', "content", desc);
  set("#ogTitle", "content", title);
  set("#ogDesc", "content", desc);
  if (seo.ogImage) set("#ogImage", "content", seo.ogImage);
  if (location && location.href) set("#canonicalLink", "href", location.origin + location.pathname);

  // Favicon dinamica — usa seo.favicon se impostata, altrimenti fallback al logoImage del brand
  const faviconUrl = seo.favicon || brand.logoImage || "";
  if (faviconUrl) {
    const ext = (faviconUrl.split("?")[0].split(".").pop() || "").toLowerCase();
    const typeMap = { svg: "image/svg+xml", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", ico: "image/x-icon", webp: "image/webp", gif: "image/gif" };
    const mime = typeMap[ext] || "image/png";
    // Rimuovi tutte le vecchie icone (inclusi favicon-32/64 e apple-touch-icon)
    document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').forEach((l) => l.remove());
    // Aggiungi la nuova favicon
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = mime;
    link.href = faviconUrl;
    document.head.appendChild(link);
    // Duplica anche come apple-touch-icon per iOS home screen
    const apple = document.createElement("link");
    apple.rel = "apple-touch-icon";
    apple.href = faviconUrl;
    document.head.appendChild(apple);
  }

  // JSON-LD Organization (light)
  let ld = document.getElementById("ldJson");
  if (!ld) { ld = document.createElement("script"); ld.id = "ldJson"; ld.type = "application/ld+json"; document.head.appendChild(ld); }
  ld.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": brand.name,
    "description": desc,
    "url": location.origin,
    "email": brand.email,
    "telephone": brand.phone,
    "sameAs": brand.instagramUrl ? [brand.instagramUrl] : []
  });
}

/* ---------------- Rendering: pezzi riusabili ---------------- */
/**
 * Restituisce l'HTML di un'icona. Se il valore è (o contiene) la bandiera
 * italiana emoji "🇮🇹", la sostituisce con un piccolo SVG inline della bandiera:
 * così il rendering è identico su tutti i sistemi (Windows, Android AOSP,
 * vecchi browser) dove l'emoji regional-indicator può non essere disegnata
 * correttamente. Altri emoji/testi passano invariati (escapati).
 */
function renderIcon(raw) {
  const value = (raw ?? "").toString();
  const italianFlagSvg = `<svg class="icon-flag-it" viewBox="0 0 30 20" role="img" aria-label="Bandiera italiana" xmlns="http://www.w3.org/2000/svg"><rect width="10" height="20" fill="#009246"/><rect x="10" width="10" height="20" fill="#F4F5F0"/><rect x="20" width="10" height="20" fill="#CE2B37"/><rect x="0" y="0" width="30" height="20" fill="none" stroke="rgba(0,0,0,.08)" stroke-width="1"/></svg>`;
  if (value === "🇮🇹") return italianFlagSvg;
  if (value.includes("🇮🇹")) {
    // Sostituisce le occorrenze della bandiera, ma escapa il resto
    const parts = value.split("🇮🇹");
    return parts.map((p) => esc(p)).join(italianFlagSvg);
  }
  return esc(value);
}

function logoMark(site) {
  if (site.image) {
    return `<img class="work-photo" src="${esc(site.image)}" alt="${esc(site.name)}" loading="lazy" />`;
  }
  const id = (site.initials || "X").replace(/[^a-zA-Z0-9]/g, "");
  return `
    <div class="browser-preview" style="--site-color:${esc(site.color)}; --site-accent:${esc(site.accent)}">
      <div class="preview-top"><span></span><span></span><span></span></div>
      <div class="preview-hero">
        <svg class="site-logo-svg" viewBox="0 0 96 96" role="img" aria-label="Logo ${esc(site.name)}">
          <defs><linearGradient id="logo-${id}" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stop-color="${esc(site.color)}"/><stop offset="1" stop-color="${esc(site.accent)}"/>
          </linearGradient></defs>
          <rect x="8" y="8" width="80" height="80" rx="22" fill="url(#logo-${id})"/>
          <path d="M24 63 C34 38, 44 38, 52 52 S68 66, 76 34" fill="none" stroke="rgba(255,255,255,.38)" stroke-width="5" stroke-linecap="round"/>
          <text x="48" y="55" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="24" font-weight="800" font-family="Inter, Arial, sans-serif">${esc(site.initials)}</text>
        </svg>
        <b>${esc(site.icon || "💻")}</b>
      </div>
      <div class="preview-lines"><i></i><i></i><i></i></div>
    </div>`;
}

function workHref(site) {
  const slug = site.slug || slugify(site.name);
  return `/lavoro/${slug}`;
}

function showcaseCards(items, isClone = false) {
  return items.map((site, idx) => {
    const slug = site.slug || slugify(site.name);
    const slugAttr = esc(slug);
    return `
    <article class="showcase-card" ${isClone ? 'aria-hidden="true"' : ""} data-work-open="${slugAttr}" tabindex="${isClone ? "-1" : "0"}" role="button" aria-label="Apri anteprima ${esc(site.name)}">
      <div class="showcase-logo" data-work-open="${slugAttr}">
        ${logoMark(site)}
      </div>
      <div class="showcase-copy">
        <span>${esc(site.type)}${site.sector ? " · " + esc(site.sector) : ""}</span>
        <h3>${esc(site.name)}</h3>
        <p>${esc(site.description)}</p>
        <button type="button" class="button ghost work-cta" data-work-open="${slugAttr}" aria-label="Scopri il caso ${esc(site.name)}" tabindex="${isClone ? "-1" : "0"}">
          Vedi dettagli <span aria-hidden="true">→</span>
        </button>
      </div>
    </article>`;
  }).join("");
}

function packageCards(items) {
  return items.map((item) => `
    <article class="card package">
      ${item.image ? `<img class="package-bg" src="${esc(item.image)}" alt="" loading="lazy" aria-hidden="true" />` : ""}
      ${item.badge ? `<div class="badge">${esc(item.badge)}</div>` : ""}
      <div class="package-head"><div><h3><span aria-hidden="true">${esc(item.icon)}</span>${esc(item.name)}</h3></div></div>
      <p>${esc(item.description)}</p>
      <div class="price">${esc(item.price)}</div>
      <ul>${(item.features || []).map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
      <a class="button ghost" href="#contatti" data-package="${esc(item.name)}">Chiedi info</a>
    </article>`).join("");
}

/* ---------------- Sezioni ---------------- */
function hexToRgba(hex, alpha) {
  if (!hex) return "";
  const m = String(hex).replace("#", "");
  const full = m.length === 3 ? m.split("").map(c => c + c).join("") : m;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return "";
  const r = parseInt(full.slice(0, 2), 16), g = parseInt(full.slice(2, 4), 16), b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* Genera gli stili inline per un blocco "background" */
function bgLayerStyles(bg) {
  if (!bg) return { image: "", overlay: "", color: "" };
  const image = bg.image ? `background-image:url('${esc(bg.image)}');background-position:${esc(bg.position || "center center")};background-size:${esc(bg.size || "cover")};background-repeat:no-repeat;` : "";
  const opacity = (bg.opacity != null && bg.opacity !== "") ? Math.max(0, Math.min(1, Number(bg.opacity))) : 1;
  const blur = bg.blur ? Number(bg.blur) : 0;
  const imgFull = image ? `${image}opacity:${opacity};${blur ? `filter:blur(${blur}px);` : ""}` : "";
  const overlayOp = (bg.overlayOpacity != null && bg.overlayOpacity !== "") ? Math.max(0, Math.min(1, Number(bg.overlayOpacity))) : 0;
  const overlay = (bg.overlayColor && overlayOp > 0) ? `background:${hexToRgba(bg.overlayColor, overlayOp)};` : "";
  const color = bg.color ? `background-color:${esc(bg.color)};` : "";
  return { image: imgFull, overlay, color };
}

function heroSection(cfg) {
  const h = cfg.hero || {};
  if (h.enabled === false) return "";
  const bg = h.background || {};
  const layers = bgLayerStyles(bg);
  const hasBg = !!layers.image;

  // Background del riquadro "In breve"
  const sb = h.summaryBackground || {};
  const sbEnabled = sb.enabled !== false && (sb.image || sb.color);
  const summaryStyle = sbEnabled
    ? `${sb.color ? `background-color:${esc(sb.color)};` : ""}${sb.image ? `background-image:url('${esc(sb.image)}');background-position:${esc(sb.position || "center center")};background-size:${esc(sb.size || "cover")};background-repeat:no-repeat;` : ""}`
    : "";
  const sbOp = (sb.overlayOpacity != null && sb.overlayOpacity !== "") ? Math.max(0, Math.min(1, Number(sb.overlayOpacity))) : 0;
  const summaryOverlay = (sbEnabled && sb.overlayColor && sbOp > 0) ? hexToRgba(sb.overlayColor, sbOp) : "";

  return `
    <section class="hero section hero-section${hasBg || layers.color ? " has-bg-image" : ""}" id="home" data-theme="dark">
      ${layers.color ? `<div class="hero-bg-image" style="${layers.color}" aria-hidden="true"></div>` : ""}
      ${layers.image ? `<div class="hero-bg-image" style="${layers.image}" aria-hidden="true"></div>` : ""}
      ${layers.overlay ? `<div class="hero-bg-overlay" style="${layers.overlay}" aria-hidden="true"></div>` : ""}
      <div class="hero-content">
        <p class="eyebrow light">${esc(h.eyebrow)}</p>
        <h1>${esc(h.title)}</h1>
        <p class="hero-text">${esc(h.text)}</p>
        <div class="hero-actions">
          <a class="button primary" href="${esc(h.primaryCtaHref)}">${esc(h.primaryCtaLabel)}</a>
          <a class="button secondary dark" href="${esc(h.secondaryCtaHref)}">${esc(h.secondaryCtaLabel)}</a>
        </div>
        <div class="hero-tricolor" aria-hidden="true"><span></span><span></span><span></span></div>
      </div>
      <aside class="hero-summary${sbEnabled ? " has-bg" : ""}" aria-label="Riassunto servizi e metodo" style="${summaryStyle}">
        ${summaryOverlay ? `<div class="hero-summary-overlay" style="background:${summaryOverlay}" aria-hidden="true"></div>` : ""}
        <div class="summary-top">
          <span>${esc(h.summaryTitle)}</span>
          <strong>${renderIcon("🇮🇹")} ${esc(cfg.brand.tagline)}</strong>
        </div>
        <div class="summary-grid visual-summary">
          ${(h.summaryCards || []).map((s) => `<article><b aria-hidden="true">${renderIcon(s.icon)}</b><strong>${esc(s.title)}</strong><span>${esc(s.text)}</span></article>`).join("")}
        </div>
        <div class="method-strip" aria-label="Metodo di lavoro">
          ${(h.steps || []).map((s) => `<div><b>${esc(s.number)}</b><strong>${esc(s.title)}</strong><span>${esc(s.text)}</span></div>`).join("")}
        </div>
      </aside>
    </section>`;
}

function servicesSection(cfg) {
  const s = cfg.services || {};
  if (s.enabled === false) return "";
  return `
    <section id="servizi" class="section-band services-band" data-theme="light">
      <div class="section inner">
        <div class="section-heading center-heading dark-text">
          <p class="eyebrow">${esc(s.eyebrow)}</p>
          <h2>${esc(s.title)}</h2>
          <p class="muted-text">${esc(s.text)}</p>
        </div>
        <div class="services-grid">
          ${(s.items || []).map((it) => `
            <article class="service-card">
              <div class="service-icon" aria-hidden="true">${esc(it.icon || "✨")}</div>
              <h3>${esc(it.title)}</h3>
              <p>${esc(it.text)}</p>
              ${it.linkLabel ? `<a class="link-arrow" href="${esc(it.linkHref || "#")}">${esc(it.linkLabel)} <span aria-hidden="true">→</span></a>` : ""}
            </article>
          `).join("")}
        </div>
      </div>
    </section>`;
}

function worksSection(cfg) {
  const w = cfg.works || {};
  if (w.enabled === false) return "";
  const items = w.items || [];
  return `
    <section id="lavori" class="section-band works-band" data-theme="light">
      <div class="section inner showcase-section">
        <div class="section-heading showcase-heading split-heading">
          <div>
            <p class="eyebrow">${esc(w.eyebrow)}</p>
            <h2>${esc(w.title)}</h2>
            <p>${esc(w.text)}</p>
          </div>
          <div class="showcase-controls" aria-label="Controlli vetrina siti">
            <button class="showcase-arrow" type="button" data-showcase-prev aria-label="Scorri a sinistra">←</button>
            <button class="showcase-arrow" type="button" data-showcase-next aria-label="Scorri a destra">→</button>
          </div>
        </div>
        <div class="showcase-rail" id="showcaseRail" tabindex="0" aria-label="Siti web creati" data-autoscroll="${w.autoscroll !== false && !REDUCED_MOTION}">
          ${showcaseCards(items)}${showcaseCards(items, true)}
        </div>
      </div>
    </section>`;
}

function marketingSection(cfg) {
  const m = cfg.marketing || {};
  if (m.enabled === false) return "";
  return `
    <section id="marketing" class="section-band marketing-band" data-theme="light">
      <div class="section inner">
        <div class="section-heading center-heading dark-text">
          <p class="eyebrow">${esc(m.eyebrow)}</p>
          <h2>${esc(m.title)}</h2>
          <p class="muted-text">${esc(m.text)}</p>
          ${m.note ? `<p class="soft-note">${esc(m.note)}</p>` : ""}
        </div>
        <div class="marketing-grid">
          ${(m.items || []).map((it) => `
            <article class="marketing-card">
              ${it.badge ? `<div class="badge light">${esc(it.badge)}</div>` : ""}
              <h3><span aria-hidden="true">${esc(it.icon || "")}</span>${esc(it.name)}</h3>
              <p>${esc(it.description)}</p>
              <div class="price-line">${esc(it.price)}</div>
              <ul>${(it.features || []).map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
              <a class="button primary-soft" href="#contatti" data-marketing="${esc(it.name)}">Attiva ora</a>
            </article>
          `).join("")}
        </div>
        ${m.soon && m.soon.enabled ? `
          <div class="soon-banner">
            <strong>${esc(m.soon.title)}</strong>
            <span>${esc(m.soon.text)}</span>
          </div>` : ""}
      </div>
    </section>`;
}

function packagesSection(cfg) {
  const p = cfg.packages || {};
  const ct = cfg.contact || {};
  const b = cfg.brand;
  if (p.enabled === false) return "";
  // Merge marketing+packages nella select del form per maggiore comodità
  const allOptions = [];
  (p.items || []).forEach(i => allOptions.push(i.name));
  if (cfg.marketing && cfg.marketing.enabled !== false) (cfg.marketing.items || []).forEach(i => allOptions.push(i.name));

  return `
    <section id="preventivo" class="section-band closing-band" data-theme="dark">
      <div class="section inner">
        <div class="section-heading center-heading">
          <p class="eyebrow light">${esc(p.eyebrow)}</p>
          <h2>${esc(p.title)}</h2>
          <p>${esc(p.text)}</p>
        </div>
        <div class="packages-grid">${packageCards(p.items || [])}</div>

        <div class="contact-panel" id="contatti">
          <div class="contact-copy">
            <p class="eyebrow">${esc(ct.eyebrow)}</p>
            <h2>${esc(ct.title)}</h2>
            <p>${esc(ct.text)}</p>
            <div class="contact-list compact-social">
              <a href="mailto:${esc(b.email)}" aria-label="Invia una email">
                <svg class="contact-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4.75 6.75h14.5v10.5H4.75V6.75Z"/><path d="m5.25 7.25 6.75 5.4 6.75-5.4"/></svg>
                <span>${esc(b.email)}</span>
              </a>
              <a href="tel:${esc((b.phone || "").replace(/\s/g, ""))}" aria-label="Chiama ${esc(b.name)}">
                <svg class="contact-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.1 5.2 9.55 8.5c.2.45.08.98-.3 1.3l-1.05.9c.78 1.7 2.45 3.37 4.12 4.1l.92-1.05c.32-.37.85-.48 1.3-.28l3.26 1.43c.55.24.84.85.68 1.42l-.55 1.95c-.16.57-.68.97-1.28.94C10.15 18.92 5.08 13.85 4.79 7.36c-.03-.6.37-1.12.94-1.28l1.95-.55c.57-.16 1.18.13 1.42.67Z"/></svg>
                <span>${esc(b.phone)}</span>
              </a>
              <a href="${esc(b.instagramUrl || "https://instagram.com")}" target="_blank" rel="noreferrer" aria-label="Instagram ${esc(b.name)}">
                <svg class="contact-icon instagram-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="4.5" y="4.5" width="15" height="15" rx="4.2"/><circle cx="12" cy="12" r="3.45"/><circle cx="16.7" cy="7.35" r=".85"/></svg>
                <span>${esc(b.instagram)}</span>
              </a>
            </div>
            ${b.instagramNote ? `<p class="ig-note">✨ ${esc(b.instagramNote)}</p>` : ""}
          </div>
          <form class="contact-form" id="contactForm" autocomplete="on" novalidate>
  <label>Nome <input name="name" type="text" placeholder="Il tuo nome" autocomplete="name" required minlength="2" /></label>
  <label>Email <input name="email" type="email" placeholder="nome@email.it" autocomplete="email" required /></label>
  <label>Pacchetto / servizio
    <select name="packageName">
      <option value="">Non so ancora</option>
      ${allOptions.map((n) => `<option value="${esc(n)}">${esc(n)}</option>`).join("")}
    </select>
  </label>
  <label>Messaggio <textarea name="message" rows="5" placeholder="Raccontaci cosa ti serve" required minlength="10"></textarea></label>

  <div style="position:absolute;left:-9999px" aria-hidden="true">
    <label>Sito web <input type="text" name="website" tabindex="-1" autocomplete="off" /></label>
  </div>

  <label class="consent-row">
    <input type="checkbox" name="consent" required />
    <span>Accetto la <a href="/privacy.html" target="_blank" rel="noreferrer">Privacy Policy</a> e autorizzo il contatto per questa richiesta.</span>
  </label>

  <button class="button primary" type="submit" id="contactSubmit">Invia richiesta</button>
  <div id="contactResult" class="contact-result" hidden></div>
  <small class="form-note">Le tue informazioni vengono usate solo per rispondere alla tua richiesta. Nessun tracciamento.</small>
</form>
        </div>
      </div>
    </section>`;
}

function topBanner(cfg) {
  const ban = cfg.banner || {};
  if (!ban.enabled) { document.body.classList.remove("has-banner"); return ""; }
  document.body.classList.add("has-banner");
  const link = ban.linkLabel ? ` <a href="${esc(ban.linkHref || "#")}">${esc(ban.linkLabel)} →</a>` : "";
  return `<div class="top-banner" id="topBanner" style="background:${esc(ban.background)};color:${esc(ban.color)}">${esc(ban.text)}${link}</div>`;
}

function header(cfg) {
  const b = cfg.brand;
  const shape = (b.logoBgShape || "none").toLowerCase(); // none | circle | square | rounded | custom
  const bgColor = b.logoBgColor || "#ffffff";
  const bgColorDark = b.logoBgColorDark || bgColor;
  const onLight = b.logoBgOnLight !== false; // default: true
  const onDark  = b.logoBgOnDark  !== false; // default: true
  const bgPadding = Number.isFinite(+b.logoBgPadding) ? +b.logoBgPadding : 6;
  const bgRadius = Number.isFinite(+b.logoBgRadius) ? +b.logoBgRadius : 14;
  const hasBorder = b.logoBgBorder === true;
  const hasBg = shape !== "none" && (onLight || onDark);
  const markStyle = hasBg
    ? `--logo-bg:${esc(bgColor)};--logo-bg-dark:${esc(bgColorDark)};--logo-pad:${bgPadding}px;--logo-radius:${bgRadius}px;`
    : "";
  const markClasses = "logo-mark"
    + (hasBg ? " has-bg logo-bg-" + esc(shape) : "")
    + (hasBg && onLight ? " bg-on-light" : "")
    + (hasBg && onDark  ? " bg-on-dark"  : "")
    + (hasBg && hasBorder ? " logo-bg-border" : "");
  const logo = b.logoImage
    ? `<img class="${markClasses}" src="${esc(b.logoImage)}" alt="${esc(b.name)}" style="${markStyle}" />`
    : `<span class="${markClasses}" style="${markStyle}">${esc(b.logoText || (b.name || "M")[0])}</span>`;
  const wordmark = b.logoWordmark
    ? `<img class="logo-wordmark" src="${esc(b.logoWordmark)}" alt="${esc(b.name)}" />`
    : `<strong>${esc(b.name)}</strong>`;
  const links = (cfg.nav?.links || []).map((l) => `<a href="${esc(l.href)}">${esc(l.label)}</a>`).join("");
  return `
    <header class="site-header is-on-dark" data-header>
      <div class="header-inner">
        <a class="logo${b.logoWordmark ? " has-wordmark" : ""}" href="/" aria-label="Torna alla home">${logo}${wordmark}</a>
        <button class="nav-toggle" aria-label="Apri menu" aria-expanded="false">☰</button>
        <nav class="nav" aria-label="Navigazione principale">
          ${links}
          <a class="nav-cta" href="${esc(cfg.nav?.ctaHref || "#contatti")}">${esc(cfg.nav?.ctaLabel || "Contatti")}</a>
        </nav>
      </div>
    </header>`;
}

function footer(cfg) {
  const f = cfg.footer || {};
  if (f.enabled === false) return "";
  const b = cfg.brand || {};
  return `
    <footer class="site-footer">
      <p>© ${new Date().getFullYear()} ${esc(b.name)}. ${esc(f.text)}</p>
      <div class="footer-links">
        ${b.instagramUrl ? `<a href="${esc(b.instagramUrl)}" target="_blank" rel="noreferrer" aria-label="Instagram ${esc(b.name)}">
          <svg class="footer-ig" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style="vertical-align:-3px;margin-right:.35rem" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4.5" y="4.5" width="15" height="15" rx="4.2"/><circle cx="12" cy="12" r="3.45"/><circle cx="16.7" cy="7.35" r=".85"/></svg>${esc(b.instagram || "Instagram")}</a>` : ""}
        <a href="/privacy.html">${esc(f.privacyLabel || "Privacy & Cookie Policy")}</a>
        <a href="#" onclick="event.preventDefault(); try{localStorage.removeItem('meikasait_cookie_consent');document.cookie='meikasait_cookie_consent=;path=/;max-age=0';}catch(e){} location.reload();">Preferenze cookie</a>
        <a href="/#home">Torna su</a>
      </div>
    </footer>`;
}

function sectionByKey(key, cfg) {
  switch (key) {
    case "hero": return heroSection(cfg);
    case "services": return servicesSection(cfg);
    case "works": return worksSection(cfg);
    case "marketing": return marketingSection(cfg);
    case "packages": return packagesSection(cfg);
    default: return "";
  }
}

/* ---------------- Routing minimale (SPA-friendly) ---------------- */
function currentRoute() {
  const path = location.pathname;
  const m = path.match(/^\/lavoro\/([^\/]+)\/?$/);
  if (m) return { name: "work-detail", slug: decodeURIComponent(m[1]) };
  return { name: "home" };
}

function findWorkBySlug(slug) {
  const items = (CONFIG.works && CONFIG.works.items) || [];
  return items.find((w) => (w.slug || slugify(w.name)) === slug) || null;
}

/* ---------- Modal anteprima lavoro (stessa pagina) ---------- */
function workGalleryImages(work) {
  const d = work.details || {};
  const imgs = [];
  if (work.image) imgs.push(work.image);
  if (Array.isArray(d.gallery)) d.gallery.forEach((g) => { if (g && !imgs.includes(g)) imgs.push(g); });
  return imgs;
}

function renderWorkModalContent(work) {
  const imgs = workGalleryImages(work);
  const slug = work.slug || slugify(work.name);
  const initials = esc(work.initials || (work.name || "•")[0]);
  const slidesHTML = imgs.length
    ? imgs.map((src, i) => `<div class="wm-slide" data-slide="${i}"><img src="${esc(src)}" alt="${esc(work.name)} — anteprima ${i + 1}" loading="lazy"/></div>`).join("")
    : `<div class="wm-slide wm-placeholder" data-slide="0" style="--site-color:${esc(work.color || "#273f3a")};--site-accent:${esc(work.accent || "#c0392b")}"><span>${initials}</span><b aria-hidden="true">${esc(work.icon || "💻")}</b></div>`;
  const dots = imgs.length > 1
    ? imgs.map((_, i) => `<button class="wm-dot${i === 0 ? " active" : ""}" data-goto="${i}" aria-label="Vai a immagine ${i + 1}"></button>`).join("")
    : "";
  const arrows = imgs.length > 1
    ? `<button class="wm-arrow wm-prev" aria-label="Precedente">‹</button><button class="wm-arrow wm-next" aria-label="Successiva">›</button>`
    : "";
  const d = work.details || {};
  return `
    <div class="wm-media">
      <div class="wm-track" data-track>${slidesHTML}</div>
      ${arrows}
      ${dots ? `<div class="wm-dots">${dots}</div>` : ""}
    </div>
    <div class="wm-body">
      <p class="wm-eyebrow">${esc(work.type || "Progetto")}${work.sector ? " · " + esc(work.sector) : ""}</p>
      <h2 class="wm-title">${esc(work.name)}</h2>
      <p class="wm-desc">${esc(work.description || d.overview || "")}</p>
      ${d.highlights && d.highlights.length ? `<ul class="wm-highlights">${d.highlights.slice(0, 4).map(h => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
      <div class="wm-actions">
        <a class="button primary" href="/lavoro/${esc(slug)}">Scheda completa</a>
        <a class="button secondary" href="#contatti" data-work-close>Richiedi info</a>
      </div>
      <p class="wm-disclaimer">🔒 Anteprima generica. I dettagli riservati del cliente non vengono condivisi.</p>
    </div>
  `;
}

function ensureWorkModal() {
  let modal = document.getElementById("workModal");
  if (modal) return modal;
  modal = document.createElement("div");
  modal.id = "workModal";
  modal.className = "work-modal";
  modal.hidden = true;
  modal.innerHTML = `
    <div class="wm-backdrop" data-work-close></div>
    <div class="wm-dialog" role="dialog" aria-modal="true" aria-labelledby="wmTitle">
      <button class="wm-close" data-work-close aria-label="Chiudi anteprima">✕</button>
      <div class="wm-inner" id="wmInner"></div>
    </div>`;
  document.body.appendChild(modal);
  return modal;
}

let wmCurrentIndex = 0;
let wmTotalSlides = 0;
let wmAutoplayTimer = null;

function openWorkModal(slug) {
  const work = findWorkBySlug(slug);
  if (!work) { console.warn("[Meikasait] lavoro non trovato:", slug); return; }
  console.log("[Meikasait] apertura modale:", work.name);
  const modal = ensureWorkModal();
  const inner = modal.querySelector("#wmInner");
  inner.innerHTML = renderWorkModalContent(work);
  modal.hidden = false;
  document.body.classList.add("wm-open");
  wmCurrentIndex = 0;
  const track = modal.querySelector("[data-track]");
  wmTotalSlides = track ? track.querySelectorAll(".wm-slide").length : 0;
  wmGoto(0);
  modal.querySelectorAll("[data-work-close]").forEach(b => b.addEventListener("click", closeWorkModal));
  modal.querySelector(".wm-prev")?.addEventListener("click", () => wmGoto(wmCurrentIndex - 1));
  modal.querySelector(".wm-next")?.addEventListener("click", () => wmGoto(wmCurrentIndex + 1));
  modal.querySelectorAll(".wm-dot").forEach(d => d.addEventListener("click", () => wmGoto(parseInt(d.dataset.goto, 10))));
  // autoplay se ci sono più immagini
  clearInterval(wmAutoplayTimer);
  if (wmTotalSlides > 1 && !REDUCED_MOTION) {
    wmAutoplayTimer = setInterval(() => wmGoto(wmCurrentIndex + 1), 4500);
  }
}

function wmGoto(i) {
  const modal = document.getElementById("workModal");
  if (!modal) return;
  const track = modal.querySelector("[data-track]");
  if (!track || wmTotalSlides <= 0) return;
  wmCurrentIndex = ((i % wmTotalSlides) + wmTotalSlides) % wmTotalSlides;
  track.style.transform = `translateX(-${wmCurrentIndex * 100}%)`;
  modal.querySelectorAll(".wm-dot").forEach((d, k) => d.classList.toggle("active", k === wmCurrentIndex));
}

function closeWorkModal() {
  const modal = document.getElementById("workModal");
  if (!modal) return;
  modal.hidden = true;
  document.body.classList.remove("wm-open");
  clearInterval(wmAutoplayTimer);
  wmAutoplayTimer = null;
}

function renderWorkDetail(work) {
  const d = work.details || {};
  const stack = (d.stack || []).map((s) => `<span class="chip">${esc(s)}</span>`).join("");
  const deliverables = (d.deliverables || []).map((s) => `<li>${esc(s)}</li>`).join("");
  const highlights = (d.highlights || []).map((s) => `<li>${esc(s)}</li>`).join("");
  const gallery = (d.gallery || []).map((g) => `<figure class="gal-item"><img src="${esc(g)}" alt="" loading="lazy"/></figure>`).join("");
  return `
    <main id="home" class="work-detail">
      <div class="work-detail-inner">
        <a class="back-link" href="/#lavori"><span aria-hidden="true">←</span> Tutti i lavori</a>
        <p class="eyebrow">${esc(work.type || "Progetto")}${work.sector ? " · " + esc(work.sector) : ""}</p>
        <h1>${esc(work.name)}</h1>
        <p class="lead">${esc(work.description || "")}</p>

        <div class="work-hero" style="--site-color:${esc(work.color || "#273f3a")}; --site-accent:${esc(work.accent || "#c0392b")}">
          ${work.image
            ? `<img src="${esc(work.image)}" alt="${esc(work.name)}" />`
            : `<div class="work-hero-placeholder"><span>${esc(work.initials || (work.name || "•")[0])}</span><b aria-hidden="true">${esc(work.icon || "💻")}</b></div>`}
        </div>

        <div class="work-meta">
          <div class="meta-cell"><span>Tipo</span><strong>${esc(work.type || "—")}</strong></div>
          <div class="meta-cell"><span>Settore</span><strong>${esc(work.sector || "—")}</strong></div>
          <div class="meta-cell"><span>Tempi</span><strong>${esc(d.duration || "—")}</strong></div>
          <div class="meta-cell"><span>Output</span><strong>${esc((d.deliverables || []).slice(0, 2).join(" · ") || "—")}</strong></div>
        </div>

        ${d.overview ? `<section class="work-block">
          <h2>Panoramica</h2>
          <p>${esc(d.overview)}</p>
        </section>` : ""}

        ${d.challenge ? `<section class="work-block">
          <h2>La sfida</h2>
          <p>${esc(d.challenge)}</p>
        </section>` : ""}

        ${d.approach ? `<section class="work-block">
          <h2>Il nostro approccio</h2>
          <p>${esc(d.approach)}</p>
        </section>` : ""}

        ${highlights ? `<section class="work-block">
          <h2>Punti chiave</h2>
          <ul class="check-list">${highlights}</ul>
        </section>` : ""}

        ${(deliverables || stack) ? `<section class="work-block work-twocol">
          ${deliverables ? `<div><h3>Cosa abbiamo consegnato</h3><ul>${deliverables}</ul></div>` : ""}
          ${stack ? `<div><h3>Tecnologie</h3><div class="chip-row">${stack}</div></div>` : ""}
        </section>` : ""}

        ${gallery ? `<section class="work-block">
          <h2>Anteprima visiva</h2>
          <div class="work-gallery">${gallery}</div>
        </section>` : ""}

        <div class="work-disclaimer">
          🔒 Per riservatezza non condividiamo dettagli, dati o funzioni specifiche realizzate per il cliente. Questa è una panoramica generale e illustrativa.
        </div>

        <div class="work-cta-block">
          <h2>Ti piace come lavoriamo?</h2>
          <p>Parliamone: ti diremo se possiamo aiutarti — e come.</p>
          <a class="button primary" href="/#contatti">Richiedi un preventivo</a>
        </div>
      </div>
    </main>`;
}

function render404Work() {
  return `
    <main id="home" class="work-detail">
      <div class="work-detail-inner">
        <a class="back-link" href="/#lavori"><span aria-hidden="true">←</span> Tutti i lavori</a>
        <h1>Lavoro non trovato</h1>
        <p class="lead">Il progetto che stai cercando non esiste o è stato rinominato. Torna alla vetrina per esplorare tutti i lavori.</p>
        <a class="button primary" href="/#lavori">Vedi tutti i lavori</a>
      </div>
    </main>`;
}

function render() {
  applyTheme(CONFIG);
  applyPageBackground(CONFIG);
  const route = currentRoute();
  const app = document.querySelector("#app");

  if (route.name === "work-detail") {
    const work = findWorkBySlug(route.slug);
    applySeo(CONFIG, work ? {
      title: `${work.name} — ${CONFIG.brand.name}`,
      description: work.description || ""
    } : { title: `Lavoro non trovato — ${CONFIG.brand.name}` });

    app.innerHTML = `
      ${topBanner(CONFIG)}
      ${header(CONFIG)}
      ${work ? renderWorkDetail(work) : render404Work()}
      ${footer(CONFIG)}
    `;
  } else {
    applySeo(CONFIG);
    const order = (CONFIG.sectionsOrder && CONFIG.sectionsOrder.length) ? CONFIG.sectionsOrder : ["hero", "services", "works", "marketing", "packages"];
    app.innerHTML = `
      ${topBanner(CONFIG)}
      ${header(CONFIG)}
      <main id="home">
        ${order.map((k) => sectionByKey(k, CONFIG)).join("")}
      </main>
      ${footer(CONFIG)}
    `;
  }

  const ban = document.getElementById("topBanner");
  document.documentElement.style.setProperty("--banner-h", ban ? ban.offsetHeight + "px" : "0px");
  bindInteractions();
}

/* ---------------- Interactions ---------------- */
function bindInteractions() {
  const header = document.querySelector("[data-header]");
  let headerScrolled = null, headerTicking = false;

  // Cache delle sezioni con il loro tema (chiaro/scuro).
  // Priorità: attributo data-theme="dark|light" (esplicito e affidabile).
  // Fallback: analisi CSS background-color/background-image.
  let __sectionThemes = null;
  function detectSectionThemes() {
    __sectionThemes = [];
    const candidates = document.querySelectorAll(
      "[data-theme], .hero-section, .services-band, .works-band, .marketing-band, .closing-band, footer.site-footer"
    );
    candidates.forEach((sec) => {
      let isDark = false;
      const explicit = sec.getAttribute("data-theme");
      if (explicit === "dark") {
        isDark = true;
      } else if (explicit === "light") {
        isDark = false;
      } else {
        // Fallback: analisi CSS
        const cs = getComputedStyle(sec);
        const bg = cs.backgroundColor;
        const cm = bg && bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (cm && (cm[4] == null || parseFloat(cm[4]) > 0.5)) {
          const r = +cm[1], g = +cm[2], b = +cm[3];
          isDark = (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
        }
        const bgImg = cs.backgroundImage;
        if (bgImg && bgImg !== "none" && bgImg.includes("gradient")) {
          const rgbs = [...bgImg.matchAll(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/g)];
          const solid = rgbs.filter(m => m[4] == null || parseFloat(m[4]) > 0.4);
          if (solid.length) {
            const avg = solid.map(m => (0.299 * +m[1] + 0.587 * +m[2] + 0.114 * +m[3]) / 255)
              .reduce((a, b) => a + b, 0) / solid.length;
            if (avg < 0.5) isDark = true;
          }
        }
      }
      __sectionThemes.push({ el: sec, isDark });
    });
    console.log("[Meikasait] rilevate", __sectionThemes.length, "sezioni:",
      __sectionThemes.map(t => (t.el.id || t.el.className.split(" ")[0]) + "=" + (t.isDark ? "🌙dark" : "☀️light")).join(", "));
  }

  // Aggiorna il tema dell'header in base alla sezione attualmente sotto di esso
  function computeHeaderTheme() {
    if (!header) return;
    if (!__sectionThemes || __sectionThemes.length === 0) detectSectionThemes();
    if (!__sectionThemes || __sectionThemes.length === 0) return;
    const headerBottom = header.getBoundingClientRect().bottom + 5;
    let active = null;
    for (const t of __sectionThemes) {
      const r = t.el.getBoundingClientRect();
      if (r.top <= headerBottom && r.bottom > headerBottom) { active = t; break; }
    }
    // Se non trova nulla, usa la prima sezione visibile (fallback: hero all'inizio)
    if (!active) {
      for (const t of __sectionThemes) {
        const r = t.el.getBoundingClientRect();
        if (r.bottom > 0) { active = t; break; }
      }
    }
    if (!active) active = __sectionThemes[0];
    header.classList.toggle("is-on-dark", active.isDark);
    header.classList.toggle("is-on-light", !active.isDark);
  }
  // Ricalcola quando cambiano le dimensioni (font caricati, immagini caricate)
  window.addEventListener("resize", () => { __sectionThemes = null; }, { passive: true });
  window.addEventListener("load", () => {
    __sectionThemes = null;
    setTimeout(computeHeaderTheme, 100);
  });

  const updateHeader = () => {
    const shouldScroll = window.scrollY > 18;
    if (shouldScroll !== headerScrolled) { headerScrolled = shouldScroll; header?.classList.toggle("is-scrolled", shouldScroll); }
    computeHeaderTheme();
    headerTicking = false;
  };
  updateHeader();
  // Ricalcola il tema più volte nei primi 500ms per essere sicuri di avere i colori giusti
  // (i font web e le immagini possono modificare i layout)
  setTimeout(() => { __sectionThemes = null; computeHeaderTheme(); }, 100);
  setTimeout(() => { __sectionThemes = null; computeHeaderTheme(); }, 500);
  window.addEventListener("scroll", () => { if (headerTicking) return; headerTicking = true; window.requestAnimationFrame(updateHeader); }, { passive: true });

  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");
  navToggle?.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    header?.classList.add("is-scrolled");
  });
  document.querySelectorAll(".nav a").forEach((link) => link.addEventListener("click", () => nav?.classList.remove("open")));

  /* Smooth scroll per ancore in pagina (interno) */
  document.querySelectorAll('a[href^="#"], a[href^="/#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      const hashPart = href.startsWith("/#") ? href.slice(1) : href;
      // Se siamo già su / e c'è un'ancora interna, scrolla soft. Altrimenti lascia navigazione normale.
      if (location.pathname === "/" && hashPart.startsWith("#") && hashPart.length > 1) {
        const target = document.querySelector(hashPart);
        if (target) { e.preventDefault(); target.scrollIntoView({ behavior: REDUCED_MOTION ? "auto" : "smooth", block: "start" }); history.replaceState(null, "", hashPart); }
      }
    });
  });

  const showcaseRail = document.querySelector("#showcaseRail");
  const autoscroll = showcaseRail?.dataset.autoscroll === "true";
  let carouselTimer = null, isPaused = false;
  const halfScrollWidth = () => (showcaseRail ? showcaseRail.scrollWidth / 2 : 0);
  const normalizeCarousel = () => {
    if (!showcaseRail) return;
    const half = halfScrollWidth();
    if (showcaseRail.scrollLeft >= half) showcaseRail.scrollLeft -= half;
    if (showcaseRail.scrollLeft < 0) showcaseRail.scrollLeft += half;
  };
  const scrollShowcase = (direction) => {
    if (!showcaseRail) return;
    normalizeCarousel();
    const amount = Math.min(430, showcaseRail.clientWidth * 0.82);
    showcaseRail.scrollBy({ left: direction * amount, behavior: REDUCED_MOTION ? "auto" : "smooth" });
  };
  const startCarousel = () => {
    if (!showcaseRail || carouselTimer || !autoscroll) return;
    carouselTimer = window.setInterval(() => {
      if (isPaused) return;
      normalizeCarousel();
      showcaseRail.scrollBy({ left: 0.58, behavior: "auto" });
    }, 16);
  };
  const pauseCarousel = () => { isPaused = true; };
  const resumeCarousel = () => { isPaused = false; };

  document.querySelector("[data-showcase-prev]")?.addEventListener("click", () => scrollShowcase(-1));
  document.querySelector("[data-showcase-next]")?.addEventListener("click", () => scrollShowcase(1));
  document.querySelectorAll(".showcase-arrow").forEach((button) => {
    button.addEventListener("mouseenter", pauseCarousel);
    button.addEventListener("mouseleave", resumeCarousel);
    button.addEventListener("focus", pauseCarousel);
    button.addEventListener("blur", resumeCarousel);
  });

  let isDragging = false, isPointerDown = false, startX = 0, scrollStart = 0, movedDist = 0;
  showcaseRail?.addEventListener("mouseenter", pauseCarousel);
  showcaseRail?.addEventListener("mouseleave", () => { if (!isDragging) resumeCarousel(); });
  showcaseRail?.addEventListener("focusin", pauseCarousel);
  showcaseRail?.addEventListener("focusout", resumeCarousel);
  showcaseRail?.addEventListener("pointerdown", (event) => {
    // Salvo lo stato ma NON attivo il dragging ancora — aspetto un movimento vero
    isPointerDown = true; isDragging = false; movedDist = 0;
    pauseCarousel();
    startX = event.clientX;
    scrollStart = showcaseRail.scrollLeft;
  });
  showcaseRail?.addEventListener("pointermove", (event) => {
    if (!isPointerDown) return;
    const dx = event.clientX - startX;
    movedDist = Math.abs(dx);
    // Attiva il drag SOLO se il puntatore si è mosso di almeno 6px
    if (!isDragging && movedDist > 6) {
      isDragging = true;
      showcaseRail.classList.add("dragging");
      try { showcaseRail.setPointerCapture(event.pointerId); } catch (e) {}
    }
    if (isDragging) {
      showcaseRail.scrollLeft = scrollStart - dx;
      normalizeCarousel();
    }
  });
  const endDrag = () => {
    isPointerDown = false;
    // Ritardo la rimozione di .dragging di 50ms così l'evento click che segue vede stato pulito
    setTimeout(() => {
      isDragging = false;
      showcaseRail?.classList.remove("dragging");
      resumeCarousel();
    }, 50);
  };
  showcaseRail?.addEventListener("pointerup", endDrag);
  showcaseRail?.addEventListener("pointercancel", endDrag);
  showcaseRail?.addEventListener("pointerleave", endDrag);
  startCarousel();

  /* Click su pacchetto/marketing → preseleziona option nel form */
  document.querySelectorAll("[data-package], [data-marketing]").forEach((link) => {
    link.addEventListener("click", () => {
      const value = link.dataset.package || link.dataset.marketing;
      setTimeout(() => { const select = document.querySelector('select[name="package"]'); if (select) select.value = value; }, 120);
    });
  });

  // Il click sui lavori è gestito a livello globale (vedi setupGlobalWorkOpener sotto)

  /* Form contatti → email pronta */
  document.querySelector("#contactForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const data = Object.fromEntries(new FormData(form));
    const subject = encodeURIComponent(`Richiesta informazioni — ${data.package}`);
    const body = encodeURIComponent(`Nome: ${data.name}\nEmail: ${data.email}\nPacchetto/servizio: ${data.package}\n\nMessaggio:\n${data.message}\n\n— Inviato dal sito ${CONFIG.brand.name}`);
    document.querySelector("#contactForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const btn = form.querySelector("#contactSubmit");
  const result = form.querySelector("#contactResult");

  if (!form.checkValidity()) { form.reportValidity(); return; }

  const consent = form.querySelector('input[name="consent"]');
  if (!consent || !consent.checked) {
    if (result) {
      result.hidden = false;
      result.className = "contact-result error";
      result.textContent = "Devi accettare la Privacy Policy per inviare la richiesta.";
    }
    return;
  }

  const data = Object.fromEntries(new FormData(form));
  data.consent = true;

  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = "Invio in corso...";
  if (result) result.hidden = true;

  try {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const out = await res.json().catch(() => ({}));

    if (res.ok && out.ok) {
      if (result) {
        result.hidden = false;
        result.className = "contact-result success";
        result.innerHTML = "<strong>Richiesta inviata!</strong> Ti risponderemo entro 24 ore lavorative.";
      }
      form.reset();
    } else {
      throw new Error(out.error || "Errore " + res.status);
    }
  } catch (err) {
    console.error("[contact]", err);
    if (result) {
      result.hidden = false;
      result.className = "contact-result error";
      result.innerHTML = err.message + '<br><small>Puoi anche scriverci a <a href="mailto:' + CONFIG.brand.email + '">' + CONFIG.brand.email + '</a></small>';
    }
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
});
  });
}

/* ---------------- Cookie consent ---------------- */
const COOKIE_KEY = "meikasait_cookie_consent";
function readConsent() {
  try { const v = localStorage.getItem(COOKIE_KEY); if (v) return v; } catch (e) {}
  // back-compat con vecchio nome
  try { const v2 = localStorage.getItem("metara_cookie_consent"); if (v2) return v2; } catch (e) {}
  const m = document.cookie.match(new RegExp("(?:^|;\\s*)" + COOKIE_KEY + "=([^;]+)"));
  return m ? decodeURIComponent(m[1]) : null;
}
function writeConsent(value) {
  try { localStorage.setItem(COOKIE_KEY, value); } catch (e) {}
  try {
    const oneYear = 60 * 60 * 24 * 365;
    document.cookie = COOKIE_KEY + "=" + encodeURIComponent(value) + ";path=/;max-age=" + oneYear + ";SameSite=Lax";
  } catch (e) {}
}
function initCookie() {
  try {
    const banner = document.getElementById("cookieBanner");
    if (!banner) return;
    if (banner.dataset.bound === "1") return;
    banner.dataset.bound = "1";

    let consent = null;
    try { consent = readConsent(); } catch (e) { console.warn("[cookie] read fallito:", e); }
    banner.hidden = !!consent;
    if (consent) banner.style.display = "none";

    const close = (value) => {
      try { writeConsent(value); } catch (e) { console.warn("[cookie] write fallito:", e); }
      banner.hidden = true;
      banner.style.display = "none";
    };

    document.getElementById("cookieAccept")?.addEventListener("click", () => close("all"));
    document.getElementById("cookieReject")?.addEventListener("click", () => close("necessary"));
  } catch (e) {
    console.error("[cookie] initCookie crash:", e);
    const banner = document.getElementById("cookieBanner");
    if (banner) { banner.hidden = true; banner.style.display = "none"; }
  }
}

/* ---------------- Boot ---------------- */
function bootCookie() {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initCookie);
  else initCookie();
}
bootCookie();

/* ---------------- Handler globale: apri modale al click sui lavori ----------------
   Agganciato una sola volta al document. Funziona anche dopo re-render del DOM. */
function setupGlobalWorkOpener() {
  if (window.__meikasaitOpenerBound) return;
  window.__meikasaitOpenerBound = true;

  document.addEventListener("click", (ev) => {
    try {
      const trigger = ev.target && ev.target.closest && ev.target.closest("[data-work-open]");
      if (!trigger) return;
      ev.preventDefault();
      ev.stopPropagation();
      const slug = trigger.dataset.workOpen;
      console.log("[Meikasait] click → apro lavoro:", slug);
      if (slug) openWorkModal(slug);
    } catch (err) {
      console.error("[Meikasait] errore apertura modale:", err);
    }
  }, true);

  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") closeWorkModal();
    const active = document.activeElement;
    if (!active || !active.matches || !active.matches("[data-work-open]")) return;
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      const slug = active.dataset.workOpen;
      if (slug) openWorkModal(slug);
    }
  });

  console.log("[Meikasait] handler apertura lavori pronto ✓");
}
setupGlobalWorkOpener();

async function boot() {
  try {
    const res = await fetch("/data/content.json", { cache: "no-store" });
    if (res.ok) CONFIG = await res.json();
  } catch (e) {
    console.warn("[Meikasait] content.json non caricato, uso configurazione di fallback.", e);
  }
  render();
  initCookie();
}

boot();

/* Riasletta SPA navigation usando popstate (Back/Forward del browser) */
window.addEventListener("popstate", () => render());
