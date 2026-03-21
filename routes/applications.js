const express = require("express");
const { validateCalculationInput, validateApplicationId, sendValidationError } = require("../middleware/validation");

function createApplicationsRouter(db) {
    const router = express.Router();

    router.post("/save", (req, res) => {
        const { errors, salary, birthDate } = validateCalculationInput(req.body || {});

        if (errors.length > 0) {
            sendValidationError(res, errors);
            return;
        }

        db.run(
            "INSERT INTO applications (salary,birthDate) VALUES (?,?)",
            [salary, birthDate],
            function onInsert(err) {
                if (err) {
                    res.status(500).json(err);
                    return;
                }

                res.json({ id: this.lastID });
            }
        );
    });

    router.get("/load/:id", (req, res) => {
        const validation = validateApplicationId(req.params.id);

        if (!validation.isValid) {
            sendValidationError(res, validation.errors);
            return;
        }

        db.get(
            "SELECT * FROM applications WHERE id=?",
            [validation.id],
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
            }
        );
    });

    return router;
}

module.exports = {
    createApplicationsRouter
};
