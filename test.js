// ZakatPak smoke tests — run with: node test.js
// Every canonical figure used in the mockups, slides and copy is asserted here.
var assert = require("assert");
var fs = require("fs");
var data = require("./data.js");
var L = require("./logic.js");

var n = 0;

function eq(a, b, msg) { assert.strictEqual(a, b, msg); n++; }
function ok(v, msg) { assert.ok(v, msg); n++; }
function deep(a, b, msg) { assert.deepStrictEqual(a, b, msg); n++; }

// 1. Sample rates and the two nisabs.
deep(data.RATES, { goldPerGram: 39000, silverPerTola: 4600,
  tolaGrams: 11.6638, silverPerGram: 394.382, zakatRate: 0.025 },
     "rates: gold Rs 39,000/g, silver Rs 4,600/tola, Zakat 2.5%");
deep(data.NISAB, { goldGrams: 87.48, goldNisabPKR: 3411720,
  silverGrams: 612.36, silverNisabPKR: 241504,
  lunarYear: "one lunar year" },
     "nisab: gold 87.48 g, silver 612.36 g, held one lunar year");
eq(L.goldNisabPKR(data.NISAB, data.RATES), 3411720,
   "gold nisab: 87.48 g x Rs 39,000 = Rs 3,411,720");
eq(L.silverNisabPKR(data.NISAB, data.RATES), 241504,
   "silver nisab: 612.36 g x Rs 394.38 = Rs 241,504");

// 2. Gold and silver values.
eq(L.goldValue(25, data.RATES), 975000, "25 g gold is Rs 975,000");
eq(L.goldValue(0, data.RATES), 0, "0 g gold is Rs 0");
eq(L.goldValue(1, data.RATES), 39000, "1 g gold is Rs 39,000");
eq(L.silverValue(612.36, data.RATES), 241504, "612.36 g silver is the silver nisab, Rs 241,504");
eq(L.silverValue(0, data.RATES), 0, "0 g silver is Rs 0");

// 3. The worked example — Ahmed Raza.
deep(data.WORKED_EXAMPLE, { cash: 850000, bank: 1200000,
  goldGrams: 25, goldValue: 975000, silverGrams: 0, silverValue: 0,
  stock: 0, debts: 150000, wealth: 2875000, zakat: 71875,
  wealthVsSilverNisab: 11.9 },
     "Ahmed Raza: wealth Rs 2,875,000, Zakat Rs 71,875, 11.9x the silver nisab");
eq(L.zakatableWealth({ cash: 850000, bank: 1200000, goldGrams: 25,
  silverGrams: 0, stock: 0, debts: 150000 }, data.RATES), 2875000,
   "zakatable wealth: 850,000 + 1,200,000 + 975,000 - 150,000 = Rs 2,875,000");
eq(L.zakatableWealth({ cash: 0, bank: 0, goldGrams: 0, silverGrams: 0,
  stock: 0, debts: 50000 }, data.RATES), 0,
   "debts can never push wealth below zero");
eq(L.zakatableWealth({ cash: 100000, bank: 0, goldGrams: 0,
  silverGrams: 0, stock: 0, debts: 0 }, data.RATES), 100000,
   "cash alone counts in full");

// 4. Zakat: 2.5% above the silver nisab, Rs 0 below it.
eq(L.calcZakat(2875000, data.NISAB, data.RATES), 71875,
   "Rs 2,875,000 pays Rs 71,875 in Zakat");
eq(L.calcZakat(241504, data.NISAB, data.RATES), 6038,
   "exactly at the silver nisab, Zakat is Rs 6,038");
eq(L.calcZakat(241503, data.NISAB, data.RATES), 0,
   "one rupee below the silver nisab, no Zakat is due");
eq(L.calcZakat(100000, data.NISAB, data.RATES), 0,
   "Rs 100,000 is below nisab — no Zakat");
eq(L.calcZakat(0, data.NISAB, data.RATES), 0, "Rs 0 pays Rs 0");
eq(L.calcZakat(4000000, data.NISAB, data.RATES), 100000,
   "Rs 4,000,000 pays Rs 100,000 in Zakat");

// 5. Wealth against the silver nisab.
eq(L.wealthVsNisab(2875000, data.NISAB, data.RATES), 11.9,
   "Rs 2,875,000 is 11.9x the silver nisab");
eq(L.wealthVsNisab(241504, data.NISAB, data.RATES), 1,
   "exactly at nisab is 1x");
eq(L.wealthVsNisab(0, data.NISAB, data.RATES), 0, "Rs 0 is 0x the nisab");

// 6. Nisab verdicts.
deep(L.nisabStatus(2875000, data.NISAB, data.RATES),
  { due: true, aboveGold: false, aboveSilver: true,
    note: "Below the gold nisab but above the silver nisab — Zakat is due on the silver nisab." },
     "Ahmed: below gold nisab, above silver nisab, Zakat is due");
deep(L.nisabStatus(100000, data.NISAB, data.RATES),
  { due: false, aboveGold: false, aboveSilver: false,
    note: "Below both nisabs — no Zakat is due yet." },
     "Rs 100,000: below both nisabs, no Zakat");
deep(L.nisabStatus(4000000, data.NISAB, data.RATES),
  { due: true, aboveGold: true, aboveSilver: true,
    note: "Above BOTH nisabs — Zakat is due." },
     "Rs 4,000,000: above both nisabs, Zakat is due");

// 7. Payment tracker: Rs 50,000 paid, Rs 21,875 remaining.
deep(data.SEED_PAYMENTS, [
  { receipt: "ZKT-2026-0001", charity: "Noor Welfare Trust",
    amount: 30000, date: "12 Nov 2026", group: "The poor (fuqara)" },
  { receipt: "ZKT-2026-0002", charity: "Noor Welfare Trust",
    amount: 20000, date: "17 Nov 2026", group: "Those in debt (gharimeen)" }],
     "seed payments: ZKT-2026-0001 Rs 30,000 and ZKT-2026-0002 Rs 20,000");
eq(data.ZAKAT_DUE, 71875, "Zakat due is Rs 71,875");
eq(data.ZAKAT_PAID, 50000, "Zakat paid is Rs 50,000");
eq(data.ZAKAT_REMAINING, 21875, "Zakat remaining is Rs 21,875");
eq(L.totalPaid(data.SEED_PAYMENTS), 50000, "seed payments total Rs 50,000");
eq(L.remainingDue(data.ZAKAT_DUE, data.SEED_PAYMENTS), 21875,
   "remaining: 71,875 - 50,000 = Rs 21,875");
deep(L.paidProgress(data.ZAKAT_DUE, data.SEED_PAYMENTS),
  { paid: 50000, due: 71875, remaining: 21875, pct: 70 },
     "paid progress: Rs 50,000 of Rs 71,875 is 70%");
eq(L.nextReceipt(data.SEED_PAYMENTS), "ZKT-2026-0003",
   "next receipt after 0001 and 0002 is ZKT-2026-0003");
var copy = JSON.parse(JSON.stringify(data.SEED_PAYMENTS));
var added = L.addPayment(copy, "Noor Welfare Trust", 21875,
  "The poor (fuqara)", "19 Nov 2026");
eq(added.receipt, "ZKT-2026-0003", "new payment gets receipt ZKT-2026-0003");
eq(copy.length, 3, "adding a payment grows the list to 3");
eq(L.remainingDue(data.ZAKAT_DUE, copy), 0,
   "paying the remaining Rs 21,875 clears the Zakat");
eq(L.paidProgress(data.ZAKAT_DUE, copy).pct, 100,
   "paying in full is 100%");
eq(L.addPayment(copy, "", 1000, "The poor (fuqara)", "19 Nov 2026"), null,
   "a payment with no charity is rejected");
eq(L.addPayment(copy, "Noor Welfare Trust", 0, "The poor (fuqara)", "19 Nov 2026"), null,
   "a payment of Rs 0 is rejected");

// 8. Sample charities: 2 verified, 2 flagged.
eq(data.CHARITIES.length, 4, "charity list has 4 sample charities");
eq(data.CHARITIES.filter(function (c) { return c.verified; }).length, 2,
   "2 charities are verified");
eq(data.CHARITIES.filter(function (c) { return !c.verified; }).length, 2,
   "2 collectors are flagged");
eq(L.findCharity(data.CHARITIES, "noor").name, "Noor Welfare Trust",
   "'noor' finds Noor Welfare Trust");
eq(L.findCharity(data.CHARITIES, "noor").verified, true,
   "Noor Welfare Trust is verified");
eq(L.findCharity(data.CHARITIES, "quick").name, "Quick Zakat Collectors",
   "'quick' finds Quick Zakat Collectors");
eq(L.findCharity(data.CHARITIES, "quick").verified, false,
   "Quick Zakat Collectors is flagged");
eq(L.findCharity(data.CHARITIES, "QUICK").name, "Quick Zakat Collectors",
   "search is case-insensitive");
eq(L.findCharity(data.CHARITIES, "unknown"), null,
   "an unknown name finds nothing");
eq(L.findCharity(data.CHARITIES, ""), null, "an empty search finds nothing");

// 9. The 8 mustahiqeen.
eq(data.MUSTAHIQEEN.length, 8, "there are 8 mustahiqeen groups");
eq(data.MUSTAHIQEEN[0].title, "The poor (fuqara)", "group 1 is the poor");
eq(data.MUSTAHIQEEN[5].title, "Those in debt (gharimeen)", "group 6 is those in debt");
eq(data.MUSTAHIQEEN[7].title, "The stranded traveller (ibn-us-sabil)",
   "group 8 is the stranded traveller");

// 10. Red-flag spotter quiz: 4 red flags + 1 safe habit.
eq(data.SPOTTER_FLAGS.length, 5, "spotter quiz has 5 scenarios");
eq(data.SPOTTER_FLAGS.filter(function (f) { return f.isFlag; }).length, 4,
   "spotter quiz has 4 red flags");
eq(L.spotterAnswer(data.SPOTTER_FLAGS[0], true), true, "cash with no receipt is a red flag");
eq(L.spotterAnswer(data.SPOTTER_FLAGS[0], false), false, "calling it safe is wrong");
eq(L.spotterAnswer(data.SPOTTER_FLAGS[1], true), true, "WhatsApp-only charity is a red flag");
eq(L.spotterAnswer(data.SPOTTER_FLAGS[2], true), true, "orphans with no partner is a red flag");
eq(L.spotterAnswer(data.SPOTTER_FLAGS[3], true), true, "'the truck leaves tonight' is a red flag");
eq(L.spotterAnswer(data.SPOTTER_FLAGS[4], false), true, "checking the registration number is safe");
eq(L.spotterAnswer(data.SPOTTER_FLAGS[4], true), false, "calling the safe habit a flag is wrong");
var perfect = {};
data.SPOTTER_FLAGS.forEach(function (f) { perfect[f.id] = f.isFlag; });
var sPerfect = L.scoreQuiz(data.SPOTTER_FLAGS, perfect);
eq(sPerfect.correct, 5, "perfect answers score 5 of 5");
eq(sPerfect.perfect, true, "perfect answers are perfect");
var sNone = L.scoreQuiz(data.SPOTTER_FLAGS, {});
eq(sNone.correct, 0, "no answers score 0 of 5");
eq(sNone.perfect, false, "no answers are not perfect");
var sHalf = L.scoreQuiz(data.SPOTTER_FLAGS, { "cash-no-receipt": true, "whatsapp-only": true });
eq(sHalf.correct, 2, "two right answers score 2 of 5");

// 11. Pakistani digit grouping.
eq(L.formatPKR(500), "500", "Rs 500");
eq(L.formatPKR(6038), "6,038", "Rs 6,038");
eq(L.formatPKR(21875), "21,875", "Rs 21,875");
eq(L.formatPKR(50000), "50,000", "Rs 50,000");
eq(L.formatPKR(71875), "71,875", "Rs 71,875");
eq(L.formatPKR(241504), "241,504", "Rs 241,504");
eq(L.formatPKR(2875000), "2,875,000", "Rs 2,875,000");
eq(L.formatPKR(3411720), "3,411,720", "Rs 3,411,720");

// 12. Persona: the canonical facts.
deep(data.PERSONA, { name: "Ahmed Raza", age: 38, city: "Lahore",
  job: "Accounts officer", cash: 850000, bank: 1200000,
  goldGrams: 25, silverGrams: 0, stock: 0, debts: 150000,
  wealth: 2875000, zakat: 71875, paid: 50000, remaining: 21875 },
     "Ahmed Raza, 38, Lahore, accounts officer, wealth Rs 2,875,000, Zakat Rs 71,875, paid Rs 50,000, remaining Rs 21,875");

// 13. Every element id referenced by app.js exists in index.html.
var html = fs.readFileSync(__dirname + "/index.html", "utf8");
var appJs = fs.readFileSync(__dirname + "/app.js", "utf8");
var ids = {};
var m;
var idRe = /el\("([^"]+)"\)/g;
while ((m = idRe.exec(appJs)) !== null) ids[m[1]] = true;
var idList = Object.keys(ids);
ok(idList.length >= 20, "app.js references at least 20 element ids (" + idList.length + " found)");
idList.forEach(function (id) {
  ok(html.indexOf('id="' + id + '"') !== -1, "index.html defines id " + id);
});
["data.js", "logic.js", "app.js"].forEach(function (f) {
  ok(html.indexOf('src="' + f + '"') !== -1, "index.html loads " + f);
});
ok(html.indexOf('href="style.css"') !== -1, "index.html loads style.css");
// Tab buttons and sections exist for all six tabs.
["calculator", "nisab", "charity", "tracker", "guide", "spotter"].forEach(function (t) {
  ok(html.indexOf('id="tab-' + t + '"') !== -1, "index.html defines tab " + t);
  ok(html.indexOf('id="section-' + t + '"') !== -1, "index.html defines section " + t);
});
// No phone number and no leftover text from previous projects.
ok(html.indexOf("0342") === -1 && html.indexOf("9011609") === -1, "index.html carries no phone number");
["MobilePak", "NetPak", "Challan", "Kiraya", "Silinder", "RemitPak", "Adalat", "TaxPak"].forEach(function (word) {
  ok(html.indexOf(word) === -1, "index.html has no leftover " + word + " text");
});
// The pinned date is 19 Nov 2026.
ok(appJs.indexOf('"2026-11-19"') !== -1, "app.js pins today to 2026-11-19");

// 14. HTML tag balance: every opened tag is closed (void elements excluded).
var voidTags = { meta: 1, link: 1, input: 1, br: 1, hr: 1, img: 1 };
var stack = [];
var tagRe = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*\/?>/g;
while ((m = tagRe.exec(html)) !== null) {
  var tag = m[1].toLowerCase();
  var raw = m[0];
  if (voidTags[tag]) continue;
  if (raw[1] === "/") {
    eq(stack.pop(), tag, "closing tag </" + tag + "> matches the last opened tag");
  } else if (raw[raw.length - 2] !== "/") {
    stack.push(tag);
  }
}
eq(stack.length, 0, "no unclosed tags remain (stack empty)");

console.log("\n" + n + " assertions passed.");
