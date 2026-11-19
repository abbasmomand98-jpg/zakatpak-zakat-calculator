// ZakatPak DOM smoke test — run with: node dom-smoke.js
// Executes data.js + logic.js + app.js in a tiny fake DOM (vm sandbox)
// and asserts the page renders the canonical figures.
var fs = require("fs");
var vm = require("vm");
var assert = require("assert");

function FakeEl(tag) {
  this.tagName = (tag || "div").toUpperCase();
  this.children = [];
  this._html = "";
  this.textContent = "";
  this.value = "";
  this.checked = false;
  this.disabled = false;
  this.className = "";
  this.style = {};
  this.listeners = {};
  this.attributes = {};
  this.type = "";
}
FakeEl.prototype.addEventListener = function (ev, fn) {
  (this.listeners[ev] = this.listeners[ev] || []).push(fn);
};
FakeEl.prototype.appendChild = function (child) { this.children.push(child); return child; };
FakeEl.prototype.setAttribute = function (k, v) { this.attributes[k] = v; };
FakeEl.prototype.getAttribute = function (k) { return this.attributes[k]; };
Object.defineProperty(FakeEl.prototype, "innerHTML", {
  get: function () { return this._html; },
  set: function (v) { this._html = String(v); this.children = []; }
});

var byId = {};
function el(id) {
  if (!byId[id]) byId[id] = new FakeEl("div");
  return byId[id];
}
var documentStub = {
  getElementById: el,
  createElement: function (tag) { return new FakeEl(tag); }
};
var store = {};
var localStorageStub = {
  getItem: function (k) { return store[k] || null; },
  setItem: function (k, v) { store[k] = String(v); }
};
function fire(id, ev, arg) {
  (byId[id].listeners[ev] || []).forEach(function (fn) { fn(arg || {}); });
}
function fireEl(node, ev, arg) {
  (node.listeners[ev] || []).forEach(function (fn) { fn(arg || {}); });
}

var sandbox = { document: documentStub, localStorage: localStorageStub, console: console,
  Date: Date, setInterval: function () { return 0; }, clearInterval: function () {} };
sandbox.window = sandbox;
vm.createContext(sandbox);
// Pre-seed the fake DOM with the defaults index.html declares in markup
// (the fake DOM does not parse value/selected attributes).
el("cash-input").value = "850000";
el("bank-input").value = "1200000";
el("gold-input").value = "25";
el("silver-input").value = "0";
el("stock-input").value = "0";
el("debts-input").value = "150000";
el("charity-input").value = "";
el("pay-charity").value = "Noor Welfare Trust";
el("pay-amount").value = "21875";
el("pay-group").value = "The poor (fuqara)";
["data.js", "logic.js", "app.js"].forEach(function (f) {
  vm.runInContext(fs.readFileSync(f, "utf8"), sandbox, { filename: f });
});

var n = 0;
function eq(a, b, msg) { assert.strictEqual(a, b, msg); n++; }
function ok(v, msg) { assert.ok(v, msg); n++; }

// 1. Calculator tab is active on load; Ahmed Raza's figures render.
eq(el("section-calculator").style.display, "block", "calculator section shows on load");
ok(el("calc-result").innerHTML.indexOf("Rs 2,875,000") !== -1, "calc shows zakatable wealth Rs 2,875,000");
ok(el("calc-result").innerHTML.indexOf("Rs 71,875") !== -1, "calc shows Zakat Rs 71,875");
ok(el("calc-result").innerHTML.indexOf("Rs 241,504") !== -1, "calc names the silver nisab Rs 241,504");
eq(el("examples-list").children.length, 1, "worked example renders 1 row");
ok(el("examples-list").children[0].innerHTML.indexOf("Ahmed Raza") !== -1, "worked example names Ahmed Raza");
ok(el("examples-list").children[0].innerHTML.indexOf("Rs 71,875") !== -1, "worked example shows Zakat Rs 71,875");
eq(el("asset-list").children.length, 6, "asset breakdown renders 6 rows");
ok(el("asset-list").children[2].innerHTML.indexOf("Rs 975,000") !== -1, "gold row shows Rs 975,000");
ok(el("calc-summary").textContent.indexOf("19 Nov 2026") !== -1, "summary names 19 Nov 2026");

// 2. Change the gold: 0 g gold -> wealth Rs 1,900,000, Zakat Rs 47,500.
el("gold-input").value = "0";
fire("gold-input", "input");
ok(el("calc-result").innerHTML.indexOf("Rs 1,900,000") !== -1, "0 g gold drops wealth to Rs 1,900,000");
ok(el("calc-result").innerHTML.indexOf("Rs 47,500") !== -1, "0 g gold drops Zakat to Rs 47,500");
el("gold-input").value = "25";
fire("gold-input", "input");
ok(el("calc-result").innerHTML.indexOf("Rs 71,875") !== -1, "restoring 25 g restores Zakat Rs 71,875");

// 3. Below nisab: cash Rs 100,000, everything else 0 -> no Zakat.
el("cash-input").value = "100000";
el("bank-input").value = "0";
el("gold-input").value = "0";
el("debts-input").value = "0";
fire("cash-input", "input");
ok(el("calc-result").innerHTML.indexOf("Rs 0") !== -1, "Rs 100,000 wealth pays Rs 0 Zakat");
ok(el("nisab-box").innerHTML.indexOf("NO ZAKAT DUE YET") !== -1, "Rs 100,000 shows NO ZAKAT DUE YET");
el("cash-input").value = "850000";
el("bank-input").value = "1200000";
el("gold-input").value = "25";
el("debts-input").value = "150000";
fire("cash-input", "input");
ok(el("calc-result").innerHTML.indexOf("Rs 71,875") !== -1, "restoring Ahmed's assets restores Rs 71,875");

// 4. Nisab tab: gold nisab Rs 3,411,720, silver nisab Rs 241,504, 11.9x.
fire("tab-nisab", "click");
eq(el("section-nisab").style.display, "block", "nisab section shows on tab click");
eq(el("section-calculator").style.display, "none", "calculator section hides on tab click");
ok(el("nisab-box").innerHTML.indexOf("Rs 3,411,720") !== -1, "nisab names the gold nisab Rs 3,411,720");
ok(el("nisab-box").innerHTML.indexOf("Rs 241,504") !== -1, "nisab names the silver nisab Rs 241,504");
ok(el("nisab-box").innerHTML.indexOf("ZAKAT IS DUE") !== -1, "nisab says Zakat is due");
ok(el("nisab-compare").innerHTML.indexOf("11.9") !== -1, "wealth is 11.9x the silver nisab");

// 5. Charity tab: Noor verified, Quick flagged, unknown finds nothing.
fire("tab-charity", "click");
eq(el("section-charity").style.display, "block", "charity section shows on tab click");
eq(el("charity-list").children.length, 4, "charity list renders 4 sample charities");
ok(el("charity-list").children[0].innerHTML.indexOf("VERIFIED") !== -1, "first charity is VERIFIED");
ok(el("charity-list").children[2].innerHTML.indexOf("FLAGGED") !== -1, "third charity is FLAGGED");
el("charity-input").value = "noor";
fire("charity-btn", "click");
ok(el("charity-result").innerHTML.indexOf("VERIFIED") !== -1, "'noor' verifies Noor Welfare Trust");
ok(el("charity-result").innerHTML.indexOf("Noor Welfare Trust") !== -1, "result names Noor Welfare Trust");
el("charity-input").value = "quick";
fire("charity-btn", "click");
ok(el("charity-result").innerHTML.indexOf("FLAGGED") !== -1, "'quick' flags Quick Zakat Collectors");
el("charity-input").value = "unknown charity";
fire("charity-btn", "click");
ok(el("charity-result").innerHTML.indexOf("NO SAMPLE CHARITY") !== -1, "an unknown name shows no sample charity");
el("charity-input").value = "";
fire("charity-input", "input");
eq(el("charity-result").innerHTML, "", "clearing the search clears the result");

// 6. Tracker tab: Rs 50,000 of Rs 71,875 paid, 70%, Rs 21,875 left; 2 receipts.
fire("tab-tracker", "click");
eq(el("section-tracker").style.display, "block", "tracker section shows on tab click");
ok(el("tracker-progress").textContent.indexOf("Rs 50,000") !== -1, "tracker shows Rs 50,000 paid");
ok(el("tracker-progress").textContent.indexOf("70%") !== -1, "tracker shows 70% paid");
ok(el("tracker-progress").textContent.indexOf("Rs 21,875") !== -1, "tracker shows Rs 21,875 remaining");
eq(el("receipt-list").children.length, 2, "receipt list renders 2 receipts");
ok(el("receipt-list").children[0].innerHTML.indexOf("ZKT-2026-0001") !== -1, "first receipt is ZKT-2026-0001");
ok(el("receipt-list").children[1].innerHTML.indexOf("Rs 20,000") !== -1, "second receipt is Rs 20,000");

// 7. Record the remaining Rs 21,875 -> receipt ZKT-2026-0003, 100% paid.
fire("pay-btn", "click");
ok(el("pay-result").innerHTML.indexOf("ZKT-2026-0003") !== -1, "new payment gets receipt ZKT-2026-0003");
ok(el("pay-result").innerHTML.indexOf("Rs 21,875") !== -1, "new payment records Rs 21,875");
eq(el("receipt-list").children.length, 3, "receipt list grows to 3");
ok(el("tracker-progress").textContent.indexOf("100%") !== -1, "tracker now shows 100% paid");
ok(el("tracker-progress").textContent.indexOf("Rs 0") !== -1, "tracker now shows Rs 0 remaining");
ok((store["zakatpak-payments"] || "").indexOf("ZKT-2026-0003") !== -1, "new receipt persists in localStorage");

// 8. Guide tab: 8 mustahiqeen groups.
fire("tab-guide", "click");
eq(el("section-guide").style.display, "block", "guide section shows on tab click");
eq(el("guide-list").children.length, 8, "guide renders 8 mustahiqeen groups");
ok(el("guide-list").children[0].innerHTML.indexOf("The poor (fuqara)") !== -1, "group 1 is the poor");
ok(el("guide-list").children[7].innerHTML.indexOf("stranded traveller") !== -1, "group 8 is the stranded traveller");

// 9. Spotter tab: 5 questions, perfect score after correct answers.
fire("tab-spotter", "click");
eq(el("section-spotter").style.display, "block", "spotter section shows on tab click");
eq(el("spotter-quiz").children.length, 5, "spotter quiz renders 5 questions");
fire("spotter-btn", "click");
ok(el("spotter-result").innerHTML.indexOf("0 OF 5 CORRECT") !== -1, "no answers score 0 of 5");
var qs = el("spotter-quiz").children;
for (var i = 0; i < 4; i++) {
  fireEl(qs[i].children[1], "click"); // "Red flag" for the 4 real flags
}
fireEl(qs[4].children[2], "click"); // "Safe" for the safe habit
fire("spotter-btn", "click");
ok(el("spotter-result").innerHTML.indexOf("5 OF 5 CORRECT") !== -1, "correct answers score 5 of 5");
ok(el("spotter-result").innerHTML.indexOf("no receipt") !== -1, "spotter result explains the no-receipt flag");

// 10. Reset restores the canonical defaults.
fire("reset-demo", "click");
eq(el("section-calculator").style.display, "block", "reset returns to the calculator tab");
ok(el("calc-result").innerHTML.indexOf("Rs 71,875") !== -1, "reset restores Zakat Rs 71,875");
ok(el("tracker-progress").textContent.indexOf("Rs 50,000") !== -1, "reset restores Rs 50,000 paid");
ok(el("spotter-result").innerHTML === "", "reset clears the spotter result");
eq(el("receipt-list").children.length, 2, "reset restores 2 receipts");
eq(el("cash-input").value, "850000", "reset restores cash Rs 850,000");

console.log("\n" + n + " DOM assertions passed.");
