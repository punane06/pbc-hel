
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { createDatabase } = require("./database");
const calculateRouter = require("./routes/calculate");
const { createApplicationsRouter } = require("./routes/applications");
const pdfRouter = require("./routes/pdf");


function validateEnv() {
    if (process.env.NODE_ENV === "production" && !process.env.DB_PATH) {
        throw new Error("DB_PATH is required in production");
    }
}

validateEnv();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || "http://localhost:3000" }));
app.use(bodyParser.json());
app.use(express.static("public"));

const db = createDatabase();

app.use("/calculate", rateLimit({ windowMs: 60_000, max: 60 }), calculateRouter);
app.use("/pdf", rateLimit({ windowMs: 60_000, max: 10 }), pdfRouter);
app.use("/", createApplicationsRouter(db));

app.get("/health", (req, res) => {
    res.json({ status: "ok", version: process.env.npm_package_version });
});

function startServer(port = PORT, options = {}) {

    const { logStartup = false } = options;

    return app.listen(port, () => {
        if (logStartup) {
            console.log(`Server running on http://localhost:${port}`);
        }
    });

}


let server;
if (require.main === module) {
    server = startServer(PORT, { logStartup: true });
    process.on("SIGTERM", () => {
        if (server) {
            server.close(() => {
                db.close();
                process.exit(0);
            });
        } else {
            db.close();
            process.exit(0);
        }
    });
}

module.exports = {
    app,
    db,
    startServer
};
