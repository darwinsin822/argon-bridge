import { z } from 'zod';
// ==========================================
// ENUMS & CONSTANTS
// ==========================================
export const TaskStatusEnum = z.enum([
    'PENDING',
    'PLANNING',
    'READY',
    'RUNNING',
    'REVIEW',
    'COMPLETED',
    'BLOCKED',
    'FAILED',
    'CANCELLED',
]);
export const TaskPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const AgentRoleEnum = z.enum([
    'ARCHITECT',
    'BACKEND',
    'FRONTEND',
    'QA',
    'INTEGRATOR',
    'GENERAL',
]);
export const EventTypeEnum = z.enum([
    'TASK_CREATED',
    'TASK_STATUS_CHANGED',
    'TASK_DELEGATED',
    'RESULT_SUBMITTED',
    'REVIEW_COMPLETED',
    'SUPERVISOR_ALERT',
    'PROJECT_CREATED',
    'SESSION_STARTED',
]);
// ==========================================
// ENTITY SCHEMAS
// ==========================================
export const ProjectSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    description: z.string().default(''),
    architectureSummary: z.string().default(''),
    createdAt: z.string(),
    updatedAt: z.string(),
    status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED']).default('ACTIVE'),
});
export const SessionSchema = z.object({
    id: z.string().uuid(),
    projectId: z.string().uuid(),
    title: z.string().default('Default Session'),
    startedAt: z.string(),
    endedAt: z.string().nullable().default(null),
    activeAgentId: z.string().nullable().default(null),
    metadata: z.record(z.any()).default({}),
});
export const TaskSchema = z.object({
    id: z.string().uuid(),
    projectId: z.string().uuid(),
    name: z.string().min(1),
    description: z.string().default(''),
    priority: TaskPriorityEnum.default('MEDIUM'),
    status: TaskStatusEnum.default('PENDING'),
    dependencies: z.array(z.string().uuid()).default([]),
    assignedAgent: z.string().nullable().default(null),
    attempts: z.number().int().nonnegative().default(0),
    maxAttempts: z.number().int().positive().default(3),
    reviewCycles: z.number().int().nonnegative().default(0),
    maxReviewCycles: z.number().int().positive().default(2),
    acceptanceCriteria: z.array(z.string()).default([]),
    result: z.string().nullable().default(null),
    lastResultHash: z.string().nullable().default(null),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export const SubtaskSchema = z.object({
    id: z.string().uuid(),
    parentTaskId: z.string().uuid(),
    name: z.string().min(1),
    status: TaskStatusEnum.default('PENDING'),
    assignedAgent: z.string().nullable().default(null),
    result: z.string().nullable().default(null),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export const AgentSchema = z.object({
    id: z.string(),
    name: z.string(),
    role: AgentRoleEnum.default('GENERAL'),
    capabilities: z.array(z.string()).default([]),
    status: z.enum(['IDLE', 'BUSY', 'OFFLINE']).default('IDLE'),
    currentTaskId: z.string().uuid().nullable().default(null),
    lastActiveAt: z.string(),
});
export const MessageSchema = z.object({
    id: z.string().uuid(),
    sessionId: z.string().uuid(),
    sender: z.string(), // 'ARGON_GEMINI' | 'ANTIGRAVITY' | 'SUPERVISOR' | agent ID
    recipient: z.string(),
    content: z.string(),
    taskId: z.string().uuid().nullable().default(null),
    timestamp: z.string(),
});
export const ExecutionSchema = z.object({
    id: z.string().uuid(),
    taskId: z.string().uuid(),
    agentId: z.string(),
    attemptNumber: z.number().int().positive(),
    status: z.enum(['RUNNING', 'SUCCESS', 'FAILURE', 'TIMEOUT', 'CANCELLED']),
    output: z.string().nullable().default(null),
    errorMessage: z.string().nullable().default(null),
    startedAt: z.string(),
    finishedAt: z.string().nullable().default(null),
    durationMs: z.number().nonnegative().nullable().default(null),
});
export const ReviewSchema = z.object({
    id: z.string().uuid(),
    taskId: z.string().uuid(),
    cycleNumber: z.number().int().positive(),
    reviewer: z.string().default('ARGON_SUPERVISOR'),
    approved: z.boolean(),
    feedback: z.string(),
    criteriaEvaluations: z.record(z.boolean()).default({}),
    createdAt: z.string(),
});
export const EventSchema = z.object({
    id: z.string().uuid(),
    projectId: z.string().uuid().nullable().default(null),
    taskId: z.string().uuid().nullable().default(null),
    type: EventTypeEnum,
    payload: z.record(z.any()).default({}),
    timestamp: z.string(),
});
export const ConfigurationSchema = z.object({
    maxRetries: z.number().int().positive().default(3),
    maxReviewCycles: z.number().int().positive().default(2),
    maxParallelTasks: z.number().int().positive().default(4),
    taskTimeoutMinutes: z.number().int().positive().default(15),
    databasePath: z.string().default('argon.db'),
    httpPort: z.number().int().positive().default(4173),
    httpHost: z.literal('127.0.0.1').default('127.0.0.1'),
    similarityThreshold: z.number().min(0).max(1).default(0.85),
});
//# sourceMappingURL=types.js.map