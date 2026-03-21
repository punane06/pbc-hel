# Parental Benefit Calculator

A web application that calculates parental benefit payments based on a parent's gross monthly salary and the child's birth date.

The application provides a clear 12-month payment schedule, visualisation of payments and the ability to export the results as a PDF document.

This project was built as a simplified version of a parental benefit calculator similar to the systems maintained by the Estonian Social Insurance Board.

---

## Features

### Benefit calculation
- Calculates monthly parental benefit payments
- Applies salary cap of **€4000**
- Uses **daily rate calculation (salary ÷ 30)**

### Monthly payment schedule
- Displays a **12-month breakdown**
- Shows:
  - Month
  - Year
  - Paid days
  - Monthly payment

### Calculation summary
Provides a quick overview:

- Gross monthly salary
- Daily rate
- Salary cap applied (Yes / No)
- Total parental benefit

### Data persistence
Users can save calculation input and restore it later.

Save/restore UX includes:

- save progress and get an application ID
- load by application ID
- load last saved application from local browser state

### PDF export
Users can download the benefit schedule as a **formatted PDF document**.

The PDF:
- follows the selected UI language
- includes formatted payment table
- includes total benefit amount

### Internationalisation
The UI supports two languages:

- English 🇬🇧
- Estonian 🇪🇪

Estonian terminology follows official style:

- Brutokuupalk
- Päevaraha
- Vanemahüvitise kogusumma
- Makstud päevad
- Väljamakse

### Data visualisation
A **bar chart** visualises monthly benefit payments.

### UX improvements

- Live calculation (results update automatically)
- Responsive layout
- Dark mode
- EU-style currency formatting (e.g. `2 933 €`)
- Calendar date picker for birth date input

### Validation and error handling

- Backend validation for salary, birth date and application ID
- Consistent `400 Validation failed` responses with detailed error list
- Frontend status messages for save/load/calculate/PDF failures

### Automated tests

- Unit tests for core calculation and validation logic
- API tests for calculate/save/load/pdf endpoints
- Accessibility regression tests for semantic HTML and ARIA correctness

---

## Tech Stack

### Backend

- Node.js
- Express
- SQLite
- PDFKit

### Frontend

- HTML
- Tailwind CSS
- Vanilla JavaScript
- Chart.js

---

## Project Structure

parental-benefit-calculator
│
├─ middleware
│ └─ validation.js
├─ routes
│ ├─ applications.js
│ ├─ calculate.js
│ └─ pdf.js
├─ services
│ ├─ benefitCalculator.js
│ └─ pdfGenerator.js
├─ public
│ ├─ index.html
│ └─ js
│   ├─ app.js
│   └─ translations.js
│
├─ server.js
├─ database.js
├─ test
│ ├─ api.test.js
│ └─ calculation.test.js
├─ package.json
├─ README.md
└─ .gitignore

---

## Calculation Logic

1. The parental benefit equals the **gross monthly salary**.
2. A **salary cap of €4000** is applied.
3. The daily rate is calculated as:

daily rate = salary ÷ 30

4. Each month's payment is calculated:

monthly payment = daily rate × number of paid days

5. The first month is calculated from the **child's birth date until the end of that month**.

---

## Engineering Decisions

### Why SQLite

- lightweight local setup
- no extra infrastructure needed for evaluation
- sufficient for a coding challenge with simple persistence requirements

### Why vanilla JavaScript on the frontend

- keeps the project small and easy to run locally
- avoids framework setup overhead for a focused challenge
- makes the business flow easy to review during technical discussion

### Why server-side validation

- frontend validation improves UX, but backend validation protects the application contract
- invalid salary, birth date or application ID values are rejected consistently with `400` responses
- this keeps calculation and persistence logic predictable

---

## Edge Cases Covered

- salary cap applied above **€4000**
- salary exactly **€4000**
- invalid or impossible birth dates rejected (for example `31.02.2026`)
- future birth dates rejected
- invalid application IDs rejected before database access
- missing saved application returns `404`
- leap year dates supported
- birth date on the last day of month counts one day in the first month
- first month payment starts from the birth date and not from the first day of the month

---

## Known Limitations

- this is a simplified parental benefit model and does not include real-world legal exceptions or additional benefit rules
- there is no authentication, so saved applications are accessed only by application ID
- persistence is local to the SQLite database file used in the runtime environment
- frontend tests are not included yet; current automated coverage focuses on backend calculation and API behaviour
- frontend tests are not included; current automated coverage focuses on backend calculation, API behaviour and accessibility regression

---

## Discussion Points

Topics we would be ready to discuss in a technical interview:

- how we prioritised requirement coverage first, then validation, then automated tests
- how save/load UX was simplified to reduce user confusion
- how input validation is split between UX-friendly frontend feedback and backend contract enforcement
- how accessibility requirements were addressed systematically (skip links, ARIA, focus management, screen reader support)
- what we would improve next with more time: additional benefit rules, CI coverage reporting and Docker deployment pipeline

---

## Running the Project Locally

### 1 Install dependencies

npm install

### 2 Start the server

npm start

Optional custom port:

Linux/macOS:

PORT=3001 npm start

Windows PowerShell:

$env:PORT=3001; npm start

### 3 Open in browser

http://localhost:3000 (or your custom `PORT`)

### 4 Run tests

npm test

### 5 Run tests with coverage

npm run coverage

---

## Run with Docker

### 1 Build image

docker build -t parental-benefit-calculator .

### 2 Run container

docker run --rm -p 3000:3000 -v parental-benefit-data:/app/data parental-benefit-calculator

### 3 Open in browser

http://localhost:3000

Notes:

- database is persisted in Docker volume `parental-benefit-data`
- app uses `DB_PATH=/app/data/benefits.db` inside container
- to stop container, press `Ctrl+C`

---

## Example Workflow

1. Enter **gross monthly salary**
2. Select **child's birth date**
3. The calculator automatically displays:
   - payment schedule
   - calculation summary
   - payment chart
4. Optionally:
   - save calculation
   - load later by application ID
   - load latest saved calculation
   - download PDF

---

## Continuous Integration

Tests run automatically on every push and pull request via **Gitea Actions**:

- Workflow: `.gitea/workflows/test.yml`
- Triggers: `main`, `develop`, and `feat/**` branches
- Actions:
  1. Checkout code
  2. Setup Node.js 20.x
  3. Install dependencies (cached)
  4. Run test suite (`npm test`)
  5. Run coverage report (`npm run coverage`)
  6. Report results

All 17 tests must pass before merging to `main`.

---

## Continuous Deployment

On every push to `main`, the application is automatically deployed to staging via **Gitea Actions**:

- Workflow: `.gitea/workflows/deploy.yml`
- Triggers: push to `main`
- Actions:
  1. Build Docker image
  2. Push image to container registry
  3. SSH into staging server
  4. Pull latest image and restart container

**Required Gitea secrets:**

| Secret | Description |
|---|---|
| `REGISTRY_URL` | Container registry URL |
| `REGISTRY_USER` | Registry username |
| `REGISTRY_PASSWORD` | Registry password |
| `STAGING_HOST` | Staging server hostname or IP |
| `STAGING_USER` | SSH username |
| `STAGING_SSH_KEY` | SSH private key |

---

## Possible Improvements

With more time the following could be added:

- additional benefit rules (income cap, marital status, etc.)
- test coverage reporting
- automated deployment to staging environment

---

## Author

Project created as part of a technical coding task.
