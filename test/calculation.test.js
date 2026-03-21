const test = require("node:test");
const assert = require("node:assert/strict");

process.env.DB_PATH = ":memory:";

const {
    calculateBenefits,
    isValidDateString,
    validateCalculationInput
} = require("../server");

test("calculateBenefits returns 12 monthly rows", () => {
    const rows = calculateBenefits(3000, "15.03.2026");

    assert.equal(rows.length, 12);
});

test("first month uses days from birth date to month end", () => {
    const rows = calculateBenefits(3000, "15.03.2026");

    assert.equal(rows[0].daysPaid, 17);
    assert.equal(rows[0].payment, 1700);
});

test("salary cap is applied at 4000", () => {
    const rows = calculateBenefits(5000, "01.01.2026");

    assert.equal(rows[0].payment, 4133.33);
});

test("salary exactly 4000 does not exceed cap", () => {
    const rows = calculateBenefits(4000, "01.01.2026");

    assert.equal(rows[0].payment, 4133.33);
});

test("leap year date is accepted and calculated correctly", () => {
    const rows = calculateBenefits(3000, "29.02.2024");

    assert.equal(rows[0].daysPaid, 1);
    assert.equal(rows[0].payment, 100);
});

test("birth date on last day of month counts one day in first month", () => {
    const rows = calculateBenefits(3000, "31.03.2026");

    assert.equal(rows[0].daysPaid, 1);
    assert.equal(rows[0].payment, 100);
});

test("isValidDateString rejects impossible dates", () => {
    assert.equal(isValidDateString("31.02.2026"), false);
    assert.equal(isValidDateString("29.02.2025"), false);
});

test("isValidDateString accepts valid dates", () => {
    assert.equal(isValidDateString("29.02.2024"), true);
    assert.equal(isValidDateString("31.03.2026"), true);
});

test("validateCalculationInput returns errors for invalid payload", () => {
    const { errors } = validateCalculationInput({
        salary: -100,
        birthDate: "31.02.2026"
    });

    assert.ok(errors.some((e) => e.includes("Salary must be a positive number.")));
    assert.ok(errors.some((e) => e.includes("Birth date must be a valid date")));
});

test("validateCalculationInput rejects future birth dates", () => {
    const future = new Date();
    future.setDate(future.getDate() + 2);

    const dd = String(future.getDate()).padStart(2, "0");
    const mm = String(future.getMonth() + 1).padStart(2, "0");
    const yyyy = future.getFullYear();

    const { errors } = validateCalculationInput({
        salary: 2500,
        birthDate: `${dd}.${mm}.${yyyy}`
    });

    assert.ok(errors.some((e) => e.includes("future")));
});
