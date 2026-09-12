const cases = {
  audit: {
    tag: "Audit & dispute",
    sector: "Publicly listed automotive group",
    title: "Reducing an assessed tax audit penalty by 75%",
    summary: "A high-value assessment required a response that connected accounting records, tax positions, and supporting evidence into one consistent defense.",
    outcome: "IDR 20B → IDR 5B",
    outcomeNote: "Assessed penalty reduced through structured evidence and dispute management.",
    role: "Led the reconciliation, evidence mapping, response preparation, and dispute-management process.",
    method: ["Isolate each disputed adjustment", "Trace evidence to source records", "Build a consistent defense narrative"]
  },
  planning: {
    tag: "Tax planning & controls",
    sector: "Publicly listed automotive group",
    title: "Halving annual corporate tax liability through compliant planning",
    summary: "The opportunity was not a single calculation. It required stronger reconciliation logic, eligible tax-credit capture, and documentation that held together across two entities.",
    outcome: "IDR 50B → IDR 25B",
    outcomeNote: "Annual corporate tax liability reduced by 50% through compliant planning improvements.",
    role: "Supervised the tax team, reviewed the underlying transactions, and strengthened VAT-to-sales reconciliation controls.",
    method: ["Map liability drivers", "Validate treatment and supporting files", "Embed controls into the monthly process"]
  },
  automation: {
    tag: "Automation & data",
    sector: "Automotive tax operations",
    title: "Turning thousands of tax documents into a usable workflow",
    summary: "A repetitive, document-heavy process was slowing reconciliation and review. The solution converted PDF-based records into structured Excel data for faster control and follow-up.",
    outcome: "3,000+ documents",
    outcomeNote: "A repeatable PDF-to-Excel workflow improved processing efficiency by approximately 50%.",
    role: "Designed the workflow around the tax team’s review needs and used reconciliation formulas to make exceptions visible.",
    method: ["Standardize source documents", "Extract and structure key fields", "Reconcile exceptions before reporting"]
  },
  coretax: {
    tag: "Transformation & readiness",
    sector: "National retail operation",
    title: "Leading a company-wide Coretax transition",
    summary: "A regulatory system change affected VAT tariff logic and invoice-data requirements across teams. Readiness depended on translating tax rules into operational data requirements.",
    outcome: "Company-wide rollout",
    outcomeNote: "VAT tariff logic and tax-invoice data requirements were redesigned for the transition.",
    role: "Led the tax workstream, defined required data changes, and coordinated the translation of tax requirements into process updates.",
    method: ["Identify rule and data gaps", "Redesign VAT and invoice logic", "Align stakeholders on the new workflow"]
  }
};

const expertise = {
  international: {
    icon: "↗",
    label: "Cross-border obligations",
    title: "International tax",
    copy: "Practical management of cross-border withholding tax, PPh 26, Double Tax Agreement application, offshore VAT, and Indonesian CIT and VAT implications.",
    chips: ["PPh 26", "DTA", "Offshore VAT", "CIT", "Cross-border documentation"]
  },
  transfer: {
    icon: "◎",
    label: "Intercompany readiness",
    title: "Transfer pricing",
    copy: "Preparation and coordination of Country-by-Country Reporting, Debt-to-Equity Ratio schedules, intercompany schedules, nominative lists, and supporting multinational documentation.",
    chips: ["CbCR", "DER", "Intercompany schedules", "Nominative lists", "Supporting documentation"]
  },
  dispute: {
    icon: "◇",
    label: "Defensible positions",
    title: "Audit & dispute",
    copy: "Experience across audit defense, objections, appeals, formal responses, evidence files, written submissions, and tax court preparation in both consulting and in-house roles.",
    chips: ["Tax audit", "Objection", "Appeal", "Evidence index", "Tax court support"]
  },
  compliance: {
    icon: "✓",
    label: "End-to-end delivery",
    title: "Tax compliance",
    copy: "Management and supervision of VAT, PPh Articles 21, 23, 4(2), and 26, annual CIT returns, offshore VAT, reconciliations, filings, and deadline controls across multiple entities.",
    chips: ["VAT", "PPh 21", "PPh 23", "PPh 4(2)", "PPh 26", "Annual CIT"]
  },
  systems: {
    icon: "⌁",
    label: "Reliable tax data",
    title: "Systems & controls",
    copy: "Hands-on work with SAP, GMD, Odoo, Coretax, QuickBooks Online, Xero, and advanced Excel to connect accounting data with tax reporting, controls, and decision-ready analysis.",
    chips: ["SAP", "GMD", "Odoo", "Coretax", "QuickBooks", "Xero", "Advanced Excel"]
  }
};

const qs = (selector, context = document) => context.querySelector(selector);
const qsa = (selector, context = document) => [...context.querySelectorAll(selector)];

function setCase(key) {
  const item = cases[key];
  if (!item) return;

  qsa(".case-tab").forEach((button) => {
    const active = button.dataset.case === key;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });

  const panel = qs("#case-panel");
  panel.classList.remove("is-switching");
  void panel.offsetWidth;
  panel.classList.add("is-switching");

  qs("#case-tag").textContent = item.tag;
  qs("#case-sector").textContent = item.sector;
  qs("#case-title").textContent = item.title;
  qs("#case-summary").textContent = item.summary;
  qs("#case-outcome").textContent = item.outcome;
  qs("#case-outcome-note").textContent = item.outcomeNote;
  qs("#case-role").textContent = item.role;
  qs("#case-method").innerHTML = item.method
    .map((step, index) => `<li><span>${String(index + 1).padStart(2, "0")}</span>${step}</li>`)
    .join("");
}

function setExpertise(key) {
  const item = expertise[key];
  if (!item) return;

  qsa(".expertise-tab").forEach((button) => {
    const active = button.dataset.expertise === key;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });

  qs("#expertise-icon").textContent = item.icon;
  qs("#expertise-label").textContent = item.label;
  qs("#expertise-detail-title").textContent = item.title;
  qs("#expertise-copy").textContent = item.copy;
  qs("#expertise-chips").innerHTML = item.chips.map((chip) => `<span>${chip}</span>`).join("");
}

qsa(".case-tab").forEach((button) => button.addEventListener("click", () => setCase(button.dataset.case)));
qsa(".expertise-tab").forEach((button) => button.addEventListener("click", () => setExpertise(button.dataset.expertise)));

const revealTargets = qsa(".metric-card, .case-explorer, .expertise-layout, .role-card, .credentials-card");
revealTargets.forEach((element) => element.classList.add("reveal"));

if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: .12 });
  revealTargets.forEach((element) => revealObserver.observe(element));
} else {
  revealTargets.forEach((element) => element.classList.add("is-visible"));
}

const counters = qsa(".counter");
function animateCounter(element) {
  const target = Number(element.dataset.target);
  const duration = 950;
  const start = performance.now();
  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = Math.round(target * eased).toLocaleString("en-US");
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

if ("IntersectionObserver" in window) {
  const counterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateCounter(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: .65 });
  counters.forEach((counter) => counterObserver.observe(counter));
}

const sections = qsa("main section[id]");
const navLinks = qsa(".main-nav a");
if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`));
    });
  }, { rootMargin: "-30% 0px -60%", threshold: 0 });
  sections.forEach((section) => sectionObserver.observe(section));
}

qs("#year").textContent = String(new Date().getFullYear());
