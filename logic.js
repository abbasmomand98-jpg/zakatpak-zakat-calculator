// ZakatPak — pure logic, no DOM here, so it can be unit-tested in Node.
(function (root) {
  // Thousands grouping, matching the figures used in the mockups,
  // slides and copy: 71875 -> "71,875", 2875000 -> "2,875,000".
  function formatPKR(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // Gold value: grams x sample rate. 25 g x Rs 39,000 = Rs 975,000.
  function goldValue(grams, rates) {
    if (!grams || grams <= 0) return 0;
    return Math.round(grams * rates.goldPerGram);
  }

  // Silver value: grams x sample per-gram rate. 612.36 g x
  // Rs 394.38 = Rs 241,504 (the silver nisab itself).
  function silverValue(grams, rates) {
    if (!grams || grams <= 0) return 0;
    return Math.round(grams * rates.silverPerGram);
  }

  // Zakatable wealth: cash + bank + gold + silver + stock - debts.
  // Ahmed Raza: 850,000 + 1,200,000 + 975,000 + 0 + 0 - 150,000
  // = Rs 2,875,000. Debts can never push wealth below zero.
  function zakatableWealth(a, rates) {
    var total = (a.cash || 0) + (a.bank || 0) +
      goldValue(a.goldGrams, rates) + silverValue(a.silverGrams, rates) +
      (a.stock || 0) - (a.debts || 0);
    return Math.max(0, Math.round(total));
  }

  // Gold nisab in PKR: 87.48 g x Rs 39,000 = Rs 3,411,720.
  function goldNisabPKR(nisab, rates) {
    return Math.round(nisab.goldGrams * rates.goldPerGram);
  }

  // Silver nisab in PKR: 612.36 g x Rs 394.38 = Rs 241,504.
  function silverNisabPKR(nisab, rates) {
    return Math.round(nisab.silverGrams * rates.silverPerGram);
  }

  // Zakat is due only when wealth reaches the silver nisab and
  // has been held a full lunar year. ZakatPak uses the silver
  // nisab — the lower, more cautious threshold most Pakistani
  // scholars apply. Below it: Rs 0.
  //   Rs 2,875,000 -> Rs 71,875. Rs 241,504 -> Rs 6,038.
  //   Rs 241,503 -> Rs 0. Rs 0 -> Rs 0.
  function calcZakat(wealth, nisab, rates) {
    if (!wealth || wealth < silverNisabPKR(nisab, rates)) return 0;
    return Math.round(wealth * rates.zakatRate);
  }

  // How many times the silver nisab a wealth is:
  // 2,875,000 / 241,504 = 11.9x.
  function wealthVsNisab(wealth, nisab, rates) {
    var n = silverNisabPKR(nisab, rates);
    if (!n) return 0;
    return Math.round(wealth / n * 10) / 10;
  }

  // Nisab verdict for a wealth: due or not, and why.
  //   Rs 2,875,000: due — above silver nisab, below gold nisab.
  //   Rs 100,000: not due — below both nisabs.
  //   Rs 4,000,000: due — above both nisabs.
  function nisabStatus(wealth, nisab, rates) {
    var gold = goldNisabPKR(nisab, rates);
    var silver = silverNisabPKR(nisab, rates);
    if (wealth >= gold) {
      return { due: true, aboveGold: true, aboveSilver: true,
        note: "Above BOTH nisabs — Zakat is due." };
    }
    if (wealth >= silver) {
      return { due: true, aboveGold: false, aboveSilver: true,
        note: "Below the gold nisab but above the silver nisab — Zakat is due on the silver nisab." };
    }
    return { due: false, aboveGold: false, aboveSilver: false,
      note: "Below both nisabs — no Zakat is due yet." };
  }

  // Payment tracker: total paid across receipts.
  // 30,000 + 20,000 = Rs 50,000.
  function totalPaid(payments) {
    var total = 0;
    payments.forEach(function (p) { total += p.amount; });
    return total;
  }

  // Remaining Zakat: due minus paid, never below zero.
  // 71,875 - 50,000 = Rs 21,875.
  function remainingDue(due, payments) {
    return Math.max(0, due - totalPaid(payments));
  }

  // Paid progress: 50,000 of 71,875 is 70% (rounded).
  function paidProgress(due, payments) {
    if (!due) return { paid: 0, due: 0, remaining: 0, pct: 0 };
    var paid = totalPaid(payments);
    return { paid: paid, due: due, remaining: Math.max(0, due - paid),
             pct: Math.round(paid / due * 100) };
  }

  // Next receipt number: ZKT-2026-0003 after 0001 and 0002.
  function nextReceipt(payments) {
    var max = 0;
    payments.forEach(function (p) {
      var m = /ZKT-2026-(\d+)/.exec(p.receipt || "");
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    var n = max + 1;
    return "ZKT-2026-" + ("0000" + n).slice(-4);
  }

  // Add a payment: validates amount and charity, stamps the next
  // receipt number. Returns the new payment or null.
  function addPayment(payments, charity, amount, group, dateLabel) {
    if (!charity || !amount || amount <= 0) return null;
    var p = { receipt: nextReceipt(payments), charity: charity,
      amount: Math.round(amount), date: dateLabel || "19 Nov 2026",
      group: group || "The poor (fuqara)" };
    payments.push(p);
    return p;
  }

  // Find a sample charity by name (case-insensitive, partial).
  // "noor" finds Noor Welfare Trust (verified);
  // "quick" finds Quick Zakat Collectors (flagged);
  // "unknown" finds nothing.
  function findCharity(charities, query) {
    var q = String(query || "").trim().toLowerCase();
    if (!q) return null;
    var found = null;
    charities.forEach(function (c) {
      if (c.name.toLowerCase().indexOf(q) !== -1) found = c;
    });
    return found;
  }

  // Red-flag spotter quiz: each flag has isFlag true/false.
  // Answering "flag" for a real flag (or "safe" for the safe
  // habit) is correct.
  function spotterAnswer(flag, saidFlag) {
    return flag.isFlag === saidFlag;
  }

  function scoreQuiz(flags, answers) {
    var correct = 0;
    flags.forEach(function (f) {
      if (answers[f.id] === f.isFlag) correct++;
    });
    return { correct: correct, total: flags.length,
             perfect: correct === flags.length };
  }

  var api = { formatPKR: formatPKR,
              goldValue: goldValue,
              silverValue: silverValue,
              zakatableWealth: zakatableWealth,
              goldNisabPKR: goldNisabPKR,
              silverNisabPKR: silverNisabPKR,
              calcZakat: calcZakat,
              wealthVsNisab: wealthVsNisab,
              nisabStatus: nisabStatus,
              totalPaid: totalPaid,
              remainingDue: remainingDue,
              paidProgress: paidProgress,
              nextReceipt: nextReceipt,
              addPayment: addPayment,
              findCharity: findCharity,
              spotterAnswer: spotterAnswer,
              scoreQuiz: scoreQuiz };
  if (typeof module !== "undefined") { module.exports = api; }
  else { root.ZakatPakLogic = api; }
})(typeof window !== "undefined" ? window : globalThis);
