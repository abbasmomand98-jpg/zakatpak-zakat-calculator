// ZakatPak — page wiring. All rules live in logic.js; this file only renders.
// "Today" is pinned to 2026-11-19 so the sample figures (Ahmed
// Raza's wealth Rs 2,875,000, Zakat Rs 71,875, paid Rs 50,000,
// remaining Rs 21,875; silver nisab Rs 241,504; receipts
// ZKT-2026-0001 and ZKT-2026-0002) stay stable no matter when
// you open it.
(function () {
  var L = window.ZakatPakLogic;
  var TODAY = "2026-11-19";
  var TODAY_LABEL = "19 Nov 2026";
  var STORE_PAYMENTS = "zakatpak-payments";
  var STORE_SPOTTER = "zakatpak-spotter-answers";

  function el(id) { return document.getElementById(id); }
  function rs(n) { return "Rs " + L.formatPKR(n); }

  function loadJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || "null") || fallback; }
    catch (e) { return fallback; }
  }
  function saveJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }
  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
  var payments = loadJSON(STORE_PAYMENTS, clone(SEED_PAYMENTS));
  var spotterAnswers = loadJSON(STORE_SPOTTER, {});

  // ---- Tabs ----
  var TABS = ["calculator", "nisab", "charity", "tracker", "guide", "spotter"];
  function showTab(name) {
    TABS.forEach(function (t) {
      el("section-" + t).style.display = (t === name) ? "block" : "none";
      el("tab-" + t).className = "tab-btn" + (t === name ? " active" : "");
    });
  }
  TABS.forEach(function (t) {
    el("tab-" + t).addEventListener("click", function () { showTab(t); });
  });
  showTab("calculator");

  function readAssets() {
    function num(id) {
      var v = parseInt(el(id).value, 10);
      return (isNaN(v) || v < 0) ? 0 : v;
    }
    return { cash: num("cash-input"), bank: num("bank-input"),
      goldGrams: num("gold-input"), silverGrams: num("silver-input"),
      stock: num("stock-input"), debts: num("debts-input") };
  }

  // ---- Zakat calculator ----
  function renderCalc() {
    var a = readAssets();
    var wealth = L.zakatableWealth(a, RATES);
    var zakat = L.calcZakat(wealth, NISAB, RATES);
    var status = L.nisabStatus(wealth, NISAB, RATES);
    el("calc-result").innerHTML =
      '<div class="total"><strong>ZAKATABLE WEALTH ' + rs(wealth) +
      " \u00b7 ZAKAT (2.5%) " + rs(zakat) + "</strong>" +
      "<p>" + status.note + " Silver nisab " + rs(NISAB.silverNisabPKR) +
      " \u00b7 gold nisab " + rs(NISAB.goldNisabPKR) +
      ". Held a full lunar year. Sample rates — gold " + rs(RATES.goldPerGram) +
      " a gram, silver " + rs(RATES.silverPerTola) +
      " a tola — check today's market rate.</p></div>";
    var ex = WORKED_EXAMPLE;
    var box = el("examples-list");
    box.innerHTML = "";
    var div = document.createElement("div");
    div.className = "bundle best";
    div.innerHTML = "<div><h3>Ahmed Raza \u00b7 Lahore \u00b7 38</h3>" +
      "<p>Cash " + rs(ex.cash) + " + bank " + rs(ex.bank) + " + gold " +
      ex.goldGrams + " g (" + rs(ex.goldValue) + ") \u2212 debts " + rs(ex.debts) + "</p></div>" +
      '<div class="recv">ZAKAT ' + rs(ex.zakat) +
      "<span>on wealth " + rs(ex.wealth) + "</span></div>";
    box.appendChild(div);
    var abox = el("asset-list");
    abox.innerHTML = "";
    var rows = [
      ["Cash in hand", a.cash, "counted in full"],
      ["Bank savings", a.bank, "counted in full"],
      ["Gold \u2014 " + a.goldGrams + " g \u00d7 " + rs(RATES.goldPerGram),
        L.goldValue(a.goldGrams, RATES), "at the sample gold rate"],
      ["Silver \u2014 " + a.silverGrams + " g \u00d7 Rs 394.38",
        L.silverValue(a.silverGrams, RATES), "at the sample silver rate"],
      ["Business stock", a.stock, "counted in full"],
      ["Debts you owe", -a.debts, "subtracted from the total"]
    ];
    rows.forEach(function (r) {
      var d2 = document.createElement("div");
      d2.className = "bundle";
      d2.innerHTML = "<div><h3>" + r[0] + "</h3><p>" + r[2] + "</p></div>" +
        '<div class="recv">' + (r[1] < 0 ? "\u2212 " : "") + rs(Math.abs(r[1])) + "</div>";
      abox.appendChild(d2);
    });
    el("calc-summary").textContent = "2.5% \u00d7 " + rs(wealth) + " = " +
      rs(zakat) + " \u00b7 checked " + TODAY_LABEL +
      " \u00b7 sample rates, check today's market rate.";
  }
  ["cash-input", "bank-input", "gold-input", "silver-input",
   "stock-input", "debts-input"].forEach(function (id) {
    el(id).addEventListener("input", function () { renderCalc(); renderNisab(); });
  });
  el("calc-btn").addEventListener("click", function () { renderCalc(); renderNisab(); });
  renderCalc();

  // ---- Nisab checker ----
  function renderNisab() {
    var a = readAssets();
    var wealth = L.zakatableWealth(a, RATES);
    var goldN = L.goldNisabPKR(NISAB, RATES);
    var silverN = L.silverNisabPKR(NISAB, RATES);
    var status = L.nisabStatus(wealth, NISAB, RATES);
    var vs = L.wealthVsNisab(wealth, NISAB, RATES);
    el("nisab-box").innerHTML =
      '<div class="total"><strong>' + (status.due ? "ZAKAT IS DUE \u2014 " : "NO ZAKAT DUE YET \u2014 ") +
      rs(L.calcZakat(wealth, NISAB, RATES)) + "</strong>" +
      "<p>" + status.note + " Gold nisab " + rs(goldN) + " (87.48 g \u00d7 " +
      rs(RATES.goldPerGram) + "). Silver nisab " + rs(silverN) + " (612.36 g \u00d7 Rs 394.38).</p></div>";
    el("nisab-compare").innerHTML =
      '<div class="bundle best"><div><h3>Your wealth \u2014 ' + rs(wealth) + "</h3>" +
      "<p>" + vs + "\u00d7 the silver nisab of " + rs(silverN) + "</p></div>" +
      '<div class="recv">' + (status.due ? "ZAKAT DUE" : "BELOW NISAB") +
      "<span>" + rs(L.calcZakat(wealth, NISAB, RATES)) + "</span></div></div>";
  }
  renderNisab();

  // ---- Charity verifier ----
  function charityCard(c) {
    var div = document.createElement("div");
    div.className = "bundle" + (c.verified ? "" : "");
    var points = c.points.map(function (p) { return "\u2022 " + p; }).join("<br>");
    div.innerHTML = "<div><h3>" + c.name + " (" + c.tag + ")</h3>" +
      "<p>" + points + "<br>" + c.note + "</p></div>" +
      '<div class="recv"><span class="' + (c.verified ? "badge-ok" : "badge-risk") + '">' +
      (c.verified ? "\u2713 " : "\u2717 ") + c.status + "</span></div>";
    return div;
  }
  function renderCharityList() {
    var box = el("charity-list");
    box.innerHTML = "";
    CHARITIES.forEach(function (c) { box.appendChild(charityCard(c)); });
  }
  renderCharityList();

  function renderCharity() {
    var raw = el("charity-input").value || "";
    var box = el("charity-result");
    if (!raw.trim()) { box.innerHTML = ""; return; }
    var found = L.findCharity(CHARITIES, raw);
    if (!found) {
      box.innerHTML = '<div class="alert notfound"><strong>NO SAMPLE CHARITY CALLED \u201c' + raw + "\u201d</strong>" +
        "<p>Try Noor (Noor Welfare Trust, verified) or Quick (Quick Zakat Collectors, flagged).</p></div>";
      return;
    }
    var cls = found.verified ? "ok" : "risk";
    box.innerHTML = '<div class="alert ' + cls + '"><strong>' +
      (found.verified ? "\u2713 VERIFIED \u2014 " : "\u2717 FLAGGED \u2014 ") +
      found.name + "</strong><p>" + found.note + "</p></div>";
  }
  el("charity-input").addEventListener("input", renderCharity);
  el("charity-btn").addEventListener("click", renderCharity);

  // ---- Payment tracker ----
  function renderTracker() {
    var prog = L.paidProgress(ZAKAT_DUE, payments);
    el("tracker-progress").textContent = "Paid " + rs(prog.paid) + " of " +
      rs(prog.due) + " \u00b7 " + prog.pct + "% \u00b7 remaining " + rs(prog.remaining) + "." +
      (prog.remaining === 0 ? " Zakat paid in full \u2014 every rupee is receipted." : "");
    var box = el("receipt-list");
    box.innerHTML = "";
    payments.forEach(function (p) {
      var div = document.createElement("div");
      div.className = "bundle";
      div.innerHTML = "<div><h3>" + p.receipt + "</h3>" +
        "<p>" + p.charity + " \u00b7 " + p.group + " \u00b7 " + p.date + "</p></div>" +
        '<div class="recv">' + rs(p.amount) + "<span>receipted</span></div>";
      box.appendChild(div);
    });
  }
  renderTracker();

  el("pay-btn").addEventListener("click", function () {
    var charity = (el("pay-charity").value || "").trim();
    var amount = parseInt(el("pay-amount").value, 10);
    var group = el("pay-group").value;
    var p = L.addPayment(payments, charity, amount, group, TODAY_LABEL);
    if (!p) {
      el("pay-result").innerHTML = '<div class="alert risk"><strong>ENTER A CHARITY AND AN AMOUNT</strong>' +
        "<p>A payment needs a charity name and an amount above Rs 0.</p></div>";
      return;
    }
    saveJSON(STORE_PAYMENTS, payments);
    var prog = L.paidProgress(ZAKAT_DUE, payments);
    el("pay-result").innerHTML = '<div class="alert ok"><strong>RECEIPT ISSUED \u2014 ' + p.receipt + "</strong>" +
      "<p>" + rs(p.amount) + " to " + p.charity + " (" + p.group + ") on " + p.date +
      ". Paid so far " + rs(prog.paid) + " of " + rs(prog.due) +
      " \u00b7 remaining " + rs(prog.remaining) + ".</p></div>";
    renderTracker();
  });

  // ---- Mustahiqeen guide ----
  function renderGuide() {
    var box = el("guide-list");
    box.innerHTML = "";
    MUSTAHIQEEN.forEach(function (g, i) {
      var div = document.createElement("div");
      div.className = "bundle";
      div.innerHTML = "<div><h3>" + (i + 1) + ". " + g.title + "</h3>" +
        "<p>" + g.detail + "</p></div>";
      box.appendChild(div);
    });
  }
  renderGuide();

  // ---- Red-flag spotter quiz ----
  function renderSpotter() {
    var box = el("spotter-quiz");
    box.innerHTML = "";
    SPOTTER_FLAGS.forEach(function (flag, i) {
      var div = document.createElement("div");
      div.className = "spotter-q";
      var chosen = spotterAnswers[flag.id];
      var btnFlag = document.createElement("button");
      btnFlag.textContent = "Red flag";
      btnFlag.className = chosen === true ? "flag-btn chosen" : "flag-btn";
      btnFlag.addEventListener("click", function () {
        spotterAnswers[flag.id] = true;
        saveJSON(STORE_SPOTTER, spotterAnswers);
        renderSpotter();
      });
      var btnSafe = document.createElement("button");
      btnSafe.textContent = "Safe";
      btnSafe.className = "secondary" + (chosen === false ? " chosen" : "");
      btnSafe.addEventListener("click", function () {
        spotterAnswers[flag.id] = false;
        saveJSON(STORE_SPOTTER, spotterAnswers);
        renderSpotter();
      });
      var p = document.createElement("p");
      p.innerHTML = "<strong>" + (i + 1) + ". </strong>" + flag.scenario;
      div.appendChild(p);
      div.appendChild(btnFlag);
      div.appendChild(btnSafe);
      box.appendChild(div);
    });
  }
  renderSpotter();

  el("spotter-btn").addEventListener("click", function () {
    var score = L.scoreQuiz(SPOTTER_FLAGS, spotterAnswers);
    var html = '<div class="alert ' + (score.perfect ? "ok" : "warn") + '"><strong>' +
      score.correct + " OF " + score.total + " CORRECT" + "</strong><p>" +
      (score.perfect ? "Perfect — you spot all four collector traps and the safe habit."
                     : "Check the ones you missed below — the spotter catches them before the money moves.") +
      "</p></div>";
    SPOTTER_FLAGS.forEach(function (flag) {
      var right = L.spotterAnswer(flag, spotterAnswers[flag.id]);
      var answered = spotterAnswers.hasOwnProperty(flag.id);
      html += '<div class="alert ' + (!answered ? "notfound" : (right ? "ok" : "risk")) + '"><strong>' +
        (answered ? (right ? "✓ CORRECT — " : "✗ MISSED — ") : "NOT ANSWERED — ") +
        (flag.isFlag ? "RED FLAG" : "SAFE") + "</strong><p>" + flag.why + "</p></div>";
    });
    el("spotter-result").innerHTML = html;
  });

  el("reset-demo").addEventListener("click", function () {
    payments = clone(SEED_PAYMENTS);
    spotterAnswers = {};
    saveJSON(STORE_PAYMENTS, payments);
    saveJSON(STORE_SPOTTER, spotterAnswers);
    el("cash-input").value = "850000";
    el("bank-input").value = "1200000";
    el("gold-input").value = "25";
    el("silver-input").value = "0";
    el("stock-input").value = "0";
    el("debts-input").value = "150000";
    el("charity-input").value = "";
    el("charity-result").innerHTML = "";
    el("pay-charity").value = "Noor Welfare Trust";
    el("pay-amount").value = "21875";
    el("pay-result").innerHTML = "";
    el("spotter-result").innerHTML = "";
    showTab("calculator");
    renderCalc();
    renderNisab();
    renderCharityList();
    renderTracker();
    renderGuide();
    renderSpotter();
  });
})();
