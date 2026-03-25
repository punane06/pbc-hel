
const { MIN_MONTHLY_BENEFIT, MAX_MONTHLY_BENEFIT } = require("./benefitRules");

function parseDate(dateString) {
    const parts = dateString.split(".");

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);

    return new Date(year, month, day);
}

function calculateBenefits(salary, birthDate) {
    // Clamp salary to min/max benefit rules
    let effectiveSalary = salary;
    let useMin = false;
    if (salary < MIN_MONTHLY_BENEFIT) {
        effectiveSalary = MIN_MONTHLY_BENEFIT;
        useMin = true;
    } else if (salary > MAX_MONTHLY_BENEFIT) {
        effectiveSalary = MAX_MONTHLY_BENEFIT;
    }
    const dailyRate = effectiveSalary / 30;

    const results = [];
    const date = parseDate(birthDate);

    for (let i = 0; i < 12; i++) {
        const year = date.getFullYear();
        const month = date.getMonth();

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysPaid = i === 0 ? daysInMonth - date.getDate() + 1 : daysInMonth;
        let payment;
        if (useMin) {
            payment = MIN_MONTHLY_BENEFIT;
        } else {
            payment = dailyRate * daysPaid;
        }

        results.push({
            year,
            month: month + 1,
            daysPaid,
            payment: Number(payment.toFixed(2))
        });

        date.setMonth(date.getMonth() + 1);
        date.setDate(1);
    }

    return results;
}

function calculateSummary(salary, rows) {
    let effectiveSalary = salary;
    let capApplied = false;
    let minApplied = false;
    if (salary < MIN_MONTHLY_BENEFIT) {
        effectiveSalary = MIN_MONTHLY_BENEFIT;
        minApplied = true;
    } else if (salary > MAX_MONTHLY_BENEFIT) {
        effectiveSalary = MAX_MONTHLY_BENEFIT;
        capApplied = true;
    }
    const dailyRate = effectiveSalary / 30;
    const totalBenefit = Number(rows.reduce((sum, row) => sum + row.payment, 0).toFixed(2));

    return {
        cappedSalary: effectiveSalary,
        dailyRate: Number(dailyRate.toFixed(4)),
        capApplied,
        minApplied,
        totalBenefit
    };
}

module.exports = {
    parseDate,
    calculateBenefits,
    calculateSummary
};
