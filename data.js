// ZakatPak — Zakat Calculator & Verified Charity Finder (UX Concept).
// IMPORTANT: every figure, person, charity, rate and receipt below
// is SAMPLE data invented for this UX concept demo. These are NOT
// real people, real charities or real payments. Gold and silver
// rates are SAMPLE rates — always check today's market rate
// before you act on them. Zakat rules are shown in simplified
// form; for a real ruling, ask a qualified scholar.

// SAMPLE RATES — check today's market rate before you act.
//   Gold: Rs 39,000 per gram. Silver: Rs 4,600 per tola;
//   1 tola = 11.6638 g, so silver is Rs 394.38 per gram
//   (stored as 394.382 so the silver nisab rounds to Rs 241,504).
var RATES = {
  goldPerGram: 39000,
  silverPerTola: 4600,
  tolaGrams: 11.6638,
  silverPerGram: 394.382,
  zakatRate: 0.025
};

// NISAB — the minimum wealth above which Zakat is due, held for
// one full lunar year.
//   Gold nisab: 87.48 g x Rs 39,000 = Rs 3,411,720.
//   Silver nisab: 612.36 g x Rs 394.38 = Rs 241,504.
// ZakatPak uses the SILVER nisab (Rs 241,504) — the lower, more
// cautious threshold most Pakistani scholars apply.
var NISAB = {
  goldGrams: 87.48,
  goldNisabPKR: 3411720,
  silverGrams: 612.36,
  silverNisabPKR: 241504,
  lunarYear: "one lunar year"
};

// WORKED EXAMPLE — Ahmed Raza, 38, Lahore, accounts officer:
//   cash Rs 850,000 + bank savings Rs 1,200,000
//   + gold 25 g x Rs 39,000 = Rs 975,000
//   + silver 0 g = Rs 0 + business stock Rs 0
//   - debts Rs 150,000 = zakatable wealth Rs 2,875,000.
//   Zakat = 2.5% x Rs 2,875,000 = Rs 71,875.
// His wealth is BELOW the gold nisab (Rs 3,411,720) but 11.9x
// the silver nisab (Rs 241,504) — so Zakat IS due.
var WORKED_EXAMPLE = {
  cash: 850000, bank: 1200000, goldGrams: 25, goldValue: 975000,
  silverGrams: 0, silverValue: 0, stock: 0, debts: 150000,
  wealth: 2875000, zakat: 71875,
  wealthVsSilverNisab: 11.9
};

// SAMPLE CHARITIES — invented names, not real organisations.
//   VERIFIED: Noor Welfare Trust (sample) — registered, audited,
//   receipt for every payment. Sadaqa Food Bank (sample) —
//   registered, audited, receipt for every payment.
//   FLAGGED: Quick Zakat Collectors (sample) — WhatsApp only, no
//   registration, cash only, no receipt. Doorstep Zakat Drive
//   (sample) — cash only, no receipt, "pay now, the truck leaves
//   tonight" pressure.
var CHARITIES = [
  { id: "noor-welfare", name: "Noor Welfare Trust",
    tag: "sample charity", verified: true,
    status: "VERIFIED",
    points: ["Registration number shown on the profile",
             "Annual accounts published",
             "Receipt for every payment"],
    note: "Registered and audited. Every payment gets a receipt naming the mustahiq group it reached." },
  { id: "sadaqa-food", name: "Sadaqa Food Bank",
    tag: "sample charity", verified: true,
    status: "VERIFIED",
    points: ["Registration number shown on the profile",
             "Annual accounts published",
             "Receipt for every payment"],
    note: "Registered and audited. Food parcels for the poor and the needy, with receipts." },
  { id: "quick-collectors", name: "Quick Zakat Collectors",
    tag: "sample collector", verified: false,
    status: "FLAGGED",
    points: ["WhatsApp only — no office, no registration",
             "Cash only — no receipt, no accounts",
             "\u201cPay now, the truck leaves tonight\u201d"],
    note: "No registration number, no accounts, no receipt. Do not pay — a real charity never rushes you." },
  { id: "doorstep-drive", name: "Doorstep Zakat Drive",
    tag: "sample collector", verified: false,
    status: "FLAGGED",
    points: ["Cash only — no receipt, no accounts",
             "No named partner, no published accounts",
             "Collector cannot say which mustahiq group it reaches"],
    note: "Knocks at the door in the winter drives and takes cash. No receipt means no proof your Zakat was paid." }
];

// SAMPLE PAYMENTS — Ahmed's two receipted payments against his
// Rs 71,875 Zakat: Rs 30,000 + Rs 20,000 = Rs 50,000 paid (70%),
// Rs 21,875 remaining.
var SEED_PAYMENTS = [
  { receipt: "ZKT-2026-0001", charity: "Noor Welfare Trust",
    amount: 30000, date: "12 Nov 2026", group: "The poor (fuqara)" },
  { receipt: "ZKT-2026-0002", charity: "Noor Welfare Trust",
    amount: 20000, date: "17 Nov 2026", group: "Those in debt (gharimeen)" }
];
var ZAKAT_DUE = 71875;
var ZAKAT_PAID = 50000;
var ZAKAT_REMAINING = 21875;

// THE 8 MUSTAHIQEEN — the groups Zakat may go to.
var MUSTAHIQEEN = [
  { id: "fuqara", title: "The poor (fuqara)",
    detail: "People who have almost nothing and cannot meet their basic needs." },
  { id: "masakin", title: "The needy (masakin)",
    detail: "People who have something, but not enough to live on." },
  { id: "amileen", title: "Those who collect and distribute Zakat (amileen)",
    detail: "The workers who collect Zakat and deliver it to the people it is owed to." },
  { id: "muallafat", title: "Those whose hearts are to be reconciled (muallafat-ul-quloob)",
    detail: "People being drawn to Islam, supported so their hearts stay firm." },
  { id: "riqab", title: "Freeing captives (riqab)",
    detail: "Freeing people from slavery and captivity." },
  { id: "gharimeen", title: "Those in debt (gharimeen)",
    detail: "People crushed by a debt they took on for a genuine need and cannot repay." },
  { id: "fisabilillah", title: "In the cause of Allah (fi sabilillah)",
    detail: "Work done for Allah's sake — defending and spreading the faith." },
  { id: "ibnusabil", title: "The stranded traveller (ibn-us-sabil)",
    detail: "A traveller cut off from their money, far from home." }
];

// RED-FLAG SPOTTER: 4 red flags, plus one safe habit as a control.
//   1. Collector asks for cash with no receipt.
//   2. "Charity" has no registration number and no office —
//      WhatsApp only.
//   3. Collector promises your Zakat will reach orphans abroad
//      but names no partner and shows no accounts.
//   4. Pressure: "pay now, the truck leaves tonight" — real
//      charities never rush you.
//   Safe habit: ask for the registration number and check it
//   before you pay.
var SPOTTER_FLAGS = [
  { id: "cash-no-receipt", scenario: "A collector asks for cash, no receipt, no registration.",
    isFlag: true, why: "RED FLAG — a real charity gives a receipt and a registration number. Cash with no receipt is no proof your Zakat was ever paid." },
  { id: "whatsapp-only", scenario: "A \u201ccharity\u201d has no registration number and no office — WhatsApp only.",
    isFlag: true, why: "RED FLAG — a registered charity has a registration number and an office you can check. WhatsApp-only means nobody to hold to account." },
  { id: "orphans-no-partner", scenario: "A collector promises your Zakat will reach orphans abroad but names no partner and shows no accounts.",
    isFlag: true, why: "RED FLAG — a real charity names its partner and publishes accounts. A promise with no name and no accounts is a story, not a charity." },
  { id: "truck-tonight", scenario: "The collector says \u201cpay now, the truck leaves tonight\u201d.",
    isFlag: true, why: "RED FLAG — real charities never rush you. Pressure is how fake collectors stop you checking the registration number." },
  { id: "check-registration", scenario: "You ask for the registration number and check it before you pay.",
    isFlag: false, why: "SAFE — asking for the registration number and checking it takes a minute and tells you the truth before any money moves. That is exactly what ZakatPak\u2019s verifier does." }
];

// PERSONA: Ahmed Raza, 38, Lahore, accounts officer. He has
// never worked out his Zakat — he guesses, and hands cash to
// whoever knocks at the door in the winter charity drives.
// Illustrative proto-persona — a design hypothesis, not an
// interviewed participant.
var PERSONA = { name: "Ahmed Raza", age: 38, city: "Lahore",
  job: "Accounts officer", cash: 850000, bank: 1200000,
  goldGrams: 25, silverGrams: 0, stock: 0, debts: 150000,
  wealth: 2875000, zakat: 71875, paid: 50000, remaining: 21875 };

if (typeof module !== "undefined") {
  module.exports = { RATES: RATES, NISAB: NISAB,
    WORKED_EXAMPLE: WORKED_EXAMPLE, CHARITIES: CHARITIES,
    SEED_PAYMENTS: SEED_PAYMENTS, ZAKAT_DUE: ZAKAT_DUE,
    ZAKAT_PAID: ZAKAT_PAID, ZAKAT_REMAINING: ZAKAT_REMAINING,
    MUSTAHIQEEN: MUSTAHIQEEN, SPOTTER_FLAGS: SPOTTER_FLAGS,
    PERSONA: PERSONA };
}
