const test = require("node:test");
const assert = require("node:assert/strict");

process.env.DB_PATH = ":memory:";

const { startServer } = require("../server");

let server;
let baseUrl;

test.before(async () => {
    server = startServer(0);

    await new Promise((resolve) => {
        server.on("listening", resolve);
    });

    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
});

test.after(async () => {
    await new Promise((resolve, reject) => {
        server.close((err) => {
            if (err) {
                reject(err);
                return;
            }

            resolve();
        });
    });
});

test("POST /calculate returns 12 rows for valid input", async () => {
    const response = await fetch(`${baseUrl}/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salary: 3000, birthDate: "15.03.2026" })
    });

    assert.equal(response.status, 200);

    const data = await response.json();

    assert.equal(data.rows.length, 12);
    assert.equal(typeof data.dailyRate, "number");
    assert.equal(typeof data.totalBenefit, "number");
    assert.equal(data.capApplied, false);
});

test("POST /calculate returns 400 for invalid salary", async () => {
    const response = await fetch(`${baseUrl}/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salary: -1, birthDate: "15.03.2026" })
    });

    assert.equal(response.status, 400);

    const body = await response.json();

    assert.equal(body.error, "Validation failed");
    assert.ok(Array.isArray(body.details));
});

test("POST /calculate returns 400 for future birth date", async () => {
    const future = new Date();
    future.setDate(future.getDate() + 2);

    const dd = String(future.getDate()).padStart(2, "0");
    const mm = String(future.getMonth() + 1).padStart(2, "0");
    const yyyy = future.getFullYear();

    const response = await fetch(`${baseUrl}/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salary: 2500, birthDate: `${dd}.${mm}.${yyyy}` })
    });

    assert.equal(response.status, 400);

    const body = await response.json();
    assert.ok(body.details.some((message) => message.includes("future")));
});

test("POST /save and GET /load/:id roundtrip works", async () => {
    const saveResponse = await fetch(`${baseUrl}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salary: 3550.5, birthDate: "01.02.2026" })
    });

    assert.equal(saveResponse.status, 200);

    const saveBody = await saveResponse.json();
    assert.ok(Number.isInteger(saveBody.id));

    const loadResponse = await fetch(`${baseUrl}/load/${saveBody.id}`);
    assert.equal(loadResponse.status, 200);

    const loadBody = await loadResponse.json();

    assert.equal(loadBody.salary, 3550.5);
    assert.equal(loadBody.birthDate, "01.02.2026");
});

test("GET /load/:id returns 400 for invalid id", async () => {
    const response = await fetch(`${baseUrl}/load/abc`);

    assert.equal(response.status, 400);
});

test("GET /load/:id returns 404 for missing id", async () => {
    const response = await fetch(`${baseUrl}/load/99999999`);

    assert.equal(response.status, 404);
});

test("POST /pdf returns a PDF response", async () => {
    const response = await fetch(`${baseUrl}/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salary: 3000, birthDate: "15.03.2026", lang: "et" })
    });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "application/pdf");
});
