// Navbar shadow on scroll. Single passive listener, single property read,
// no layout work — won't trigger forced reflow.
const navbar = document.getElementById('navbar');

window.addEventListener(
  'scroll',
  () => navbar.classList.toggle('scrolled', window.scrollY > 50),
  { passive: true }
);

// Active nav link tracking via IntersectionObserver. The rootMargin defines
// a thin horizontal band ~30% from the top of the viewport — the section
// whose content sits in that band is the "current" one. No offsetTop reads.
const sections = document.querySelectorAll('section[id]');
const navLinkBySection = new Map(
  [...sections].map((section) => [
    section,
    document.querySelector(`.nav-link[href="#${section.id}"]`),
  ])
);

const navObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const link = navLinkBySection.get(entry.target);
      if (!link) return;
      link.classList.toggle('active', entry.isIntersecting);
    });
  },
  { rootMargin: '-15% 0px -50% 0px' }
);

sections.forEach((section) => navObserver.observe(section));

// Mobile nav: open/close + focus trap via inert on the rest of the page.
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const navClose = document.getElementById('navClose');
const inertTargets = [document.querySelector('main'), document.querySelector('footer')].filter(Boolean);

function setNavOpen(open) {
  navToggle.classList.toggle('active', open);
  navMenu.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
  inertTargets.forEach((el) => el.toggleAttribute('inert', open));
}

navToggle.addEventListener('click', () => setNavOpen(!navMenu.classList.contains('open')));
navClose.addEventListener('click', () => setNavOpen(false));

document.querySelectorAll('.nav-link').forEach((link) => {
  link.addEventListener('click', () => setNavOpen(false));
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && navMenu.classList.contains('open')) {
    setNavOpen(false);
    navToggle.focus();
  }
});

// Reset the mobile menu once the viewport grows past the nav breakpoint
// (must match the CSS hamburger breakpoint of 1024px).
window.matchMedia('(min-width: 1025px)').addEventListener('change', (e) => {
  if (e.matches) setNavOpen(false);
});

// Reveal-on-scroll for content blocks.
const revealTargets = document.querySelectorAll(
  '.about-text, .about-image, .service-card, .gallery-item, .review-card, .info-card, .contact-form-wrap'
);

revealTargets.forEach((el) => el.classList.add('fade-in'));

const revealObserver = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

revealTargets.forEach((el) => revealObserver.observe(el));

// Contact form: AJAX submit to FormSubmit, swap in a success card on 2xx.
const contactForm = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(contactForm);
  const submitBtn = contactForm.querySelector('button[type="submit"]');
  const originalLabel = submitBtn.textContent;

  submitBtn.textContent = 'Sending...';
  submitBtn.disabled = true;

  fetch(contactForm.action, {
    method: 'POST',
    body: formData,
    headers: { Accept: 'application/json' },
  })
    .then((response) => {
      if (response.ok) {
        contactForm.style.display = 'none';
        formSuccess.style.display = 'block';
      } else {
        throw new Error('Submission failed');
      }
    })
    .catch(() => {
      submitBtn.textContent = 'Error — Try Again';
      submitBtn.disabled = false;
      setTimeout(() => {
        submitBtn.textContent = originalLabel;
      }, 3000);
    });
});

// Horizontal scroll carousels: shared behavior for reviews + gallery.
function bindCarousel(trackSelector, leftBtnSelector, rightBtnSelector) {
  const track = document.querySelector(trackSelector);
  const left = document.querySelector(leftBtnSelector);
  const right = document.querySelector(rightBtnSelector);
  if (!track || !left || !right) return;

  const firstCard = track.firstElementChild;
  const gap = parseFloat(getComputedStyle(track).columnGap) || 24;
  const step = firstCard ? firstCard.getBoundingClientRect().width + gap : 320;

  left.addEventListener('click', () => track.scrollBy({ left: -step, behavior: 'smooth' }));
  right.addEventListener('click', () => track.scrollBy({ left: step, behavior: 'smooth' }));
}

bindCarousel('.reviews-track', '.carousel-btn-left', '.carousel-btn-right');
bindCarousel('.gallery-track', '.gallery-btn-left', '.gallery-btn-right');

// ===== JUNK REMOVAL ESTIMATE CALCULATOR =====
// ⚠️  PLACEHOLDER PRICING — these are Central-Florida MARKET ESTIMATES (Orlando /
//     Kissimmee, mid-2026), NOT Aventis's confirmed rates. Review with Zack and
//     adjust before relying on them. This config is the ONLY place to edit
//     prices, weights, or items; the calculator builds its UI and math from it.
//
//     How the math works: item/load `min`/`max` are the SERVICE portion
//     (labor + hauling) only. On top of that the calculator adds travel/fuel
//     (by distance band) and a disposal fee (item/load `lbs` ÷ 2000 × dump
//     rate), so the customer always sees an all-in total with nothing hidden.
const ESTIMATOR = {
  currency: '$',
  minServiceCharge: 75,  // floor on the labor/haul portion for item jobs
  dumpFeePerTon: 42,     // disposal pass-through (≈ $0.021/lb) — per Aventis
  hazard: { min: 25, max: 75 }, // added handling when hazardous/special items
  // Travel/fuel by rough round-trip distance from the Kissimmee base. The whole
  // Orlando metro is local to Aventis, so it's one band; farther jobs are the other.
  distance: [
    { id: 'metro', label: 'Orlando metro area',   min: 15, max: 25 },
    { id: 'far',   label: 'Farther out (30+ mi)', min: 45, max: 75 },
  ],
  // min/max = service $ (labor + hauling); lbs = typical weight → disposal fee.
  items: [
    { id: 'sofa',      label: 'Sofa / couch',           min: 75, max: 140, lbs: 120 },
    { id: 'loveseat',  label: 'Loveseat / armchair',    min: 55, max: 100, lbs: 80 },
    { id: 'mattress',  label: 'Mattress / box spring',  min: 50, max: 95,  lbs: 60 },
    { id: 'fridge',    label: 'Refrigerator / freezer', min: 90, max: 170, lbs: 200 },
    { id: 'washer',    label: 'Washer / dryer',         min: 60, max: 120, lbs: 150 },
    { id: 'appliance', label: 'Stove / dishwasher',     min: 50, max: 100, lbs: 120 },
    { id: 'tv',        label: 'TV / electronics',       min: 30, max: 75,  lbs: 50 },
    { id: 'dresser',   label: 'Dresser / cabinet',      min: 45, max: 95,  lbs: 100 },
    { id: 'table',     label: 'Table / desk',           min: 45, max: 95,  lbs: 90 },
    { id: 'exercise',  label: 'Treadmill / gym equip.', min: 70, max: 140, lbs: 200 },
    { id: 'yard',      label: 'Yard waste (per pile)',  min: 55, max: 120, lbs: 150 },
    { id: 'misc',      label: 'Boxes / bags of junk',   min: 25, max: 55,  lbs: 40 },
  ],
  loads: [
    { id: 'min',     label: 'Minimum load', desc: 'A few small items',          min: 80,  max: 115, lbs: 150 },
    { id: 'eighth',  label: '⅛ truck',      desc: 'A small pickup-bed worth',   min: 110, max: 170, lbs: 350 },
    { id: 'quarter', label: '¼ truck',      desc: 'A single room of items',     min: 165, max: 250, lbs: 700 },
    { id: 'half',    label: '½ truck',      desc: 'A garage or large room',     min: 265, max: 375, lbs: 1400 },
    { id: 'threeq',  label: '¾ truck',      desc: 'A multi-room cleanout',      min: 375, max: 500, lbs: 2100 },
    { id: 'full',    label: 'Full truck',   desc: 'A whole-home or estate job', min: 460, max: 600, lbs: 2800 },
  ],
};

const estCard = document.querySelector('.estimator-card');
if (estCard) {
  const fmt = (n) => ESTIMATOR.currency + Math.round(n).toLocaleString('en-US');
  const range = (lo, hi) => `${fmt(lo)}–${fmt(hi)}`;
  const disposalFor = (lbs) => (lbs / 2000) * ESTIMATOR.dumpFeePerTon;
  const itemsGrid = document.getElementById('estItemsGrid');
  const loadsGrid = document.getElementById('estLoadsGrid');
  const resultEl = document.getElementById('estResultValue');
  const breakdownEl = document.getElementById('estBreakdown');
  const laborLineEl = document.getElementById('estLaborLine');
  const feesLineEl = document.getElementById('estFeesLine');
  const hazRowEl = document.getElementById('estHazRow');
  const hazLineEl = document.getElementById('estHazLine');
  const hazNoteEl = document.getElementById('estHazNote');
  const distGroup = document.getElementById('estDistanceGroup');
  const hazardEl = document.getElementById('estHazard');
  const quantities = {};
  let selectedLoad = null;
  let selectedDistance = ESTIMATOR.distance[0].id;
  let mode = 'items';

  // Build the distance toggle from config (config stays the source of truth).
  ESTIMATOR.distance.forEach((d, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'est-dist-btn';
    btn.dataset.id = d.id;
    btn.textContent = d.label;
    btn.setAttribute('aria-pressed', String(i === 0));
    distGroup.appendChild(btn);
  });
  const currentDistance = () =>
    ESTIMATOR.distance.find((d) => d.id === selectedDistance) || ESTIMATOR.distance[0];
  const hazardCost = () => (hazardEl.checked ? ESTIMATOR.hazard : { min: 0, max: 0 });

  // Build the item rows from config.
  ESTIMATOR.items.forEach((item) => {
    quantities[item.id] = 0;
    const row = document.createElement('div');
    row.className = 'est-item';
    row.innerHTML =
      `<span class="est-item-label">${item.label}</span>` +
      `<div class="est-stepper">` +
        `<button type="button" class="est-step" data-act="dec" data-id="${item.id}" aria-label="Remove one ${item.label}">−</button>` +
        `<span class="est-qty" id="qty-${item.id}" aria-live="polite" aria-label="${item.label} quantity">0</span>` +
        `<button type="button" class="est-step" data-act="inc" data-id="${item.id}" aria-label="Add one ${item.label}">+</button>` +
      `</div>`;
    itemsGrid.appendChild(row);
  });

  // Build the load options from config.
  ESTIMATOR.loads.forEach((load) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'est-load';
    btn.dataset.id = load.id;
    btn.setAttribute('aria-pressed', 'false');
    btn.innerHTML =
      `<span class="est-load-name">${load.label}</span>` +
      `<span class="est-load-desc">${load.desc}</span>` +
      `<span class="est-load-price">${fmt(load.min)}–${fmt(load.max)}</span>`;
    loadsGrid.appendChild(btn);
  });

  // The service portion (labor + hauling) + weight for the current selection.
  const serviceTotal = () => {
    if (mode === 'items') {
      let min = 0, max = 0, lbs = 0, count = 0;
      ESTIMATOR.items.forEach((it) => {
        const q = quantities[it.id];
        min += it.min * q; max += it.max * q; lbs += it.lbs * q; count += q;
      });
      if (!count) return null;
      return {
        min: Math.max(min, ESTIMATOR.minServiceCharge),
        max: Math.max(max, ESTIMATOR.minServiceCharge),
        lbs,
      };
    }
    const load = ESTIMATOR.loads.find((l) => l.id === selectedLoad);
    return load ? { min: load.min, max: load.max, lbs: load.lbs } : null;
  };

  const recalc = () => {
    const dist = currentDistance();
    const haz = hazardCost();

    // Keep each load card's price all-in (service + travel + disposal + hazard)
    // so the card you tap matches the total you get.
    [...loadsGrid.children].forEach((btn) => {
      const load = ESTIMATOR.loads.find((l) => l.id === btn.dataset.id);
      if (!load) return;
      const disp = disposalFor(load.lbs);
      const priceEl = btn.querySelector('.est-load-price');
      if (priceEl) {
        priceEl.textContent = range(load.min + dist.min + disp + haz.min,
                                    load.max + dist.max + disp + haz.max);
      }
    });

    hazNoteEl.hidden = !hazardEl.checked;

    const svc = serviceTotal();
    if (!svc) {
      resultEl.textContent = '—';
      breakdownEl.hidden = true;
      return;
    }
    const disp = disposalFor(svc.lbs);
    const feesMin = dist.min + disp;
    const feesMax = dist.max + disp;

    resultEl.textContent = `${fmt(svc.min + feesMin + haz.min)} – ${fmt(svc.max + feesMax + haz.max)}`;
    laborLineEl.textContent = range(svc.min, svc.max);
    feesLineEl.textContent = range(feesMin, feesMax);
    if (hazardEl.checked) {
      hazLineEl.textContent = '+' + range(haz.min, haz.max);
      hazRowEl.hidden = false;
    } else {
      hazRowEl.hidden = true;
    }
    breakdownEl.hidden = false;
  };

  // Steppers (delegated).
  itemsGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.est-step');
    if (!btn) return;
    const id = btn.dataset.id;
    quantities[id] = Math.max(0, quantities[id] + (btn.dataset.act === 'inc' ? 1 : -1));
    document.getElementById('qty-' + id).textContent = quantities[id];
    recalc();
  });

  // Load selection (single-choice).
  loadsGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.est-load');
    if (!btn) return;
    selectedLoad = btn.dataset.id;
    [...loadsGrid.children].forEach((c) => c.setAttribute('aria-pressed', String(c === btn)));
    recalc();
  });

  // Tabs.
  const tabItems = document.getElementById('tab-items');
  const tabLoad = document.getElementById('tab-load');
  const panelItems = document.getElementById('panel-items');
  const panelLoad = document.getElementById('panel-load');

  const setTab = (m) => {
    mode = m;
    const itemsActive = m === 'items';
    tabItems.setAttribute('aria-selected', String(itemsActive));
    tabLoad.setAttribute('aria-selected', String(!itemsActive));
    tabItems.tabIndex = itemsActive ? 0 : -1;
    tabLoad.tabIndex = itemsActive ? -1 : 0;
    panelItems.hidden = !itemsActive;
    panelLoad.hidden = itemsActive;
    recalc();
  };

  tabItems.addEventListener('click', () => setTab('items'));
  tabLoad.addEventListener('click', () => setTab('load'));
  [tabItems, tabLoad].forEach((tab) => {
    tab.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const next = tab === tabItems ? tabLoad : tabItems;
      setTab(next === tabItems ? 'items' : 'load');
      next.focus();
    });
  });

  // Distance + hazardous-items controls recompute the estimate.
  distGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('.est-dist-btn');
    if (!btn) return;
    selectedDistance = btn.dataset.id;
    [...distGroup.children].forEach((c) => c.setAttribute('aria-pressed', String(c === btn)));
    recalc();
  });
  hazardEl.addEventListener('change', recalc);

  // Send the selection into the contact form.
  document.getElementById('estSendBtn').addEventListener('click', () => {
    let summary;
    if (mode === 'items') {
      const lines = ESTIMATOR.items
        .filter((it) => quantities[it.id] > 0)
        .map((it) => `- ${it.label} × ${quantities[it.id]}`);
      summary = lines.length ? 'Items to remove:\n' + lines.join('\n') : "I'd like a junk removal quote.";
    } else {
      const load = ESTIMATOR.loads.find((l) => l.id === selectedLoad);
      summary = load ? `Estimated job size: ${load.label} (${load.desc})` : "I'd like a junk removal quote.";
    }
    const dist = currentDistance();
    const totalText = resultEl.textContent;
    const hasTotal = totalText && totalText !== '—';
    const msg = document.getElementById('message');
    if (msg) {
      msg.value = summary +
        `\n\nDistance from you: ${dist.label}` +
        (hazardEl.checked ? '\n⚠️ Load includes hazardous / special items' : '') +
        (hasTotal ? `\n\nEstimated total: ${totalText}` : '') +
        '\n\n(Sent from the website estimate calculator — please confirm exact pricing.)';
    }
    document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => { const n = document.getElementById('name'); if (n) n.focus(); }, 600);
  });

  recalc();
}
