const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const PDFDocument = require("pdfkit");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const MAX_ALLOWED_SALARY = 50000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

const db = new sqlite3.Database("./benefits.db");

db.serialize(() => {
    db.run(`
CREATE TABLE IF NOT EXISTS applications (
id INTEGER PRIMARY KEY AUTOINCREMENT,
salary REAL,
birthDate TEXT
)
`);
});

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
}

function parseDate(dateString) {

    const parts = dateString.split(".");

    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const year = parseInt(parts[2]);

    return new Date(year, month, day);

}

function isValidDateString(dateString) {

    if (typeof dateString !== "string") return false;

    const match = dateString.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);

    if (!match) return false;

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);

    const parsedDate = new Date(year, month - 1, day);

    return (
        parsedDate.getFullYear() === year &&
        parsedDate.getMonth() === month - 1 &&
        parsedDate.getDate() === day
    );

}

function validateCalculationInput(payload) {

    const salary = Number(payload.salary);
    const birthDate = payload.birthDate;

    const errors = [];

    if (!Number.isFinite(salary) || salary <= 0) {
        errors.push("Salary must be a positive number.");
    }

    if (salary > MAX_ALLOWED_SALARY) {
        errors.push(`Salary is too large. Maximum allowed value is ${MAX_ALLOWED_SALARY}.`);
    }

    if (!isValidDateString(birthDate)) {
        errors.push("Birth date must be a valid date in dd.mm.yyyy format.");
    }

    return {
        errors,
        salary,
        birthDate
    };

}

function sendValidationError(res, errors) {

    res.status(400).json({
        error: "Validation failed",
        details: errors
    });

}

function calculateBenefits(salary, birthDate) {

    const cappedSalary = Math.min(salary, 4000);
    const dailyRate = cappedSalary / 30;

    let results = [];

    let date = parseDate(birthDate);

    for (let i = 0; i < 12; i++) {

        const year = date.getFullYear();
        const month = date.getMonth();

        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let daysPaid;

        if (i === 0) {
            daysPaid = daysInMonth - date.getDate() + 1;
        } else {
            daysPaid = daysInMonth;
        }

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

function formatCurrency(v) {

    return new Intl.NumberFormat("et-EE", { style: "currency", currency: "EUR" }).format(v);

}

app.post("/calculate", (req, res) => {

    const { errors, salary, birthDate } = validateCalculationInput(req.body || {});

    if (errors.length > 0) {
        sendValidationError(res, errors);
        return;
    }

    res.json(calculateBenefits(salary, birthDate));

});

app.post("/save", (req, res) => {

    const { errors, salary, birthDate } = validateCalculationInput(req.body || {});

    if (errors.length > 0) {
        sendValidationError(res, errors);
        return;
    }

    db.run(
        "INSERT INTO applications (salary,birthDate) VALUES (?,?)",
        [salary, birthDate],
        function (err) {

            if (err) {
                res.status(500).json(err);
                return;
            }

            res.json({ id: this.lastID });

        });

});

app.get("/load/:id", (req, res) => {

    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
        sendValidationError(res, ["Application ID must be a positive integer."]);
        return;
    }

    db.get(
        "SELECT * FROM applications WHERE id=?",
        [id],
        (err, row) => {

            if (err) {
                res.status(500).json(err);
                return;
            }

            if (!row) {
                res.status(404).json({ error: "Application not found" });
                return;
            }

            res.json(row);

        });

});

app.post("/pdf", (req, res) => {

    const { errors, salary, birthDate } = validateCalculationInput(req.body || {});
    const { lang } = req.body || {};

    if (errors.length > 0) {
        sendValidationError(res, errors);
        return;
    }

    const language = lang === "et" ? "et" : "en";

    const t = texts[language];

    const months = language === "et" ? monthsET : monthsEN;

    const data = calculateBenefits(salary, birthDate);

    const today = new Date().toISOString().split("T")[0];

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");

    res.setHeader(
        "Content-Disposition",
        `attachment; filename=benefit_schedule_${today}.pdf`
    );

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

    data.forEach((row, i) => {

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

});

app.listen(PORT, () => {

    console.log(`Server running on http://localhost:${PORT}`);

});
