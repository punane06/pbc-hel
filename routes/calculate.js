const express = require("express");
const { validateCalculationInput, sendValidationError } = require("../middleware/validation");
const { calculateBenefits, calculateSummary } = require("../services/benefitCalculator");

const router = express.Router();

router.post("/", (req, res) => {
    const { errors, salary, birthDate } = validateCalculationInput(req.body || {});

    if (errors.length > 0) {
        sendValidationError(res, errors);
        return;
    }

    const rows = calculateBenefits(salary, birthDate);
    const summary = calculateSummary(salary, rows);

    res.json({
        rows,
        ...summary
    });
});

module.exports = router;
