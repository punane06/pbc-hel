const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(path.join(__dirname, "..", "public", "index.html"), "utf8");

test("initial HTML includes Estonian lang and localized fallback content", () => {
    assert.match(html, /<html lang="et">/);
    assert.match(html, /Liigu põhisisu juurde/);
    assert.match(html, /Vanemahüvitise kalkulaator/);
    assert.match(html, /Sisendandmed/);
    assert.match(html, /Arvutuse kokkuvõte/);
    assert.match(html, /Väljamaksed kuude kaupa/);
    assert.match(html, /Väljamaksete graafik/);
});

test("interactive controls expose accessible labels in initial DOM", () => {
    assert.match(html, /id="languageNav" class="flex gap-3" aria-label="Keele ja kuvamise valikud"/);
    assert.match(html, /id="langEnBtn"[\s\S]*aria-label="Lülita inglise keelele"/);
    assert.match(html, /id="langEtBtn"[\s\S]*aria-label="Lülita eesti keelele"/);
    assert.match(html, /id="themeToggleBtn"[\s\S]*aria-label="Lülita tumedale režiimile"/);
});

test("payments table uses column and row headers", () => {
    assert.match(html, /id="monthHeader" scope="col"/);
    assert.match(html, /id="yearHeader" scope="col"/);
    assert.match(html, /id="daysHeader" scope="col"/);
    assert.match(html, /id="paymentHeader" scope="col"/);
    assert.match(html, /<th scope="row" class="p-2 font-medium">\$\{months\[row\.month - 1\]\}<\/th>/);
});

test("chart accessibility helpers remain present", () => {
    assert.match(html, /id="chartHelp"/);
    assert.match(html, /id="benefitChart"[\s\S]*aria-describedby="chartSummary"/);
    assert.match(html, /const prefersReducedMotion = window\.matchMedia\("\(prefers-reduced-motion: reduce\)"\)/);
    assert.match(html, /chartSummaryTemplate/);
});
