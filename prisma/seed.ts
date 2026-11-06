import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Enterprise Governance Hub database...");

  const defaultPasswordHash = bcrypt.hashSync("password123", 10);

  // Clean existing data
  await prisma.projectHealthCheck.deleteMany();
  await prisma.issueCollaborator.deleteMany();
  await prisma.worklog.deleteMany();
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

  // ----------------------------------------------------
  // PROJECT 3: Greenfield Milestone Delivery (Apollo Cloud Modernization)
  // ----------------------------------------------------
  const apolloProj = await prisma.project.create({
    data: {
      key: "APOLLO",
      name: "Project Apollo: Cloud Infrastructure Modernization",
      description: "Greenfield multi-region cloud migration with strict milestone gates and deliverables.",
      type: "GREENFIELD_MILESTONE",
      ragStatus: "GREEN",
      leadId: david.id,
      workspaceId: workspace.id,
      clientName: "Astra Dynamics Aerospace",
      startDate: new Date(now.getTime() - 30 * 86400000),
      targetDate: new Date(now.getTime() + 60 * 86400000),
      budgetHours: 400,
      budgetAmount: 64000,
      onboardingStatus: "COMPLETED",
      kickoffChecklist: JSON.stringify([
        { text: "Architectural blueprint and security whitepaper approved", completed: true },
        { text: "Master Services Agreement (MSA) signed with Astra Dynamics", completed: true },
        { text: "Multi-account AWS Landing Zone & Terraform state backend created", completed: true },
        { text: "CI/CD runner permissions and secrets configured", completed: true },
        { text: "Client stakeholder weekly cadence established", completed: true },
      ]),
    },
  });

  const apolloWorkflow = await prisma.workflow.create({
    data: {
      name: "Milestone Delivery Workflow",
      projectId: apolloProj.id,
    },
  });

  const apBacklog = await prisma.workflowStatus.create({
    data: { workflowId: apolloWorkflow.id, name: "Backlog", category: "TODO", color: "#64748b", order: 1 },
  });
  const apTodo = await prisma.workflowStatus.create({
    data: { workflowId: apolloWorkflow.id, name: "To Do", category: "TODO", color: "#3b82f6", order: 2 },
  });
  const apInProgress = await prisma.workflowStatus.create({
    data: { workflowId: apolloWorkflow.id, name: "In Progress", category: "IN_PROGRESS", color: "#f59e0b", order: 3 },
  });
  const apReview = await prisma.workflowStatus.create({
    data: { workflowId: apolloWorkflow.id, name: "Code Review", category: "IN_REVIEW", color: "#8b5cf6", order: 4 },
  });
  const apQa = await prisma.workflowStatus.create({
    data: { workflowId: apolloWorkflow.id, name: "UAT & QA", category: "IN_REVIEW", color: "#ec4899", order: 5 },
  });
  const apDone = await prisma.workflowStatus.create({
    data: { workflowId: apolloWorkflow.id, name: "Done", category: "DONE", color: "#10b981", order: 6 },
  });

  await prisma.workflowTransition.createMany({
    data: [
      { workflowId: apolloWorkflow.id, name: "Start Work", fromStatusId: apTodo.id, toStatusId: apInProgress.id },
      { workflowId: apolloWorkflow.id, name: "Submit for Review", fromStatusId: apInProgress.id, toStatusId: apReview.id },
      { workflowId: apolloWorkflow.id, name: "Pass Review to QA", fromStatusId: apReview.id, toStatusId: apQa.id },
      { workflowId: apolloWorkflow.id, name: "Client Sign Off", fromStatusId: apQa.id, toStatusId: apDone.id, requiredRole: "QA" },
      { workflowId: apolloWorkflow.id, name: "Reopen", fromStatusId: apDone.id, toStatusId: apTodo.id, requiredRole: "LEAD" },
    ],
  });

  // Greenfield Milestones
  const apM1 = await prisma.milestone.create({
    data: {
      projectId: apolloProj.id,
      title: "Milestone 1: Architecture Specs & Threat Model",
      description: "Baseline enterprise cloud topology, compliance review, and landing zone definition.",
      targetDate: new Date(now.getTime() - 10 * 86400000),
      status: "REACHED",
      estimatedHours: 80,
      loggedHours: 78,
      order: 1,
      progressPercent: 100,
    },
  });

  const apM2 = await prisma.milestone.create({
    data: {
      projectId: apolloProj.id,
      title: "Milestone 2: Core Microservices & Database Migration",
      description: "Containerized workload deployment, Postgres read-replicas, and data sync pipeline.",
      targetDate: new Date(now.getTime() + 15 * 86400000),
      status: "OPEN",
      estimatedHours: 140,
      loggedHours: 96,
      order: 2,
      progressPercent: 68,
    },
  });

  const apM3 = await prisma.milestone.create({
    data: {
      projectId: apolloProj.id,
      title: "Milestone 3: Zero-Trust IAM & Vault Secrets",
      description: "HashiCorp Vault automated rotation, OIDC integration, and network isolation.",
      targetDate: new Date(now.getTime() + 35 * 86400000),
      status: "OPEN",
      estimatedHours: 100,
      loggedHours: 32,
      order: 3,
      progressPercent: 32,
    },
  });

  const apM4 = await prisma.milestone.create({
    data: {
      projectId: apolloProj.id,
      title: "Milestone 4: UAT & Multi-Region Production Cutover",
      description: "Final client user acceptance testing, failover drill, and DNS traffic switch.",
      targetDate: new Date(now.getTime() + 60 * 86400000),
      status: "OPEN",
      estimatedHours: 80,
      loggedHours: 0,
      order: 4,
      progressPercent: 0,
    },
  });

  // Greenfield Issues (with multi-user collaborative tasks)
  const apIssue1 = await prisma.issue.create({
    data: {
      key: "APOLLO-1",
      numId: 1,
      title: "Design Multi-Account AWS Landing Zone Architecture",
      description: "Define VPC peering, Transit Gateway routing, and SOC2 compliance controls.",
      type: "TASK",
      priority: "HIGH",
      statusId: apDone.id,
      projectId: apolloProj.id,
      milestoneId: apM1.id,
      assigneeId: david.id,
      reporterId: sarah.id,
      estimatedHours: 35,
      loggedHours: 35,
      category: "ARCHITECTURE",
    },
  });

  const apIssue2 = await prisma.issue.create({
    data: {
      key: "APOLLO-2",
      numId: 2,
      title: "Automate EKS Kubernetes Cluster Provisioning with Terraform",
      description: "Automate worker node autoscaling, EBS CSI driver, and cert-manager.",
      type: "TASK",
      priority: "CRITICAL",
      statusId: apDone.id,
      projectId: apolloProj.id,
      milestoneId: apM1.id,
      assigneeId: elena.id,
      reporterId: david.id,
      estimatedHours: 45,
      loggedHours: 43,
      category: "DEVOPS",
    },
  });

  // Collaborative Task 1: Elena + David collaborating on Database Migration
  const apIssue3 = await prisma.issue.create({
    data: {
      key: "APOLLO-3",
      numId: 3,
      title: "PostgreSQL Database Migration with Zero-Downtime CDC Stream",
      description: "Configure AWS DMS replication instance and validate checksums across source and target DBs.",
      type: "STORY",
      priority: "CRITICAL",
      statusId: apInProgress.id,
      projectId: apolloProj.id,
      milestoneId: apM2.id,
      assigneeId: elena.id,
      reporterId: david.id,
      estimatedHours: 60,
      loggedHours: 44,
      category: "DATABASE",
    },
  });

  // Add Collaborators to APOLLO-3
  await prisma.issueCollaborator.createMany({
    data: [
      { issueId: apIssue3.id, userId: elena.id, role: "LEAD_DEV" },
      { issueId: apIssue3.id, userId: david.id, role: "REVIEWER" },
      { issueId: apIssue3.id, userId: marcus.id, role: "QA_VERIFIER" },
    ],
  });

  // Subtasks for APOLLO-3
  await prisma.issue.create({
    data: {
      key: "APOLLO-3A",
      numId: 31,
      title: "Configure DMS Replication Tasks and Migration Rules",
      type: "SUB_TASK",
      priority: "HIGH",
      statusId: apDone.id,
      projectId: apolloProj.id,
      parentId: apIssue3.id,
      assigneeId: elena.id,
      reporterId: david.id,
      estimatedHours: 20,
      loggedHours: 20,
    },
  });

  await prisma.issue.create({
    data: {
      key: "APOLLO-3B",
      numId: 32,
      title: "Run Row Count and Foreign Key Integrity Validation Script",
      type: "SUB_TASK",
      priority: "HIGH",
      statusId: apInProgress.id,
      projectId: apolloProj.id,
      parentId: apIssue3.id,
      assigneeId: marcus.id,
      reporterId: elena.id,
      estimatedHours: 15,
      loggedHours: 12,
    },
  });

  // Collaborative Task 2: HashiCorp Vault Secrets
  const apIssue4 = await prisma.issue.create({
    data: {
      key: "APOLLO-4",
      numId: 4,
      title: "Deploy HashiCorp Vault Cluster with Automated Credential Rotation",
      description: "Integrate Kubernetes ServiceAccount token auth with Vault backend engine.",
      type: "STORY",
      priority: "HIGH",
      statusId: apReview.id,
      projectId: apolloProj.id,
      milestoneId: apM3.id,
      assigneeId: david.id,
      reporterId: alex.id,
      estimatedHours: 40,
      loggedHours: 32,
      category: "SECURITY",
    },
  });

  await prisma.issueCollaborator.createMany({
    data: [
      { issueId: apIssue4.id, userId: david.id, role: "LEAD_DEV" },
      { issueId: apIssue4.id, userId: elena.id, role: "PAIR_DEV" },
    ],
  });

  const apIssue5 = await prisma.issue.create({
    data: {
      key: "APOLLO-5",
      numId: 5,
      title: "Implement Istio Service Mesh & Mutual TLS between Pods",
      description: "Enforce mTLS strict mode and configure Envoy access logging to Elasticsearch.",
      type: "TASK",
      priority: "MEDIUM",
      statusId: apTodo.id,
      projectId: apolloProj.id,
      milestoneId: apM2.id,
      assigneeId: elena.id,
      reporterId: david.id,
      estimatedHours: 30,
      loggedHours: 0,
      category: "NETWORKING",
    },
  });

  await prisma.issueCollaborator.createMany({
    data: [
      { issueId: apIssue5.id, userId: elena.id, role: "LEAD_DEV" },
      { issueId: apIssue5.id, userId: david.id, role: "CONSULTANT" },
    ],
  });

  const apIssue6 = await prisma.issue.create({
    data: {
      key: "APOLLO-6",
      numId: 6,
      title: "Simulate Multi-Region Disaster Recovery & DNS Failover Drill",
      description: "Run test failover scenario transferring 100% simulated load to US-West-2 within 4 minutes.",
      type: "TASK",
      priority: "CRITICAL",
      statusId: apBacklog.id,
      projectId: apolloProj.id,
      milestoneId: apM4.id,
      assigneeId: marcus.id,
      reporterId: sarah.id,
      estimatedHours: 40,
      loggedHours: 0,
      category: "QA",
    },
  });

  // Time logs for Apollo
  await prisma.worklog.createMany({
    data: [
      {
        issueId: apIssue1.id,
        userId: david.id,
        timeSpentHours: 20,
        description: "Drafted VPC subnet layout, Transit Gateway attachments, and egress proxy routing.",
        billable: true,
        category: "ARCHITECTURE",
        dateWorked: new Date(now.getTime() - 24 * 86400000),
      },
      {
        issueId: apIssue1.id,
        userId: david.id,
        timeSpentHours: 15,
        description: "Stakeholder security review and whitepaper signoff with Astra client team.",
        billable: true,
        category: "MEETING",
        dateWorked: new Date(now.getTime() - 20 * 86400000),
      },
      {
        issueId: apIssue3.id,
        userId: elena.id,
        timeSpentHours: 28,
        description: "Configured AWS DMS replication instances, tested endpoint SSL certificates.",
        billable: true,
        category: "DEVELOPMENT",
        dateWorked: new Date(now.getTime() - 4 * 86400000),
      },
      {
        issueId: apIssue3.id,
        userId: david.id,
        timeSpentHours: 16,
        description: "Co-working session on Postgres index tuning and CDC lag reduction.",
        billable: true,
        category: "CODE_REVIEW",
        dateWorked: new Date(now.getTime() - 2 * 86400000),
      },
      {
        issueId: apIssue4.id,
        userId: david.id,
        timeSpentHours: 20,
        description: "Terraformed Vault high-availability cluster on AWS KMS backend.",
        billable: true,
        category: "DEVOPS",
        dateWorked: new Date(now.getTime() - 3 * 86400000),
      },
      {
        issueId: apIssue4.id,
        userId: elena.id,
        timeSpentHours: 12,
        description: "Wrote Kubernetes agent sidecar injector configuration for dynamic DB leases.",
        billable: true,
        category: "DEVELOPMENT",
        dateWorked: new Date(now.getTime() - 1 * 86400000),
      },
    ],
  });

  // Health Checks for Apollo Project
  await prisma.projectHealthCheck.createMany({
    data: [
      {
        projectId: apolloProj.id,
        status: "GREEN",
        scheduleHealth: "GREEN",
        budgetHealth: "GREEN",
        scopeHealth: "GREEN",
        clientSentiment: "EXCELLENT",
        summary: "Milestone 1 successfully reached ahead of target. Team velocity is optimal.",
        blockers: null,
        nextSteps: "Commence continuous data sync for Milestone 2 microservices.",
        authorId: david.id,
        createdAt: new Date(now.getTime() - 14 * 86400000),
      },
      {
        projectId: apolloProj.id,
        status: "GREEN",
        scheduleHealth: "GREEN",
        budgetHealth: "GREEN",
        scopeHealth: "GREEN",
        clientSentiment: "EXCELLENT",
        summary: "Milestone 2 is 68% complete. PostgreSQL replication verified with zero data loss.",
        blockers: "Minor lag on cross-region DMS instance during peak hours, resolved via IOPS boost.",
        nextSteps: "Complete Vault credential rotation and submit for client UAT testing.",
        authorId: david.id,
        createdAt: new Date(now.getTime() - 2 * 86400000),
      },
    ],
  });

  // ----------------------------------------------------
  // PROJECT 4: Retainer Style Project (Fintech Dedicated DevOps & SRE)
  // ----------------------------------------------------
  const retainProj = await prisma.project.create({
    data: {
      key: "RETAIN",
      name: "Fintech Global: Dedicated DevOps & SRE Retainer",
      description: "Monthly recurring retainer covering infrastructure reliability, security scans, cloud cost optimization, and SLA response.",
      type: "RETAINER",
      ragStatus: "AMBER",
      leadId: david.id,
      workspaceId: workspace.id,
      clientName: "Fintech Global Payments",
      startDate: new Date(now.getTime() - 90 * 86400000),
      targetDate: new Date(now.getTime() + 275 * 86400000),
      retainerHours: 50,
      retainerPeriod: "MONTHLY",
      retainerRolloverHours: 5,
      retainerRolloverCap: 10,
      retainerHourlyRate: 195,
      retainerOverageRate: 250,
      retainerStartDate: new Date(now.getFullYear(), now.getMonth(), 1),
      retainerRenewalDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      onboardingStatus: "COMPLETED",
      kickoffChecklist: JSON.stringify([
        { text: "Monthly recurring billing agreement active (50 hrs + 5 rollover)", completed: true },
        { text: "Direct PagerDuty escalation escalation bridge established", completed: true },
        { text: "Client AWS read/write IAM role assumed via STS", completed: true },
        { text: "Monthly vulnerability scanning schedule programmed", completed: true },
      ]),
    },
  });

  const retainWorkflow = await prisma.workflow.create({
    data: {
      name: "Retainer SRE Service Workflow",
      projectId: retainProj.id,
    },
  });

  const retBacklog = await prisma.workflowStatus.create({
    data: { workflowId: retainWorkflow.id, name: "Scheduled Queue", category: "TODO", color: "#64748b", order: 1 },
  });
  const retTodo = await prisma.workflowStatus.create({
    data: { workflowId: retainWorkflow.id, name: "This Cycle", category: "TODO", color: "#3b82f6", order: 2 },
  });
  const retInProgress = await prisma.workflowStatus.create({
    data: { workflowId: retainWorkflow.id, name: "In Progress", category: "IN_PROGRESS", color: "#f59e0b", order: 3 },
  });
  const retReview = await prisma.workflowStatus.create({
    data: { workflowId: retainWorkflow.id, name: "Client Review", category: "IN_REVIEW", color: "#8b5cf6", order: 4 },
  });
  const retDone = await prisma.workflowStatus.create({
    data: { workflowId: retainWorkflow.id, name: "Completed & Billed", category: "DONE", color: "#10b981", order: 5 },
  });

  await prisma.workflowTransition.createMany({
    data: [
      { workflowId: retainWorkflow.id, name: "Activate in Cycle", fromStatusId: retBacklog.id, toStatusId: retTodo.id },
      { workflowId: retainWorkflow.id, name: "Start Retainer Work", fromStatusId: retTodo.id, toStatusId: retInProgress.id },
      { workflowId: retainWorkflow.id, name: "Submit for Client Review", fromStatusId: retInProgress.id, toStatusId: retReview.id },
      { workflowId: retainWorkflow.id, name: "Complete Work", fromStatusId: retReview.id, toStatusId: retDone.id },
      { workflowId: retainWorkflow.id, name: "Reopen", fromStatusId: retDone.id, toStatusId: retTodo.id, requiredRole: "LEAD" },
    ],
  });

  // Retainer Tasks (with multi-user collaborative assignments)
  const retIssue1 = await prisma.issue.create({
    data: {
      key: "RETAIN-1",
      numId: 1,
      title: "Monthly PCI-DSS Compliance & CVE Security Patching",
      description: "Upgrade Linux kernel on all production bastion hosts and verify container base image CVEs.",
      type: "TASK",
      priority: "CRITICAL",
      statusId: retDone.id,
      projectId: retainProj.id,
      assigneeId: david.id,
      reporterId: sarah.id,
      estimatedHours: 12,
      loggedHours: 14,
      category: "MAINTENANCE",
    },
  });

  await prisma.issueCollaborator.createMany({
    data: [
      { issueId: retIssue1.id, userId: david.id, role: "LEAD_DEV" },
      { issueId: retIssue1.id, userId: marcus.id, role: "QA_VERIFIER" },
    ],
  });

  const retIssue2 = await prisma.issue.create({
    data: {
      key: "RETAIN-2",
      numId: 2,
      title: "PostgreSQL Query Performance Tuning & Autovacuum Reorganization",
      description: "Tune shared_buffers, analyze bloat on ledger_transactions table, and install pg_stat_statements.",
      type: "TASK",
      priority: "HIGH",
      statusId: retInProgress.id,
      projectId: retainProj.id,
      assigneeId: elena.id,
      reporterId: david.id,
      estimatedHours: 16,
      loggedHours: 18.5,
      category: "PERFORMANCE",
    },
  });

  await prisma.issueCollaborator.createMany({
    data: [
      { issueId: retIssue2.id, userId: elena.id, role: "LEAD_DEV" },
      { issueId: retIssue2.id, userId: david.id, role: "REVIEWER" },
    ],
  });

  const retIssue3 = await prisma.issue.create({
    data: {
      key: "RETAIN-3",
      numId: 3,
      title: "Upgrade Staging Kubernetes Clusters to v1.31 and reconcile Helm charts",
      description: "Test API deprecation removals and rollout node pools with zero pod evictions.",
      type: "TASK",
      priority: "MEDIUM",
      statusId: retReview.id,
      projectId: retainProj.id,
      assigneeId: david.id,
      reporterId: alex.id,
      estimatedHours: 10,
      loggedHours: 8,
      category: "DEVOPS",
    },
  });

  await prisma.issueCollaborator.createMany({
    data: [
      { issueId: retIssue3.id, userId: david.id, role: "LEAD_DEV" },
      { issueId: retIssue3.id, userId: elena.id, role: "PAIR_DEV" },
    ],
  });

  const retIssue4 = await prisma.issue.create({
    data: {
      key: "RETAIN-4",
      numId: 4,
      title: "Investigate and resolve intermittent Stripe webhook delivery timeouts",
      description: "Diagnose connection drops during flash settlement bursts; increase worker concurrency pool.",
      type: "INCIDENT",
      priority: "CRITICAL",
      statusId: retDone.id,
      projectId: retainProj.id,
      assigneeId: elena.id,
      reporterId: priya.id,
      estimatedHours: 6,
      loggedHours: 6,
      category: "SLA",
    },
  });

  await prisma.issueCollaborator.createMany({
    data: [
      { issueId: retIssue4.id, userId: elena.id, role: "LEAD_DEV" },
      { issueId: retIssue4.id, userId: priya.id, role: "SUPPORT_AGENT" },
    ],
  });

  const retIssue5 = await prisma.issue.create({
    data: {
      key: "RETAIN-5",
      numId: 5,
      title: "Optimize GitHub Actions CI/CD Docker Layer Caching (Target < 5 mins)",
      description: "Configure BuildKit remote cache with GitHub Actions cache backend.",
      type: "TASK",
      priority: "LOW",
      statusId: retTodo.id,
      projectId: retainProj.id,
      assigneeId: elena.id,
      reporterId: david.id,
      estimatedHours: 8,
      loggedHours: 0,
      category: "OPTIMIZATION",
    },
  });

  await prisma.issueCollaborator.createMany({
    data: [
      { issueId: retIssue5.id, userId: elena.id, role: "LEAD_DEV" },
      { issueId: retIssue5.id, userId: marcus.id, role: "QA_VERIFIER" },
    ],
  });

  // Worklogs for Retainer Project (Total logged = 14 + 18.5 + 8 + 6 = 46.5 hours out of 55 available)
  await prisma.worklog.createMany({
    data: [
      {
        issueId: retIssue1.id,
        userId: david.id,
        timeSpentHours: 9,
        description: "Applied security patches across 14 bastion and proxy nodes.",
        billable: true,
        category: "MAINTENANCE",
        dateWorked: new Date(now.getTime() - 8 * 86400000),
      },
      {
        issueId: retIssue1.id,
        userId: marcus.id,
        timeSpentHours: 5,
        description: "Vulnerability scan validation and compliance report generation.",
        billable: true,
        category: "QA",
        dateWorked: new Date(now.getTime() - 7 * 86400000),
      },
      {
        issueId: retIssue2.id,
        userId: elena.id,
        timeSpentHours: 11.5,
        description: "Diagnosed table bloat on transaction ledger; tuned autovacuum scale factors.",
        billable: true,
        category: "PERFORMANCE",
        dateWorked: new Date(now.getTime() - 4 * 86400000),
      },
      {
        issueId: retIssue2.id,
        userId: david.id,
        timeSpentHours: 7,
        description: "Co-investigation of p99 lock waits and index restructuring.",
        billable: true,
        category: "DEVELOPMENT",
        dateWorked: new Date(now.getTime() - 3 * 86400000),
      },
      {
        issueId: retIssue3.id,
        userId: david.id,
        timeSpentHours: 8,
        description: "Upgraded EKS staging control plane and worker node group to v1.31.",
        billable: true,
        category: "DEVOPS",
        dateWorked: new Date(now.getTime() - 2 * 86400000),
      },
      {
        issueId: retIssue4.id,
        userId: elena.id,
        timeSpentHours: 4,
        description: "Patched webhook consumer pool concurrency to eliminate timeout spikes.",
        billable: true,
        category: "SUPPORT",
        dateWorked: new Date(now.getTime() - 1 * 86400000),
      },
      {
        issueId: retIssue4.id,
        userId: priya.id,
        timeSpentHours: 2,
        description: "Client incident post-mortem call and ticket closure documentation.",
        billable: true,
        category: "SUPPORT",
        dateWorked: new Date(now.getTime() - 1 * 86400000),
      },
    ],
  });

  // Retainer Health Checks
  await prisma.projectHealthCheck.createMany({
    data: [
      {
        projectId: retainProj.id,
        status: "GREEN",
        scheduleHealth: "GREEN",
        budgetHealth: "GREEN",
        scopeHealth: "GREEN",
        clientSentiment: "EXCELLENT",
        summary: "Retainer cycle kickoff. Routine vulnerability patching completed on time.",
        blockers: null,
        nextSteps: "Proceed with scheduled K8s v1.31 upgrade.",
        authorId: david.id,
        createdAt: new Date(now.getTime() - 12 * 86400000),
      },
      {
        projectId: retainProj.id,
        status: "AMBER",
        scheduleHealth: "GREEN",
        budgetHealth: "AMBER",
        scopeHealth: "GREEN",
        clientSentiment: "GOOD",
        summary: "High retainer burn: 46.5 / 55 hours burned (84.5% consumed) with 10 days left in billing cycle.",
        blockers: "Unplanned emergency database performance remediation consumed 18.5 hours.",
        nextSteps: "Client notified of projected 10-hour overage at standard overage rate ($250/hr). Client signed off.",
        authorId: david.id,
        createdAt: new Date(now.getTime() - 1 * 86400000),
      },
    ],
  });

  // Core & Supp Health Checks
  await prisma.projectHealthCheck.create({
    data: {
      projectId: coreProj.id,
      status: "GREEN",
      scheduleHealth: "GREEN",
      budgetHealth: "GREEN",
      scopeHealth: "GREEN",
      clientSentiment: "EXCELLENT",
      summary: "Sprint 22 progressing smoothly. State machine transition guards completed.",
      authorId: david.id,
      createdAt: new Date(now.getTime() - 3 * 86400000),
    },
  });

  await prisma.projectHealthCheck.create({
    data: {
      projectId: suppProj.id,
      status: "AMBER",
      scheduleHealth: "AMBER",
      budgetHealth: "GREEN",
      scopeHealth: "AMBER",
      clientSentiment: "AT_RISK",
      summary: "SLA response target under pressure due to critical latency incident in US-East-1.",
      blockers: "Waiting on customer network firewall validation.",
      nextSteps: "Follow up with client enterprise network administrator.",
      authorId: priya.id,
      createdAt: new Date(now.getTime() - 1 * 86400000),
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
