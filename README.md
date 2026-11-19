# ZakatPak — Zakat Calculator & Verified Charity Finder (UX Concept)

A working website by Muhammad Abbas Khan — a UX concept demo for the ZakatPak case study. Pure HTML, CSS and JavaScript, no frameworks. Open `index.html` in a browser, or visit the live demo:

- **Live demo:** https://abbasmomand98-jpg.github.io/zakatpak-zakat-calculator/
- **Code:** https://github.com/abbasmomand98-jpg/zakatpak-zakat-calculator

## What it does

Millions of Pakistani Muslims owe Zakat — 2.5% of zakatable wealth held above nisab for one lunar year — but most never work it out. They guess, underpay, or hand cash to whoever knocks at the door in the winter charity drives, and fake collectors know it. ZakatPak has six parts:

1. **Zakat Calculator** — enter cash, bank savings, gold (grams), silver (grams) and business stock, minus your debts. ZakatPak works out your zakatable wealth and 2.5% of it, and shows the maths line by line.
2. **Nisab Checker** — gold nisab (87.48 g) and silver nisab (612.36 g) in rupees at the sample rates, and your wealth against each one. ZakatPak uses the silver nisab, the lower, more cautious threshold most Pakistani scholars apply.
3. **Charity Verifier** — search a charity and see its verdict. Verified charities show a registration number and published accounts; flagged collectors are WhatsApp-only, cash-only, no receipt.
4. **Payment Tracker** — every payment gets a receipt (ZKT-2026-0001, ZKT-2026-0002, …), saved on this device, against the Zakat you owe.
5. **Who Qualifies** — the eight mustahiqeen, the groups Zakat may go to.
6. **Red-Flag Spotter** — a five-question quiz that catches the four collector traps before your money moves.

## How it works

Open `index.html`. The calculator tab is prefilled with the sample story: Ahmed Raza, 38, Lahore — cash Rs 850,000, bank savings Rs 1,200,000, gold 25 g (Rs 975,000 at the sample rate of Rs 39,000 a gram), silver 0 g, business stock Rs 0, debts Rs 150,000. His zakatable wealth is Rs 2,875,000, so his Zakat is 2.5% of it: **Rs 71,875**.

His wealth is below the gold nisab (Rs 3,411,720) but 11.9× the silver nisab (Rs 241,504) — so Zakat is due on the silver nisab. He has paid Rs 50,000 of it in two receipted payments (ZKT-2026-0001: Rs 30,000 on 12 Nov 2026; ZKT-2026-0002: Rs 20,000 on 17 Nov 2026), and Rs 21,875 is still to pay. Record a payment in the tracker and ZakatPak issues the next receipt number and saves it in `localStorage`, so it survives a reload. The spotter quiz answers are saved the same way; "Reset demo data" restores the sample figures.

The code is split the way a small real app would be: `data.js` holds the sample data, `logic.js` holds the pure rules (no DOM, unit-tested in Node), and `app.js` only wires the page. Run the tests with `node test.js` (unit smoke test) and `node dom-smoke.js` (DOM smoke test in a fake DOM).

## What you can learn from this project

- **Separating data, logic and rendering.** `data.js` is just facts; `logic.js` is pure functions you can test without a browser; `app.js` only touches the page. Change a rate in one place and every tab agrees.
- **Money maths with visible working.** The calculator never hides a number: every asset is listed, debts are subtracted in the open, and the 2.5% is shown as "2.5% × Rs 2,875,000 = Rs 71,875". People trust a figure they can check.
- **A threshold with two answers.** Gold nisab and silver nisab give different verdicts for the same person — the demo explains why it picks the silver one, instead of hiding the choice. Honest edge cases make a product feel trustworthy.
- **localStorage as a tiny database.** Receipts and quiz answers persist across reloads with a few lines of `JSON.parse` / `JSON.stringify` — no server, no account, no backend.
- **A fake DOM for testing.** `dom-smoke.js` runs the real `app.js` in Node against a stub `document`, so the page logic is tested without opening a browser.
- **Sample data, labelled everywhere.** Every figure, person, charity and receipt is invented and says so on the page. A demo that looks real must never pretend to be real.

## Sample-data honesty note

All figures, people, charities and receipts in this demo are invented for a UX concept. Gold (Rs 39,000 a gram) and silver (Rs 4,600 a tola) are **sample rates** — check today's market rate before you act on them. Zakat rules are shown in simplified form; for a real ruling, ask a qualified scholar. This is an unofficial UX concept by Muhammad Abbas Khan, not a religious authority and not a real charity directory.

## Fork it and make it yours

This pattern fits any "do I owe it, how much, and who do I trust?" problem — income tax, charity giving, school fees, utility arrears. Fork the repo, swap the rates and the rules in `data.js`, and adapt the calculator to your own local problem. If you build something with it, I would love to see it — abbasmomand98@gmail.com.
