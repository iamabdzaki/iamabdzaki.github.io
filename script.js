const cases = {
  reconciliation: {
    tag: "Reconciliation & controls",
    sector: "Multinational retail",
    title: "Reconciling VAT against hundreds of billions of IDR in monthly sales",
    summary: "A high-volume retail environment requires accounting and tax data to remain aligned across trade sales, other income, property rental, and supporting transaction records.",
    outcome: "High-volume monthly close support",
    outcomeNote: "Reconciliation and financial adjustment work feeds month-end accuracy and group reporting.",
    role: "Reconcile VAT to sales data, investigate differences, and input, reconcile, and post financial adjustments through SAP and GMD.",
    method: ["Match accounting and transaction data", "Investigate exceptions and supporting records", "Post validated adjustments for close"]
  },
  controls: {
    tag: "Invoice & payment controls",
    sector: "Multinational retail",
    title: "Acting as the final control point before daily invoice payments",
    summary: "Before disbursement, invoices need consistent review of tax treatment, supporting documentation, and accounting alignment so exceptions are resolved before cash leaves the business.",
    outcome: "Pre-disbursement control",
    outcomeNote: "Daily invoice approvals combine document review, tax validation, and discrepancy resolution.",
    role: "Review invoice packages before payment approval, validate tax treatment and source documents, and resolve issues with the relevant teams.",
    method: ["Review invoice and supporting documents", "Validate treatment and accounting logic", "Resolve discrepancies before approval"]
  },
  systems: {
    tag: "ERP & process improvement",
    sector: "Retail & automotive",
    title: "Improving finance workflows across SAP, GMD, and Odoo",
    summary: "Reliable reporting depends on well-designed transaction logic. Across roles, system and process work has included financial adjustments, transaction mapping, Odoo tax logic, and cross-functional workflow redesign.",
    outcome: "Stronger data flow",
    outcomeNote: "System logic and process improvements reduced manual friction and improved control over transaction data.",
    role: "Translate accounting and tax requirements into practical system logic, transaction mappings, and review workflows.",
    method: ["Map current transaction flow", "Define logic and control requirements", "Test outputs and embed the improved workflow"]
  },
  audit: {
    tag: "Audit & documentation",
    sector: "Public company & consulting",
    title: "Building reconciliations and evidence packages that stand up to review",
    summary: "Audit support requires more than collecting files. Accounting records, tax positions, formal responses, and source evidence must connect into one coherent and traceable package.",
    outcome: "75% penalty reduction",
    outcomeNote: "Structured evidence and reconciliations contributed to a major reduction in assessed penalties.",
    role: "Prepare reconciliations, reports, formal responses, and indexed supporting evidence for financial audits, tax audits, objections, and appeals.",
    method: ["Reconcile balances and disputed items", "Map evidence to source records", "Prepare a clear review-ready package"]
  }
};

const expertise = {
  accounting: {
    icon: "◎",
    label: "Month-end and ledger support",
    title: "Accounting operations",
    copy: "Hands-on support for general ledger and tax adjustments, accrual-related work, month-end close, financial adjustments, cost documentation, and financial statement audit support.",
    chips: ["General ledger", "Adjustments", "Month-end support", "Accruals", "Audit support"]
  },
  reconciliation: {
    icon: "↔",
    label: "High-volume data review",
    title: "Reconciliations",
    copy: "Experience reconciling VAT to sales, withholding-tax transactions, accounting records, and supporting documents, with a focus on identifying exceptions and maintaining data integrity.",
    chips: ["VAT to sales", "WHT", "Account review", "Exception analysis", "Supporting documents"]
  },
  controls: {
    icon: "✓",
    label: "Transaction assurance",
    title: "Invoice & payment controls",
    copy: "Final-control review of invoice payments before disbursement, including tax validation, supporting-document checks, accounting treatment review, and discrepancy resolution.",
    chips: ["Invoice review", "Payment controls", "Tax validation", "Document checks", "Discrepancy resolution"]
  },
  systems: {
    icon: "⌁",
    label: "Reliable process design",
    title: "Systems & automation",
    copy: "Hands-on use of SAP, GMD, Odoo, QuickBooks Online, Xero, and Excel for financial adjustments, transaction mapping, workflow automation, reconciliation, and control improvement.",
    chips: ["SAP", "GMD", "Odoo", "QuickBooks Online", "Xero", "Excel"]
  },
  audit: {
    icon: "◇",
    label: "Review-ready work",
    title: "Audit & documentation",
    copy: "Preparation of financial-statement audit support, tax-audit schedules, reconciliations, formal reports, response letters, evidence packages, and due-diligence documentation.",
    chips: ["Financial audit", "Tax audit", "Due diligence", "Formal reports", "Evidence files"]
  },
  tax: {
    icon: "↗",
    label: "Compliance depth",
    title: "Tax & compliance",
    copy: "Deep experience across VAT, withholding tax, annual CIT support, Coretax, CbCR, DER, intercompany schedules, and recurring compliance controls for multinational and listed-company environments.",
    chips: ["VAT", "WHT", "CIT", "Coretax", "CbCR", "DER"]
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