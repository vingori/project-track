# Zenith - Enterprise Project Governance & Delivery Hub

An enterprise-grade, modern alternative to Jira designed for unified agile delivery, service desk ticketing, configurable state-machine workflows, and executive governance.

---

## 🌟 Production-Grade Feature Matrix

### 1. Multi-Project Typologies
- **Milestone & Sprint Delivery (Jira Software equivalent)**:
  - Epics, User Stories, Tasks, and Bugs with story points estimation.
  - Active sprint planning, backlog prioritization, and sprint lifecycle transitions.
  - Interactive Kanban board with drag-and-drop workflow status updating.
- **Support & Incident Desk (Jira Service Management equivalent)**:
  - Incident response and service requests.
  - Real-time SLA resolution countdowns (breach tracking, warning thresholds).
  - Triage queues (*All Open*, *Needs Triage*, *At Risk / Breached*, *Waiting on Customer*).
  - Internal agent notes vs. customer-facing communication.

### 2. State-Machine Workflow Engine & Granular RBAC
- **Configurable Lifecycles**: Strict transition paths (e.g., *Backlog* $\to$ *To Do* $\to$ *In Progress* $\to$ *Code Review* $\to$ *QA Validation* $\to$ *Done*).
- **Transition Guards**: Restrict critical transitions by role (e.g., transition to *Done* requires **QA** role; reopening requires **LEAD**).

### 3. $0 Cost Authentication & Sessions
- **Self-Hosted NextAuth.js**: Encrypted HTTP-only JWT sessions stored locally in your database.
- **Enterprise Login Portal** (`/login`):
  - Corporate credentials with `bcrypt` password verification.
  - 1-Click Persona Sign-In for instant testing as `Alex (Admin)`, `Sarah (PM)`, `David (Lead)`, `Elena (Dev)`, `Marcus (QA)`, or `Priya (Support Agent)`.

### 4. Real-Time Multi-User Synchronization (SSE)
- Built-in **Server-Sent Events** streaming (`/api/events`).
- Whenever a card is moved, status changed, or comment added by any user, all other connected team members see the board update live without manual page refresh.

### 5. File Attachments & Screenshot Uploads
- Direct attachment upload (`/api/attachments`) with file size validation, audit logging, and direct download links.

### 6. Production Security & Observability
- **Security Headers**: CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`.
- **Health Check Probe** (`/api/health`): Monitors database latency, heap memory, and process uptime for Kubernetes/Docker container health.
- **Standalone Docker Build**: Multi-stage minimal footprint `Dockerfile` running unprivileged as `nextjs:nodejs`.

---

## 🚀 Running the Production Docker Stack

To run the complete production environment (Zenith Web Application + PostgreSQL + Redis):

```bash
docker compose up -d --build
```

Access the app at **http://localhost:3000**.

---

## 💻 Local Development

```bash
cd /Users/vineet/Documents/Personal
npm run dev
```

- Open **[http://localhost:3000](http://localhost:3000)**.
- Default corporate account credentials:
  - `alex.vance@acme.com` / `password123` (Admin)
  - `marcus.b@acme.com` / `password123` (QA)
  - `elena.r@acme.com` / `password123` (Developer)
  - `priya.p@acme.com` / `password123` (Support Agent)
- Shortcut: Press **`C`** anywhere to create a new work item.
