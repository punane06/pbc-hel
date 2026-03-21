const SALARY_CAP = 4000;

function parseDate(dateString) {
    const parts = dateString.split(".");

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);

    return new Date(year, month, day);
}

function calculateBenefits(salary, birthDate) {
    const cappedSalary = Math.min(salary, SALARY_CAP);
    const dailyRate = cappedSalary / 30;

    const results = [];
    const date = parseDate(birthDate);

    for (let i = 0; i < 12; i++) {
        const year = date.getFullYear();
        const month = date.getMonth();

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysPaid = i === 0 ? daysInMonth - date.getDate() + 1 : daysInMonth;
        const payment = dailyRate * daysPaid;

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
    const cappedSalary = Math.min(salary, SALARY_CAP);
    const dailyRate = cappedSalary / 30;
    const totalBenefit = Number(rows.reduce((sum, row) => sum + row.payment, 0).toFixed(2));

    return {
        cappedSalary,
        dailyRate: Number(dailyRate.toFixed(4)),
        capApplied: salary > SALARY_CAP,
        totalBenefit
    };
}

module.exports = {
    SALARY_CAP,
    parseDate,
    calculateBenefits,
    calculateSummary
};
