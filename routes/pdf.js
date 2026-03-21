const express = require("express");
const { validateCalculationInput, sendValidationError } = require("../middleware/validation");
const { calculateBenefits } = require("../services/benefitCalculator");
const { createPdfResponse } = require("../services/pdfGenerator");

const router = express.Router();

router.post("/", (req, res) => {
    const { errors, salary, birthDate } = validateCalculationInput(req.body || {});
    const { lang } = req.body || {};

    if (errors.length > 0) {
        sendValidationError(res, errors);
        return;
    }

    const rows = calculateBenefits(salary, birthDate);

    createPdfResponse(res, {
        salary,
        birthDate,
        lang,
        rows
    });
});

module.exports = router;
