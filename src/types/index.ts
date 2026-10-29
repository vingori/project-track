export type UserRole =
  | "ADMIN"
  | "PM"
  | "LEAD"
  | "DEV"
  | "QA"
  | "SUPPORT_AGENT"
  | "STAKEHOLDER";

export type ProjectType =
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
  | "SERVICE_REQUEST";

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

export interface IssueSummary {
  id: string;
  key: string;
  numId: number;
  title: string;
  description?: string | null;
  type: IssueType;
  priority: Priority;
  statusId: string;
  status: WorkflowStatusSummary;
  projectId: string;
  sprintId?: string | null;
  milestoneId?: string | null;
  assigneeId?: string | null;
  assignee?: UserSummary | null;
  reporterId?: string | null;
  reporter?: UserSummary | null;
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
  comments?: Array<{
    id: string;
    body: string;
    isInternal: boolean;
    createdAt: string;
    author: UserSummary;
  }>;
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
}
