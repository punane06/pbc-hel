const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { createDatabase } = require("./database");
const calculateRouter = require("./routes/calculate");
const { createApplicationsRouter } = require("./routes/applications");
const pdfRouter = require("./routes/pdf");
const {
    parseDate,
    calculateBenefits,
    calculateSummary,
    SALARY_CAP
} = require("./services/benefitCalculator");
const {
    isValidDateString,
    validateCalculationInput,
    sendValidationError,
    MAX_ALLOWED_SALARY
} = require("./middleware/validation");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

const db = createDatabase();

app.use("/calculate", calculateRouter);
app.use("/", createApplicationsRouter(db));
app.use("/pdf", pdfRouter);

function startServer(port = PORT, options = {}) {

    const { logStartup = false } = options;

    return app.listen(port, () => {
        if (logStartup) {
            console.log(`Server running on http://localhost:${port}`);
        }
    });

}

if (require.main === module) {
    startServer(PORT, { logStartup: true });
}

module.exports = {
    app,
    db,
    startServer,
    parseDate,
    isValidDateString,
    validateCalculationInput,
    calculateBenefits,
    calculateSummary,
    SALARY_CAP,
    MAX_ALLOWED_SALARY,
    sendValidationError
};
