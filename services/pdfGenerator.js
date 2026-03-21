const PDFDocument = require("pdfkit");

const monthsEN = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const monthsET = [
    "Jaanuar", "Veebruar", "Märts", "Aprill", "Mai", "Juuni",
    "Juuli", "August", "September", "Oktoober", "November", "Detsember"
];

const texts = {
    en: {
        title: "Parental Benefit Schedule",
        salary: "Salary",
        birth: "Birth date",
        month: "Month",
        year: "Year",
        days: "Days",
        payment: "Payment",
        total: "TOTAL"
    },
    et: {
        title: "Vanemahüvitise maksegraafik",
        salary: "Palk",
        birth: "Sünnikuupäev",
        month: "Kuu",
        year: "Aasta",
        days: "Päevi",
        payment: "Makse",
        total: "KOKKU"
    }
};

function formatCurrency(value) {
    return new Intl.NumberFormat("et-EE", { style: "currency", currency: "EUR" }).format(value);
}

function createPdfResponse(res, payload) {
    const { salary, birthDate, lang, rows } = payload;

    const language = lang === "et" ? "et" : "en";
    const t = texts[language];
    const months = language === "et" ? monthsET : monthsEN;

    const today = new Date().toISOString().split("T")[0];
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=benefit_schedule_${today}.pdf`);

    doc.pipe(res);

    doc.fontSize(22).text(t.title, { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`${t.salary}: ${formatCurrency(salary)}`);
    doc.text(`${t.birth}: ${birthDate}`);
    doc.moveDown(2);

    const startX = 50;
    const colMonth = startX;
    const colYear = startX + 220;
    const colDays = startX + 300;
    const colPayment = startX + 380;

    let y = doc.y;

    doc.rect(startX, y - 5, 500, 25).fill("#4f46e5");
    doc.fillColor("white");

    doc.text(t.month, colMonth, y);
    doc.text(t.year, colYear, y);
    doc.text(t.days, colDays, y);
    doc.text(t.payment, colPayment, y);

    doc.fillColor("black");
    y += 30;

    let total = 0;

    rows.forEach((row, i) => {
        if (i % 2 === 0) {
            doc.rect(startX, y - 2, 500, 20).fill("#f3f4f6");
            doc.fillColor("black");
        }

        doc.text(months[row.month - 1], colMonth, y);
        doc.text(row.year.toString(), colYear, y);
        doc.text(row.daysPaid.toString(), colDays, y);
        doc.text(formatCurrency(row.payment), colPayment, y);

        y += 22;
        total += row.payment;
    });

    doc.rect(startX, y + 5, 500, 25).fill("#4f46e5");
    doc.fillColor("white");

    doc.text(t.total, colPayment - 120, y + 12);
    doc.text(formatCurrency(total), colPayment, y + 12);

    doc.end();
}

module.exports = {
    createPdfResponse
};
