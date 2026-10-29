import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Enterprise Governance Hub database...");

  const defaultPasswordHash = bcrypt.hashSync("password123", 10);

  // Clean existing data
  await prisma.webhookDelivery.deleteMany();
  await prisma.webhook.deleteMany();
  await prisma.customFieldValue.deleteMany();
  await prisma.customField.deleteMany();
  await prisma.gitPullRequest.deleteMany();
  await prisma.gitCommit.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.workflowTransition.deleteMany();
  await prisma.workflowStatus.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.slaPolicy.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.organization.deleteMany();

  // 1. Organization & Workspace
  const org = await prisma.organization.create({
    data: {
      name: "Acme Global Enterprise",
      slug: "acme-global",
    },
  });

  const workspace = await prisma.workspace.create({
    data: {
      name: "Engineering & Operations",
      slug: "eng-ops",
      orgId: org.id,
    },
  });

  // 2. Users (Across Roles)
  const alex = await prisma.user.create({
    data: {
      name: "Alex Vance",
      email: "alex.vance@acme.com",
      passwordHash: defaultPasswordHash,
      role: "ADMIN",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces",
      workspaceId: workspace.id,
    },
  });

  const sarah = await prisma.user.create({
    data: {
      name: "Sarah Jenkins",
      email: "sarah.j@acme.com",
      passwordHash: defaultPasswordHash,
      role: "PM",
      avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=faces",
      workspaceId: workspace.id,
    },
  });

  const david = await prisma.user.create({
    data: {
      name: "David Kumar",
      email: "david.k@acme.com",
      passwordHash: defaultPasswordHash,
      role: "LEAD",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces",
      workspaceId: workspace.id,
    },
  });

  const elena = await prisma.user.create({
    data: {
      name: "Elena Rostova",
      email: "elena.r@acme.com",
      passwordHash: defaultPasswordHash,
      role: "DEV",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=faces",
      workspaceId: workspace.id,
    },
  });

  const marcus = await prisma.user.create({
    data: {
      name: "Marcus Brody",
      email: "marcus.b@acme.com",
      passwordHash: defaultPasswordHash,
      role: "QA",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces",
      workspaceId: workspace.id,
    },
  });

  const priya = await prisma.user.create({
    data: {
      name: "Priya Patel",
      email: "priya.p@acme.com",
      passwordHash: defaultPasswordHash,
      role: "SUPPORT_AGENT",
      avatarUrl: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=100&h=100&fit=crop&crop=faces",
      workspaceId: workspace.id,
    },
  });

  // ----------------------------------------------------
  // PROJECT 1: Milestone & Sprint Delivery (Software Scrum)
  // ----------------------------------------------------
  const coreProj = await prisma.project.create({
    data: {
      key: "CORE",
      name: "Core Platform & NextGen Services",
      description: "Enterprise multi-tenant microservices architecture with high availability.",
      type: "SOFTWARE_SCRUM",
      ragStatus: "GREEN",
      leadId: david.id,
      workspaceId: workspace.id,
    },
  });

  // Workflow for CORE project
  const coreWorkflow = await prisma.workflow.create({
    data: {
      name: "Enterprise Agile Delivery Workflow",
      projectId: coreProj.id,
    },
  });

  const sBacklog = await prisma.workflowStatus.create({
    data: { workflowId: coreWorkflow.id, name: "Backlog", category: "TODO", color: "#64748b", order: 1 },
  });
  const sTodo = await prisma.workflowStatus.create({
    data: { workflowId: coreWorkflow.id, name: "To Do", category: "TODO", color: "#3b82f6", order: 2 },
  });
  const sInProgress = await prisma.workflowStatus.create({
    data: { workflowId: coreWorkflow.id, name: "In Progress", category: "IN_PROGRESS", color: "#f59e0b", order: 3 },
  });
  const sInReview = await prisma.workflowStatus.create({
    data: { workflowId: coreWorkflow.id, name: "Code Review", category: "IN_REVIEW", color: "#8b5cf6", order: 4 },
  });
  const sInQa = await prisma.workflowStatus.create({
    data: { workflowId: coreWorkflow.id, name: "QA Validation", category: "IN_REVIEW", color: "#ec4899", order: 5 },
  });
  const sDone = await prisma.workflowStatus.create({
    data: { workflowId: coreWorkflow.id, name: "Done", category: "DONE", color: "#10b981", order: 6 },
  });

  // Create allowed transitions
  await prisma.workflowTransition.createMany({
    data: [
      { workflowId: coreWorkflow.id, name: "Sprint Commit", fromStatusId: sBacklog.id, toStatusId: sTodo.id },
      { workflowId: coreWorkflow.id, name: "Start Work", fromStatusId: sTodo.id, toStatusId: sInProgress.id },
      { workflowId: coreWorkflow.id, name: "Submit PR", fromStatusId: sInProgress.id, toStatusId: sInReview.id },
      { workflowId: coreWorkflow.id, name: "Pass Review to QA", fromStatusId: sInReview.id, toStatusId: sInQa.id },
      { workflowId: coreWorkflow.id, name: "Sign Off to Done", fromStatusId: sInQa.id, toStatusId: sDone.id, requiredRole: "QA" },
      { workflowId: coreWorkflow.id, name: "Request Changes", fromStatusId: sInReview.id, toStatusId: sInProgress.id },
      { workflowId: coreWorkflow.id, name: "QA Reject", fromStatusId: sInQa.id, toStatusId: sInProgress.id },
      { workflowId: coreWorkflow.id, name: "Reopen", fromStatusId: sDone.id, toStatusId: sTodo.id, requiredRole: "LEAD" },
    ],
  });

  // Sprints for CORE project
  const now = new Date();
  const sprint1 = await prisma.sprint.create({
    data: {
      projectId: coreProj.id,
      name: "Sprint 21 - Foundations",
      goal: "Architecture blueprint and baseline infrastructure",
      startDate: new Date(now.getTime() - 28 * 86400000),
      endDate: new Date(now.getTime() - 14 * 86400000),
      status: "COMPLETED",
      velocityPoints: 34,
    },
  });

  const sprint2 = await prisma.sprint.create({
    data: {
      projectId: coreProj.id,
      name: "Sprint 22 - Governance & State Machine",
      goal: "Deliver Multi-tenant RBAC, state machine transitions, and sprint boards",
      startDate: new Date(now.getTime() - 4 * 86400000),
      endDate: new Date(now.getTime() + 10 * 86400000),
      status: "ACTIVE",
      velocityPoints: 40,
    },
  });

  const sprint3 = await prisma.sprint.create({
    data: {
      projectId: coreProj.id,
      name: "Sprint 23 - Analytics & Audit Log",
      goal: "Cumulative flow diagrams, burndown rollups, and webhook engine",
      startDate: new Date(now.getTime() + 11 * 86400000),
      endDate: new Date(now.getTime() + 25 * 86400000),
      status: "PLANNING",
      velocityPoints: 28,
    },
  });

  // Milestones for CORE project
  const milestoneQ3 = await prisma.milestone.create({
    data: {
      projectId: coreProj.id,
      title: "v2.0 General Availability Release",
      description: "Production launch across global regions",
      targetDate: new Date(now.getTime() + 45 * 86400000),
      status: "OPEN",
    },
  });

  // Issues in CORE Project
  const epic1 = await prisma.issue.create({
    data: {
      key: "CORE-1",
      numId: 1,
      title: "Multi-Tenant Enterprise Security & Governance Engine",
      description: "Root epic covering RBAC, audit trails, and fine-grained data isolation.",
      type: "EPIC",
      priority: "CRITICAL",
      statusId: sInProgress.id,
      projectId: coreProj.id,
      assigneeId: david.id,
      reporterId: sarah.id,
      storyPoints: 21,
      milestoneId: milestoneQ3.id,
    },
  });

  const issueCore2 = await prisma.issue.create({
    data: {
      key: "CORE-2",
      numId: 2,
      title: "Implement Granular RBAC Permission Matrix for Project Schemes",
      description: "Allow administrators to customize permission schemes across Dev, QA, Lead, and Viewer roles.",
      type: "STORY",
      priority: "HIGH",
      statusId: sInReview.id,
      projectId: coreProj.id,
      sprintId: sprint2.id,
      epicId: epic1.id,
      assigneeId: elena.id,
      reporterId: david.id,
      storyPoints: 8,
      estimatedHours: 16,
      loggedHours: 12,
    },
  });

  const issueCore3 = await prisma.issue.create({
    data: {
      key: "CORE-3",
      numId: 3,
      title: "Design Configurable State Machine Engine with Transition Guards",
      description: "Transitions must support role checks (e.g., only QA can approve transition to Done).",
      type: "STORY",
      priority: "CRITICAL",
      statusId: sInProgress.id,
      projectId: coreProj.id,
      sprintId: sprint2.id,
      epicId: epic1.id,
      assigneeId: elena.id,
      reporterId: alex.id,
      storyPoints: 13,
      estimatedHours: 24,
      loggedHours: 14,
    },
  });

  await prisma.issue.create({
    data: {
      key: "CORE-4",
      numId: 4,
      title: "Session token renewal race condition during concurrent tab refresh",
      description: "When multiple browser tabs make refresh token calls simultaneously, one fails with 401.",
      type: "BUG",
      priority: "HIGH",
      statusId: sInQa.id,
      projectId: coreProj.id,
      sprintId: sprint2.id,
      assigneeId: marcus.id,
      reporterId: elena.id,
      storyPoints: 5,
      estimatedHours: 8,
      loggedHours: 7,
    },
  });

  await prisma.issue.create({
    data: {
      key: "CORE-5",
      numId: 5,
      title: "Set up Redis cluster failover automated healthchecks",
      description: "Ensure sentinel failover alerts trigger within 30 seconds of node disconnection.",
      type: "TASK",
      priority: "MEDIUM",
      statusId: sDone.id,
      projectId: coreProj.id,
      sprintId: sprint2.id,
      assigneeId: david.id,
      reporterId: alex.id,
      storyPoints: 3,
      estimatedHours: 6,
      loggedHours: 5,
    },
  });

  await prisma.issue.create({
    data: {
      key: "CORE-6",
      numId: 6,
      title: "Database connection pooling & vacuum maintenance cron",
      description: "Tune pgBouncer connection limits and weekly autovacuum threshold settings.",
      type: "TASK",
      priority: "MEDIUM",
      statusId: sTodo.id,
      projectId: coreProj.id,
      sprintId: sprint2.id,
      assigneeId: alex.id,
      reporterId: david.id,
      storyPoints: 5,
      estimatedHours: 10,
      loggedHours: 0,
    },
  });

  await prisma.issue.create({
    data: {
      key: "CORE-7",
      numId: 7,
      title: "Integrate OpenTelemetry distributed tracing spans across API routes",
      description: "Standardize span names and propagate traceparent headers across internal HTTP requests.",
      type: "TASK",
      priority: "LOW",
      statusId: sBacklog.id,
      projectId: coreProj.id,
      assigneeId: elena.id,
      reporterId: alex.id,
      storyPoints: 8,
      estimatedHours: 16,
      loggedHours: 0,
    },
  });

  await prisma.issue.create({
    data: {
      key: "CORE-8",
      numId: 8,
      title: "Automated release pipeline rollback on 5xx error threshold breach",
      description: "Canary deployment script should revert Kubernetes deployments if 5xx exceeds 0.5% over 5 minutes.",
      type: "STORY",
      priority: "MEDIUM",
      statusId: sBacklog.id,
      projectId: coreProj.id,
      sprintId: sprint3.id,
      assigneeId: david.id,
      reporterId: sarah.id,
      storyPoints: 5,
      estimatedHours: 12,
      loggedHours: 0,
    },
  });

  // Level 3 Sub-tasks for CORE-2 (Parent Story)
  await prisma.issue.create({
    data: {
      key: "CORE-9",
      numId: 9,
      title: "Define role privilege enum and bitmask mapping",
      description: "Define ADMIN, PM, LEAD, DEV, QA bitmask weights and lookup helper.",
      type: "SUB_TASK",
      priority: "MEDIUM",
      statusId: sDone.id,
      projectId: coreProj.id,
      sprintId: sprint2.id,
      parentId: issueCore2.id,
      assigneeId: elena.id,
      reporterId: david.id,
      estimatedHours: 4,
      loggedHours: 4,
    },
  });

  await prisma.issue.create({
    data: {
      key: "CORE-10",
      numId: 10,
      title: "Write Jest test suite for permission scheme reducer",
      description: "Unit test all positive and negative permission evaluation matrix branches.",
      type: "SUB_TASK",
      priority: "HIGH",
      statusId: sInProgress.id,
      projectId: coreProj.id,
      sprintId: sprint2.id,
      parentId: issueCore2.id,
      assigneeId: elena.id,
      reporterId: david.id,
      estimatedHours: 6,
      loggedHours: 3,
    },
  });

  await prisma.issue.create({
    data: {
      key: "CORE-11",
      numId: 11,
      title: "Wire permission guard into project settings UI",
      description: "Disable settings actions for users without LEAD or ADMIN role.",
      type: "SUB_TASK",
      priority: "MEDIUM",
      statusId: sTodo.id,
      projectId: coreProj.id,
      sprintId: sprint2.id,
      parentId: issueCore2.id,
      assigneeId: david.id,
      reporterId: david.id,
      estimatedHours: 6,
      loggedHours: 0,
    },
  });

  // Level 3 Sub-tasks for CORE-3 (Parent Story)
  await prisma.issue.create({
    data: {
      key: "CORE-12",
      numId: 12,
      title: "Validate transition requiredRole in API PATCH route",
      description: "Enforce server-side role check before applying workflow status transition.",
      type: "SUB_TASK",
      priority: "CRITICAL",
      statusId: sDone.id,
      projectId: coreProj.id,
      sprintId: sprint2.id,
      parentId: issueCore3.id,
      assigneeId: elena.id,
      reporterId: alex.id,
      estimatedHours: 8,
      loggedHours: 8,
    },
  });

  await prisma.issue.create({
    data: {
      key: "CORE-13",
      numId: 13,
      title: "Add audit trail record on transition guard breach",
      description: "Persist audit log entry when an unauthorized transition attempt occurs.",
      type: "SUB_TASK",
      priority: "HIGH",
      statusId: sInProgress.id,
      projectId: coreProj.id,
      sprintId: sprint2.id,
      parentId: issueCore3.id,
      assigneeId: elena.id,
      reporterId: alex.id,
      estimatedHours: 4,
      loggedHours: 2,
    },
  });

  // ----------------------------------------------------
  // PROJECT 2: Support & Service Desk (Jira Service Desk)
  // ----------------------------------------------------
  const suppProj = await prisma.project.create({
    data: {
      key: "SUPP",
      name: "Customer Operations & Incident Desk",
      description: "SLA-driven customer support, incident response, and triage desk.",
      type: "SUPPORT_DESK",
      ragStatus: "AMBER",
      leadId: priya.id,
      workspaceId: workspace.id,
    },
  });

  // SLA Policies for SUPP project
  await prisma.slaPolicy.createMany({
    data: [
      { projectId: suppProj.id, priority: "CRITICAL", firstResponseMins: 15, resolutionMins: 120 },
      { projectId: suppProj.id, priority: "HIGH", firstResponseMins: 60, resolutionMins: 480 },
      { projectId: suppProj.id, priority: "MEDIUM", firstResponseMins: 240, resolutionMins: 1440 },
      { projectId: suppProj.id, priority: "LOW", firstResponseMins: 480, resolutionMins: 2880 },
    ],
  });

  // Workflow for SUPP project
  const suppWorkflow = await prisma.workflow.create({
    data: {
      name: "SLA Service Desk Workflow",
      projectId: suppProj.id,
    },
  });

  const tTriage = await prisma.workflowStatus.create({
    data: { workflowId: suppWorkflow.id, name: "Triage Queue", category: "TODO", color: "#6366f1", order: 1 },
  });
  const tInvestigating = await prisma.workflowStatus.create({
    data: { workflowId: suppWorkflow.id, name: "Investigating", category: "IN_PROGRESS", color: "#f59e0b", order: 2 },
  });
  const tWaitingCustomer = await prisma.workflowStatus.create({
    data: { workflowId: suppWorkflow.id, name: "Waiting on Customer", category: "IN_PROGRESS", color: "#3b82f6", order: 3 },
  });
  const tEscalated = await prisma.workflowStatus.create({
    data: { workflowId: suppWorkflow.id, name: "Escalated to Engineering", category: "IN_REVIEW", color: "#ef4444", order: 4 },
  });
  const tResolved = await prisma.workflowStatus.create({
    data: { workflowId: suppWorkflow.id, name: "Resolved", category: "DONE", color: "#10b981", order: 5 },
  });

  await prisma.workflowTransition.createMany({
    data: [
      { workflowId: suppWorkflow.id, name: "Assign & Investigate", fromStatusId: tTriage.id, toStatusId: tInvestigating.id },
      { workflowId: suppWorkflow.id, name: "Request Customer Info", fromStatusId: tInvestigating.id, toStatusId: tWaitingCustomer.id },
      { workflowId: suppWorkflow.id, name: "Customer Responded", fromStatusId: tWaitingCustomer.id, toStatusId: tInvestigating.id },
      { workflowId: suppWorkflow.id, name: "Escalate to L3/Engineering", fromStatusId: tInvestigating.id, toStatusId: tEscalated.id },
      { workflowId: suppWorkflow.id, name: "Resolve Incident", fromStatusId: tInvestigating.id, toStatusId: tResolved.id },
      { workflowId: suppWorkflow.id, name: "Resolve Escalation", fromStatusId: tEscalated.id, toStatusId: tResolved.id },
      { workflowId: suppWorkflow.id, name: "Reopen Ticket", fromStatusId: tResolved.id, toStatusId: tInvestigating.id },
    ],
  });

  // Support Tickets with realistic SLA timers
  const ticket1 = await prisma.issue.create({
    data: {
      key: "SUPP-1",
      numId: 1,
      title: "[URGENT] High API latency observed in US-East-1 region",
      description: "Enterprise tier client reporting 3000ms response times on GraphQL query endpoint.",
      type: "INCIDENT",
      priority: "CRITICAL",
      statusId: tInvestigating.id,
      projectId: suppProj.id,
      assigneeId: priya.id,
      reporterId: alex.id,
      customerEmail: "cto@globalfintech.com",
      slaFirstRespTarget: new Date(now.getTime() - 10 * 60000), // First response met
      slaFirstRespAt: new Date(now.getTime() - 12 * 60000),
      slaResolveTarget: new Date(now.getTime() + 45 * 60000), // 45 mins left!
      slaBreached: false,
    },
  });

  await prisma.comment.create({
    data: {
      issueId: ticket1.id,
      authorId: priya.id,
      body: "Initial triage completed. Confirmed spike in p99 latency starting at 14:20 UTC. Notified DevOps oncall.",
      isInternal: true,
    },
  });

  await prisma.issue.create({
    data: {
      key: "SUPP-2",
      numId: 2,
      title: "Request for custom SAML 2.0 SSO configuration for Okta IdP",
      description: "Customer needs assistance mapping custom attributes (department, costCenter) via SAML assertions.",
      type: "SERVICE_REQUEST",
      priority: "HIGH",
      statusId: tTriage.id,
      projectId: suppProj.id,
      reporterId: priya.id,
      customerEmail: "it-admin@megacorp.io",
      slaFirstRespTarget: new Date(now.getTime() + 25 * 60000), // 25 mins left to respond
      slaResolveTarget: new Date(now.getTime() + 380 * 60000),
      slaBreached: false,
    },
  });

  await prisma.issue.create({
    data: {
      key: "SUPP-3",
      numId: 3,
      title: "Intermittent HMAC signature verification failure on Stripe webhooks",
      description: "Approximately 2% of incoming invoice.payment_succeeded webhooks fail signature validation.",
      type: "INCIDENT",
      priority: "HIGH",
      statusId: tEscalated.id,
      projectId: suppProj.id,
      assigneeId: david.id,
      reporterId: priya.id,
      customerEmail: "billing-ops@saasplatform.com",
      slaFirstRespTarget: new Date(now.getTime() - 120 * 60000),
      slaFirstRespAt: new Date(now.getTime() - 140 * 60000),
      slaResolveTarget: new Date(now.getTime() - 30 * 60000), // Breached by 30 mins
      slaBreached: true,
    },
  });

  await prisma.issue.create({
    data: {
      key: "SUPP-4",
      numId: 4,
      title: "Bulk export request of all compliance audit logs for Q3 SOC2 audit",
      description: "Client needs full CSV export of all user permission changes between July 1 and September 30.",
      type: "SERVICE_REQUEST",
      priority: "MEDIUM",
      statusId: tWaitingCustomer.id,
      projectId: suppProj.id,
      assigneeId: priya.id,
      reporterId: sarah.id,
      customerEmail: "compliance@healthcarepartner.org",
      slaFirstRespTarget: new Date(now.getTime() - 200 * 60000),
      slaFirstRespAt: new Date(now.getTime() - 220 * 60000),
      slaResolveTarget: new Date(now.getTime() + 720 * 60000),
      slaBreached: false,
    },
  });

  await prisma.issue.create({
    data: {
      key: "SUPP-5",
      numId: 5,
      title: "Wildcard SSL certificate renewal completed for *.api.domain.com",
      description: "Let's Encrypt automated ACME challenge renewed successfully. Valid for 90 days.",
      type: "SERVICE_REQUEST",
      priority: "LOW",
      statusId: tResolved.id,
      projectId: suppProj.id,
      assigneeId: david.id,
      reporterId: priya.id,
      slaFirstRespTarget: new Date(now.getTime() - 500 * 60000),
      slaFirstRespAt: new Date(now.getTime() - 520 * 60000),
      slaResolveTarget: new Date(now.getTime() - 60 * 60000),
      slaResolveAt: new Date(now.getTime() - 80 * 60000),
      slaBreached: false,
    },
  });

  // ----------------------------------------------------
  // Git Integration Seed (Commits & PRs)
  // ----------------------------------------------------
  await prisma.gitCommit.createMany({
    data: [
      {
        hash: "a8f9c12",
        message: "feat(rbac): implement permission matrix scheme validation (refs CORE-2)",
        branch: "feature/CORE-2-rbac",
        authorName: "Elena Rostova",
        authorEmail: "elena.r@acme.com",
        repoName: "acme-corp/governance-core",
        url: "https://github.com/acme-corp/governance-core/commit/a8f9c12",
        issueId: issueCore2.id,
      },
      {
        hash: "b7e2d45",
        message: "test(rbac): add unit tests for project role guards",
        branch: "feature/CORE-2-rbac",
        authorName: "Elena Rostova",
        authorEmail: "elena.r@acme.com",
        repoName: "acme-corp/governance-core",
        url: "https://github.com/acme-corp/governance-core/commit/b7e2d45",
        issueId: issueCore2.id,
      },
      {
        hash: "d4e5f67",
        message: "feat(workflow): state machine role guard transition checks (fixes CORE-3)",
        branch: "feature/CORE-3-state-machine",
        authorName: "Elena Rostova",
        authorEmail: "elena.r@acme.com",
        repoName: "acme-corp/governance-core",
        url: "https://github.com/acme-corp/governance-core/commit/d4e5f67",
        issueId: issueCore3.id,
      },
    ],
  });

  await prisma.gitPullRequest.createMany({
    data: [
      {
        prNumber: 142,
        title: "feat(rbac): Granular RBAC Permission Matrix for Project Schemes",
        status: "OPEN",
        sourceBranch: "feature/CORE-2-rbac",
        targetBranch: "main",
        repoName: "acme-corp/governance-core",
        url: "https://github.com/acme-corp/governance-core/pull/142",
        issueId: issueCore2.id,
      },
      {
        prNumber: 141,
        title: "feat(workflow): Configurable State Machine Engine with Transition Guards",
        status: "MERGED",
        sourceBranch: "feature/CORE-3-state-machine",
        targetBranch: "main",
        repoName: "acme-corp/governance-core",
        url: "https://github.com/acme-corp/governance-core/pull/141",
        issueId: issueCore3.id,
      },
    ],
  });

  // ----------------------------------------------------
  // Dynamic Custom Fields Seed
  // ----------------------------------------------------
  const cfRelease = await prisma.customField.create({
    data: {
      projectId: coreProj.id,
      name: "Release Target",
      key: "release_target",
      fieldType: "SELECT",
      optionsJson: JSON.stringify(["v2.0-GA", "v2.1-Patch", "v3.0-Roadmap"]),
      required: false,
    },
  });

  const cfComponent = await prisma.customField.create({
    data: {
      projectId: coreProj.id,
      name: "Architecture Component",
      key: "arch_component",
      fieldType: "SELECT",
      optionsJson: JSON.stringify(["Identity & RBAC", "Workflow Engine", "Storage & DB", "DevOps & CI"]),
      required: false,
    },
  });

  const cfTier = await prisma.customField.create({
    data: {
      projectId: suppProj.id,
      name: "Customer Support Tier",
      key: "customer_support_tier",
      fieldType: "SELECT",
      optionsJson: JSON.stringify(["Mission Critical (Diamond)", "Enterprise (Gold)", "Standard (Silver)"]),
      required: true,
    },
  });

  // Assign custom field values
  await prisma.customFieldValue.create({
    data: {
      customFieldId: cfRelease.id,
      issueId: issueCore2.id,
      value: "v2.0-GA",
    },
  });

  await prisma.customFieldValue.create({
    data: {
      customFieldId: cfComponent.id,
      issueId: issueCore2.id,
      value: "Identity & RBAC",
    },
  });

  // ----------------------------------------------------
  // Automation Webhooks Seed
  // ----------------------------------------------------
  const webhook1 = await prisma.webhook.create({
    data: {
      name: "DevOps & Engineering Slack Channel",
      url: "https://api.acme-corp.internal/webhooks/slack-devops",
      events: "ISSUE_CREATED,STATUS_CHANGED,SLA_BREACHED",
      secret: "whsec_test_secret_123",
      active: true,
      projectId: coreProj.id,
    },
  });

  await prisma.webhookDelivery.create({
    data: {
      webhookId: webhook1.id,
      event: "STATUS_CHANGED",
      statusCode: 200,
      responseBody: '{"ok": true}',
      durationMs: 84,
    },
  });

  console.log("Database seeded successfully with enterprise data!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
