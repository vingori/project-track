export type UserRole =
  | "ADMIN"
  | "PM"
  | "LEAD"
  | "DEV"
  | "QA"
  | "SUPPORT_AGENT"
  | "STAKEHOLDER";

export type ProjectType =
  | "GREENFIELD_MILESTONE"
  | "RETAINER"
  | "SOFTWARE_SCRUM"
  | "SOFTWARE_KANBAN"
  | "SUPPORT_DESK"
  | "HYBRID_MILESTONE";

export type IssueType =
  | "EPIC"
  | "STORY"
  | "TASK"
  | "BUG"
  | "INCIDENT"
  | "SERVICE_REQUEST"
  | "SUB_TASK";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "BLOCKER";

export type RagStatus = "GREEN" | "AMBER" | "RED";

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
}

export interface WorkflowTransitionSummary {
  id: string;
  name: string;
  fromStatusId: string;
  toStatusId: string;
  requiredRole?: string | null;
  toStatus: {
    id: string;
    name: string;
    category: string;
    color: string;
  };
}

export interface WorkflowStatusSummary {
  id: string;
  name: string;
  category: string;
  color: string;
  order: number;
  fromTrans?: WorkflowTransitionSummary[];
}

export interface IssueCollaboratorSummary {
  id: string;
  issueId: string;
  userId: string;
  role: string;
  assignedAt: string;
  user: UserSummary;
}

export interface MilestoneSummary {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  targetDate: string;
  status: "OPEN" | "REACHED" | "DELAYED";
  estimatedHours?: number | null;
  loggedHours?: number | null;
  order: number;
  progressPercent: number;
  _count?: {
    issues: number;
  };
}

export interface WorklogSummary {
  id: string;
  timeSpentHours: number;
  description?: string | null;
  billable: boolean;
  category: string;
  dateWorked: string;
  issueId: string;
  userId: string;
  user: UserSummary;
  issue?: {
    id: string;
    key: string;
    title: string;
    project?: {
      key: string;
      name: string;
      type: ProjectType;
    };
  };
  createdAt: string;
}

export interface ProjectHealthCheckSummary {
  id: string;
  projectId: string;
  status: RagStatus;
  scheduleHealth: RagStatus;
  budgetHealth: RagStatus;
  scopeHealth: RagStatus;
  clientSentiment: "EXCELLENT" | "GOOD" | "AT_RISK" | "POOR";
  summary: string;
  blockers?: string | null;
  nextSteps?: string | null;
  authorId: string;
  author: UserSummary;
  createdAt: string;
}

export interface IssueSummary {
  id: string;
  key: string;
  numId: number;
  title: string;
  description?: string | null;
  type: IssueType;
  category?: string | null;
  priority: Priority;
  statusId: string;
  status: WorkflowStatusSummary;
  projectId: string;
  sprintId?: string | null;
  milestoneId?: string | null;
  milestone?: MilestoneSummary | null;
  assigneeId?: string | null;
  assignee?: UserSummary | null;
  reporterId?: string | null;
  reporter?: UserSummary | null;
  collaborators?: IssueCollaboratorSummary[];
  storyPoints?: number | null;
  estimatedHours?: number | null;
  loggedHours?: number | null;
  dueDate?: string | null;
  slaFirstRespTarget?: string | null;
  slaFirstRespAt?: string | null;
  slaResolveTarget?: string | null;
  slaResolveAt?: string | null;
  slaBreached: boolean;
  customerEmail?: string | null;
  epic?: { id: string; key: string; title: string } | null;
  parent?: { id: string; key: string; title: string; type?: string } | null;
  subTasks?: Array<{
    id: string;
    key: string;
    title: string;
    estimatedHours?: number | null;
    loggedHours?: number | null;
    status: { id: string; name: string; category: string; color: string };
    assignee?: UserSummary | null;
  }>;
  comments?: Array<{
    id: string;
    body: string;
    isInternal: boolean;
    createdAt: string;
    author: UserSummary;
  }>;
  worklogs?: WorklogSummary[];
  auditLogs?: Array<{
    id: string;
    field: string;
    oldValue?: string | null;
    newValue?: string | null;
    createdAt: string;
    user?: UserSummary | null;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface SprintSummary {
  id: string;
  projectId: string;
  name: string;
  goal?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: "PLANNING" | "ACTIVE" | "COMPLETED";
  velocityPoints: number;
  issues?: IssueSummary[];
}

export interface ProjectDetail {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  type: ProjectType;
  ragStatus: RagStatus;
  lead?: UserSummary | null;
  clientName?: string | null;
  startDate?: string | null;
  targetDate?: string | null;
  budgetHours?: number | null;
  budgetAmount?: number | null;
  // Retainer
  retainerHours?: number | null;
  retainerPeriod?: string | null;
  retainerRolloverHours?: number | null;
  retainerRolloverCap?: number | null;
  retainerHourlyRate?: number | null;
  retainerOverageRate?: number | null;
  retainerStartDate?: string | null;
  retainerRenewalDate?: string | null;
  // Onboarding
  onboardingStatus?: string | null;
  onboardingStep?: number | null;
  kickoffChecklist?: string | null;
  // Relations
  milestones?: MilestoneSummary[];
  healthChecks?: ProjectHealthCheckSummary[];
  workflow?: {
    id: string;
    name: string;
    statuses: WorkflowStatusSummary[];
    transitions: WorkflowTransitionSummary[];
  } | null;
  sprints: SprintSummary[];
  slaPolicies: Array<{
    id: string;
    priority: string;
    firstResponseMins: number;
    resolutionMins: number;
  }>;
  stats?: {
    totalIssues: number;
    doneIssues: number;
    progressPercent: number;
    breachedCount: number;
    totalPoints: number;
    totalLoggedHours?: number;
    totalEstimatedHours?: number;
    billableHours?: number;
    retainerAvailableHours?: number;
    retainerUsedHours?: number;
    retainerRemainingHours?: number;
    retainerBurnPercent?: number;
    isOverage?: boolean;
    overageHours?: number;
  };
}
