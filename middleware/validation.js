const MAX_ALLOWED_SALARY = 50000;

function isValidDateString(dateString) {
    if (typeof dateString !== "string") return false;

    const match = dateString.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (!match) return false;

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);

    const parsedDate = new Date(year, month - 1, day);

    return (
        parsedDate.getFullYear() === year
        && parsedDate.getMonth() === month - 1
        && parsedDate.getDate() === day
    );
}

function isFutureDate(dateString) {
    const [day, month, year] = dateString.split(".").map((v) => Number(v));
    const inputDate = new Date(year, month - 1, day);
    inputDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return inputDate > today;
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
    } else if (isFutureDate(birthDate)) {
        errors.push("Birth date cannot be in the future.");
    }

    return {
        errors,
        salary,
        birthDate
    };
}

function validateApplicationId(value) {
    const id = Number(value);

    if (!Number.isInteger(id) || id < 1) {
        return {
            isValid: false,
            errors: ["Application ID must be a positive integer."]
        };
    }

    return {
        isValid: true,
        id,
        errors: []
    };
}

function sendValidationError(res, errors) {
    res.status(400).json({
        error: "Validation failed",
        details: errors
    });
}

module.exports = {
    MAX_ALLOWED_SALARY,
    isValidDateString,
    validateCalculationInput,
    validateApplicationId,
    sendValidationError
};
