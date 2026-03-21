import { translations, statusStyles } from "./translations.js";

let chart = null;
let currentLanguage = "et";
let latestCalculationRequestId = 0;

function applyLanguage() {
    const t = translations[currentLanguage];

    document.getElementById("title").innerText = t.title;
    document.getElementById("inputSection").innerText = t.inputSection;

    document.getElementById("salaryLabel").innerText = t.salary;
    document.getElementById("salaryHelp").innerText = t.salaryHelp;

    document.getElementById("birthLabel").innerText = t.birth;
    document.getElementById("birthHelp").innerText = t.birthHelp;

    document.getElementById("saveBtn").innerText = t.save;
    document.getElementById("pdfBtn").innerText = t.pdf;
    document.getElementById("applicationIdLabel").innerText = t.applicationId;
    document.getElementById("restoreTitle").innerText = t.restoreTitle;
    document.getElementById("restoreSteps").innerText = t.restoreSteps;
    document.getElementById("loadBtn").innerText = t.load;
    document.getElementById("loadLastBtn").innerText = t.loadLast;
    document.getElementById("copyIdBtn").innerText = t.copyId;

    document.getElementById("summaryTitle").innerText = t.summary;

    document.getElementById("salaryCardLabel").innerText = t.salaryCard;
    document.getElementById("dailyCardLabel").innerText = t.dailyRate;
    document.getElementById("capCardLabel").innerText = t.cap;
    document.getElementById("totalCardLabel").innerText = t.total;

    document.getElementById("paymentsTitle").innerText = t.payments;

    document.getElementById("monthHeader").innerText = t.month;
    document.getElementById("yearHeader").innerText = t.year;
    document.getElementById("daysHeader").innerText = t.days;
    document.getElementById("paymentHeader").innerText = t.payment;

    document.getElementById("chartTitle").innerText = t.chart;

    updateRestoreHelp();
}

function setLanguage(lang) {
    currentLanguage = lang;
    applyLanguage();
    calculate();
}

function toggleDarkMode() {
    document.body.classList.toggle("dark");
}

function formatCurrency(value) {
    return new Intl.NumberFormat("et-EE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number(value)) + " €";
}

function convertDate(date) {
    const [year, month, day] = date.split("-");
    return `${day}.${month}.${year}`;
}

function convertStoredDateToInput(date) {
    const [day, month, year] = date.split(".");
    return `${year}-${month}-${day}`;
}

function getFormValues() {
    return {
        salary: document.getElementById("salary").value,
        birthDateRaw: document.getElementById("birthDate").value
    };
}

function setFieldError(fieldId, message = "") {
    const input = document.getElementById(fieldId);
    const error = document.getElementById(`${fieldId}Error`);

    if (!message) {
        input.classList.remove("border-rose-500", "ring-1", "ring-rose-200");
        input.removeAttribute("aria-invalid");
        error.innerText = "";
        error.classList.add("hidden");
        return;
    }

    input.classList.add("border-rose-500", "ring-1", "ring-rose-200");
    input.setAttribute("aria-invalid", "true");
    error.innerText = message;
    error.classList.remove("hidden");
}

function validateCalculationFields() {
    const t = translations[currentLanguage];
    const { salary, birthDateRaw } = getFormValues();
    let isValid = true;

    setFieldError("salary");
    setFieldError("birthDate");

    if (!salary) {
        setFieldError("salary", t.salaryRequired);
        isValid = false;
    } else if (Number(salary) <= 0) {
        setFieldError("salary", t.salaryInvalid);
        isValid = false;
    }

    if (!birthDateRaw) {
        setFieldError("birthDate", t.birthDateRequired);
        isValid = false;
    }

    return isValid;
}

function validateApplicationIdField() {
    const applicationId = document.getElementById("applicationId").value.trim();

    setFieldError("applicationId");

    if (!applicationId) {
        setFieldError("applicationId", translations[currentLanguage].statusMissingApplicationId);
        return false;
    }

    return true;
}

function setStatus(message, type = "info", options = {}) {
    const statusMessage = document.getElementById("statusMessage");
    const statusText = document.getElementById("statusText");
    const copyIdBtn = document.getElementById("copyIdBtn");

    statusMessage.className = `mb-6 rounded-lg border px-4 py-3 text-sm ${statusStyles[type] || statusStyles.info}`;
    statusText.innerText = message;

    if (options.copyId) {
        copyIdBtn.dataset.applicationId = String(options.copyId);
        copyIdBtn.classList.remove("hidden");
    } else {
        copyIdBtn.dataset.applicationId = "";
        copyIdBtn.classList.add("hidden");
    }

    statusMessage.classList.remove("hidden");
}

function setButtonLoadingState(buttonId, isLoading, idleKey, loadingKey) {
    const button = document.getElementById(buttonId);
    const translation = translations[currentLanguage];

    button.disabled = isLoading;
    button.setAttribute("aria-busy", String(isLoading));
    button.innerText = isLoading ? translation[loadingKey] : translation[idleKey];
}

async function copySavedApplicationId() {
    const copyIdBtn = document.getElementById("copyIdBtn");
    const applicationId = copyIdBtn.dataset.applicationId;

    if (!applicationId) return;

    try {
        await navigator.clipboard.writeText(applicationId);
        setStatus(
            translations[currentLanguage].statusIdCopied.replace("{id}", applicationId),
            "success"
        );
    } catch (error) {
        setStatus(translations[currentLanguage].statusCopyError, "error");
    }
}

function updateRestoreHelp() {
    const t = translations[currentLanguage];
    const savedId = localStorage.getItem("lastSavedApplicationId");
    const loadLastBtn = document.getElementById("loadLastBtn");

    document.getElementById("restoreHelp").innerText = savedId
        ? t.restoreHelpWithId.replace("{id}", savedId)
        : t.restoreHelp;

    loadLastBtn.disabled = !savedId;
}

function syncApplicationIdInUrl(applicationId) {
    const url = new URL(window.location.href);

    if (applicationId) {
        url.searchParams.set("applicationId", applicationId);
    } else {
        url.searchParams.delete("applicationId");
    }

    window.history.replaceState({}, "", url);
}

async function readApiErrorMessage(response, fallbackMessage) {
    try {
        const payload = await response.json();

        if (payload && Array.isArray(payload.details) && payload.details.length > 0) {
            return payload.details.join(" ");
        }

        if (payload && payload.error) {
            return payload.error;
        }

        return fallbackMessage;
    } catch (error) {
        return fallbackMessage;
    }
}

async function calculate() {
    const { salary, birthDateRaw } = getFormValues();

    if (!salary || !birthDateRaw) return;
    if (!validateCalculationFields()) return;

    const birthDate = convertDate(birthDateRaw);
    const requestId = ++latestCalculationRequestId;

    let data;

    try {
        const response = await fetch("/calculate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ salary, birthDate })
        });

        if (!response.ok) {
            if (requestId !== latestCalculationRequestId) return;

            setStatus(
                await readApiErrorMessage(response, translations[currentLanguage].statusCalculateError),
                "error"
            );
            return;
        }

        data = await response.json();
        if (requestId !== latestCalculationRequestId) return;
    } catch (error) {
        if (requestId !== latestCalculationRequestId) return;

        setStatus(translations[currentLanguage].statusCalculateError, "error");
        return;
    }

    const table = document.getElementById("results");
    table.innerHTML = "";

    const labels = [];
    const payments = [];

    const months = currentLanguage === "et"
        ? ["Jaanuar", "Veebruar", "Märts", "Aprill", "Mai", "Juuni", "Juuli", "August", "September", "Oktoober", "November", "Detsember"]
        : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    data.rows.forEach((row) => {
        const payment = Number(row.payment);

        labels.push(months[row.month - 1]);
        payments.push(payment);

        const tr = document.createElement("tr");

        tr.innerHTML = `
<td class="p-2">${months[row.month - 1]}</td>
<td class="p-2 text-center">${row.year}</td>
<td class="p-2 text-center">${row.daysPaid}</td>
<td class="p-2 text-right">${formatCurrency(payment)}</td>
`;

        table.appendChild(tr);
    });

    document.getElementById("total").innerText = formatCurrency(data.totalBenefit);

    document.getElementById("summarySalary").innerText = formatCurrency(salary);
    document.getElementById("summaryDaily").innerText = formatCurrency(data.dailyRate);
    document.getElementById("summaryCap").innerText = data.capApplied
        ? translations[currentLanguage].capYes
        : translations[currentLanguage].capNo;
    document.getElementById("summaryTotal").innerText = formatCurrency(data.totalBenefit);

    document.getElementById("summary").classList.remove("hidden");

    renderChart(labels, payments);
}

function renderChart(labels, data) {
    const ctx = document.getElementById("benefitChart");

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: "#3b82f6"
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } }
        }
    });
}

async function downloadPDF() {
    const { salary, birthDateRaw } = getFormValues();

    if (!salary || !birthDateRaw || !validateCalculationFields()) {
        setStatus(translations[currentLanguage].statusMissingFields, "error");
        return;
    }

    const birthDate = convertDate(birthDateRaw);

    try {
        setButtonLoadingState("pdfBtn", true, "pdf", "pdfLoading");

        const response = await fetch("/pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ salary, birthDate, lang: currentLanguage })
        });

        if (!response.ok) {
            setStatus(
                await readApiErrorMessage(response, translations[currentLanguage].statusPdfError),
                "error"
            );
            return;
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "benefits.pdf";
        a.click();
    } catch (error) {
        setStatus(translations[currentLanguage].statusPdfError, "error");
    } finally {
        setButtonLoadingState("pdfBtn", false, "pdf", "pdfLoading");
    }
}

async function saveApplication() {
    const { salary, birthDateRaw } = getFormValues();

    if (!salary || !birthDateRaw || !validateCalculationFields()) {
        setStatus(translations[currentLanguage].statusMissingFields, "error");
        return;
    }

    const birthDate = convertDate(birthDateRaw);

    try {
        setButtonLoadingState("saveBtn", true, "save", "saveLoading");

        const response = await fetch("/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ salary, birthDate })
        });

        if (!response.ok) {
            setStatus(
                await readApiErrorMessage(response, translations[currentLanguage].statusSaveError),
                "error"
            );
            return;
        }

        const data = await response.json();
        const applicationId = String(data.id);

        document.getElementById("applicationId").value = applicationId;
        localStorage.setItem("lastSavedApplicationId", applicationId);
        syncApplicationIdInUrl(applicationId);
        updateRestoreHelp();
        setStatus(
            translations[currentLanguage].statusSaved.replace("{id}", applicationId),
            "success",
            { copyId: applicationId }
        );
    } catch (error) {
        setStatus(translations[currentLanguage].statusSaveError, "error");
    } finally {
        setButtonLoadingState("saveBtn", false, "save", "saveLoading");
    }
}

async function loadApplication() {
    const applicationId = document.getElementById("applicationId").value.trim();

    if (!validateApplicationIdField()) {
        setStatus(translations[currentLanguage].statusMissingApplicationId, "error");
        return;
    }

    await loadApplicationById(applicationId);
}

async function loadLastSavedApplication() {
    const applicationId = localStorage.getItem("lastSavedApplicationId");

    if (!applicationId) {
        setStatus(translations[currentLanguage].statusNoLocalSave, "info");
        return;
    }

    document.getElementById("applicationId").value = applicationId;
    await loadApplicationById(applicationId);
}

async function loadApplicationById(applicationId) {
    try {
        setButtonLoadingState("loadBtn", true, "load", "loadLoading");
        setButtonLoadingState("loadLastBtn", true, "loadLast", "loadLastLoading");

        const response = await fetch(`/load/${applicationId}`);

        if (response.status === 404) {
            setStatus(translations[currentLanguage].statusNotFound.replace("{id}", applicationId), "error");
            return;
        }

        if (!response.ok) {
            setStatus(
                await readApiErrorMessage(response, translations[currentLanguage].statusLoadError),
                "error"
            );
            return;
        }

        const data = await response.json();

        document.getElementById("salary").value = data.salary;
        document.getElementById("birthDate").value = convertStoredDateToInput(data.birthDate);
        document.getElementById("applicationId").value = data.id;

        localStorage.setItem("lastSavedApplicationId", String(data.id));
        syncApplicationIdInUrl(data.id);
        updateRestoreHelp();

        await calculate();

        setStatus(translations[currentLanguage].statusLoaded.replace("{id}", data.id), "success");
    } catch (error) {
        setStatus(translations[currentLanguage].statusLoadError, "error");
    } finally {
        setButtonLoadingState("loadBtn", false, "load", "loadLoading");
        setButtonLoadingState("loadLastBtn", false, "loadLast", "loadLastLoading");
        updateRestoreHelp();
    }
}

async function initializeSavedApplication() {
    const applicationId = new URLSearchParams(window.location.search).get("applicationId");
    const lastSavedApplicationId = localStorage.getItem("lastSavedApplicationId");

    if (applicationId) {
        document.getElementById("applicationId").value = applicationId;
        await loadApplicationById(applicationId);
        return;
    }

    if (lastSavedApplicationId) {
        document.getElementById("applicationId").value = lastSavedApplicationId;
    }

    updateRestoreHelp();
}

window.setLanguage = setLanguage;
window.toggleDarkMode = toggleDarkMode;
window.saveApplication = saveApplication;
window.downloadPDF = downloadPDF;
window.copySavedApplicationId = copySavedApplicationId;
window.loadApplication = loadApplication;
window.loadLastSavedApplication = loadLastSavedApplication;

document.getElementById("salary").addEventListener("input", () => {
    setFieldError("salary");
    calculate();
});

document.getElementById("birthDate").addEventListener("input", () => {
    setFieldError("birthDate");
    calculate();
});

document.getElementById("applicationId").addEventListener("input", () => {
    setFieldError("applicationId");
});

document.getElementById("applicationId").addEventListener("keydown", async (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        await loadApplication();
    }
});

applyLanguage();
initializeSavedApplication();
