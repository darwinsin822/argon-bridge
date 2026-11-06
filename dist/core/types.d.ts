import { z } from 'zod';
export declare const TaskStatusEnum: z.ZodEnum<["PENDING", "PLANNING", "READY", "RUNNING", "REVIEW", "COMPLETED", "BLOCKED", "FAILED", "CANCELLED"]>;
export type TaskStatus = z.infer<typeof TaskStatusEnum>;
export declare const TaskPriorityEnum: z.ZodEnum<["LOW", "MEDIUM", "HIGH", "CRITICAL"]>;
export type TaskPriority = z.infer<typeof TaskPriorityEnum>;
export declare const AgentRoleEnum: z.ZodEnum<["ARCHITECT", "BACKEND", "FRONTEND", "QA", "INTEGRATOR", "GENERAL"]>;
export type AgentRole = z.infer<typeof AgentRoleEnum>;
export declare const EventTypeEnum: z.ZodEnum<["TASK_CREATED", "TASK_STATUS_CHANGED", "TASK_DELEGATED", "RESULT_SUBMITTED", "REVIEW_COMPLETED", "SUPERVISOR_ALERT", "PROJECT_CREATED", "SESSION_STARTED"]>;
export type EventType = z.infer<typeof EventTypeEnum>;
export declare const ProjectSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodDefault<z.ZodString>;
    architectureSummary: z.ZodDefault<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    status: z.ZodDefault<z.ZodEnum<["ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"]>>;
}, "strip", z.ZodTypeAny, {
    status: "COMPLETED" | "ACTIVE" | "PAUSED" | "ARCHIVED";
    id: string;
    name: string;
    description: string;
    architectureSummary: string;
    createdAt: string;
    updatedAt: string;
}, {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    status?: "COMPLETED" | "ACTIVE" | "PAUSED" | "ARCHIVED" | undefined;
    description?: string | undefined;
    architectureSummary?: string | undefined;
}>;
export type Project = z.infer<typeof ProjectSchema>;
export declare const SessionSchema: z.ZodObject<{
    id: z.ZodString;
    projectId: z.ZodString;
    title: z.ZodDefault<z.ZodString>;
    startedAt: z.ZodString;
    endedAt: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    activeAgentId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    projectId: string;
    title: string;
    startedAt: string;
    endedAt: string | null;
    activeAgentId: string | null;
    metadata: Record<string, any>;
}, {
    id: string;
    projectId: string;
    startedAt: string;
    title?: string | undefined;
    endedAt?: string | null | undefined;
    activeAgentId?: string | null | undefined;
    metadata?: Record<string, any> | undefined;
}>;
export type Session = z.infer<typeof SessionSchema>;
export declare const TaskSchema: z.ZodObject<{
    id: z.ZodString;
    projectId: z.ZodString;
    name: z.ZodString;
    description: z.ZodDefault<z.ZodString>;
    priority: z.ZodDefault<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "CRITICAL"]>>;
    status: z.ZodDefault<z.ZodEnum<["PENDING", "PLANNING", "READY", "RUNNING", "REVIEW", "COMPLETED", "BLOCKED", "FAILED", "CANCELLED"]>>;
    dependencies: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    assignedAgent: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    attempts: z.ZodDefault<z.ZodNumber>;
    maxAttempts: z.ZodDefault<z.ZodNumber>;
    reviewCycles: z.ZodDefault<z.ZodNumber>;
    maxReviewCycles: z.ZodDefault<z.ZodNumber>;
    acceptanceCriteria: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    result: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    lastResultHash: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "PENDING" | "PLANNING" | "READY" | "RUNNING" | "REVIEW" | "COMPLETED" | "BLOCKED" | "FAILED" | "CANCELLED";
    id: string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    projectId: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    dependencies: string[];
    assignedAgent: string | null;
    attempts: number;
    maxAttempts: number;
    reviewCycles: number;
    maxReviewCycles: number;
    acceptanceCriteria: string[];
    result: string | null;
    lastResultHash: string | null;
}, {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    projectId: string;
    status?: "PENDING" | "PLANNING" | "READY" | "RUNNING" | "REVIEW" | "COMPLETED" | "BLOCKED" | "FAILED" | "CANCELLED" | undefined;
    description?: string | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | undefined;
    dependencies?: string[] | undefined;
    assignedAgent?: string | null | undefined;
    attempts?: number | undefined;
    maxAttempts?: number | undefined;
    reviewCycles?: number | undefined;
    maxReviewCycles?: number | undefined;
    acceptanceCriteria?: string[] | undefined;
    result?: string | null | undefined;
    lastResultHash?: string | null | undefined;
}>;
export type Task = z.infer<typeof TaskSchema>;
export declare const SubtaskSchema: z.ZodObject<{
    id: z.ZodString;
    parentTaskId: z.ZodString;
    name: z.ZodString;
    status: z.ZodDefault<z.ZodEnum<["PENDING", "PLANNING", "READY", "RUNNING", "REVIEW", "COMPLETED", "BLOCKED", "FAILED", "CANCELLED"]>>;
    assignedAgent: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    result: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "PENDING" | "PLANNING" | "READY" | "RUNNING" | "REVIEW" | "COMPLETED" | "BLOCKED" | "FAILED" | "CANCELLED";
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    assignedAgent: string | null;
    result: string | null;
    parentTaskId: string;
}, {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    parentTaskId: string;
    status?: "PENDING" | "PLANNING" | "READY" | "RUNNING" | "REVIEW" | "COMPLETED" | "BLOCKED" | "FAILED" | "CANCELLED" | undefined;
    assignedAgent?: string | null | undefined;
    result?: string | null | undefined;
}>;
export type Subtask = z.infer<typeof SubtaskSchema>;
export declare const AgentSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<["ARCHITECT", "BACKEND", "FRONTEND", "QA", "INTEGRATOR", "GENERAL"]>>;
    capabilities: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    status: z.ZodDefault<z.ZodEnum<["IDLE", "BUSY", "OFFLINE"]>>;
    currentTaskId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    lastActiveAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "IDLE" | "BUSY" | "OFFLINE";
    id: string;
    name: string;
    role: "ARCHITECT" | "BACKEND" | "FRONTEND" | "QA" | "INTEGRATOR" | "GENERAL";
    capabilities: string[];
    currentTaskId: string | null;
    lastActiveAt: string;
}, {
    id: string;
    name: string;
    lastActiveAt: string;
    status?: "IDLE" | "BUSY" | "OFFLINE" | undefined;
    role?: "ARCHITECT" | "BACKEND" | "FRONTEND" | "QA" | "INTEGRATOR" | "GENERAL" | undefined;
    capabilities?: string[] | undefined;
    currentTaskId?: string | null | undefined;
}>;
export type Agent = z.infer<typeof AgentSchema>;
export declare const MessageSchema: z.ZodObject<{
    id: z.ZodString;
    sessionId: z.ZodString;
    sender: z.ZodString;
    recipient: z.ZodString;
    content: z.ZodString;
    taskId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    sessionId: string;
    sender: string;
    recipient: string;
    content: string;
    taskId: string | null;
    timestamp: string;
}, {
    id: string;
    sessionId: string;
    sender: string;
    recipient: string;
    content: string;
    timestamp: string;
    taskId?: string | null | undefined;
}>;
export type Message = z.infer<typeof MessageSchema>;
export declare const ExecutionSchema: z.ZodObject<{
    id: z.ZodString;
    taskId: z.ZodString;
    agentId: z.ZodString;
    attemptNumber: z.ZodNumber;
    status: z.ZodEnum<["RUNNING", "SUCCESS", "FAILURE", "TIMEOUT", "CANCELLED"]>;
    output: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    errorMessage: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    startedAt: z.ZodString;
    finishedAt: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    durationMs: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    status: "RUNNING" | "CANCELLED" | "SUCCESS" | "FAILURE" | "TIMEOUT";
    id: string;
    startedAt: string;
    taskId: string;
    agentId: string;
    attemptNumber: number;
    output: string | null;
    errorMessage: string | null;
    finishedAt: string | null;
    durationMs: number | null;
}, {
    status: "RUNNING" | "CANCELLED" | "SUCCESS" | "FAILURE" | "TIMEOUT";
    id: string;
    startedAt: string;
    taskId: string;
    agentId: string;
    attemptNumber: number;
    output?: string | null | undefined;
    errorMessage?: string | null | undefined;
    finishedAt?: string | null | undefined;
    durationMs?: number | null | undefined;
}>;
export type Execution = z.infer<typeof ExecutionSchema>;
export declare const ReviewSchema: z.ZodObject<{
    id: z.ZodString;
    taskId: z.ZodString;
    cycleNumber: z.ZodNumber;
    reviewer: z.ZodDefault<z.ZodString>;
    approved: z.ZodBoolean;
    feedback: z.ZodString;
    criteriaEvaluations: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodBoolean>>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    taskId: string;
    cycleNumber: number;
    reviewer: string;
    approved: boolean;
    feedback: string;
    criteriaEvaluations: Record<string, boolean>;
}, {
    id: string;
    createdAt: string;
    taskId: string;
    cycleNumber: number;
    approved: boolean;
    feedback: string;
    reviewer?: string | undefined;
    criteriaEvaluations?: Record<string, boolean> | undefined;
}>;
export type Review = z.infer<typeof ReviewSchema>;
export declare const EventSchema: z.ZodObject<{
    id: z.ZodString;
    projectId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    taskId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    type: z.ZodEnum<["TASK_CREATED", "TASK_STATUS_CHANGED", "TASK_DELEGATED", "RESULT_SUBMITTED", "REVIEW_COMPLETED", "SUPERVISOR_ALERT", "PROJECT_CREATED", "SESSION_STARTED"]>;
    payload: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "TASK_CREATED" | "TASK_STATUS_CHANGED" | "TASK_DELEGATED" | "RESULT_SUBMITTED" | "REVIEW_COMPLETED" | "SUPERVISOR_ALERT" | "PROJECT_CREATED" | "SESSION_STARTED";
    id: string;
    projectId: string | null;
    taskId: string | null;
    timestamp: string;
    payload: Record<string, any>;
}, {
    type: "TASK_CREATED" | "TASK_STATUS_CHANGED" | "TASK_DELEGATED" | "RESULT_SUBMITTED" | "REVIEW_COMPLETED" | "SUPERVISOR_ALERT" | "PROJECT_CREATED" | "SESSION_STARTED";
    id: string;
    timestamp: string;
    projectId?: string | null | undefined;
    taskId?: string | null | undefined;
    payload?: Record<string, any> | undefined;
}>;
export type Event = z.infer<typeof EventSchema>;
export declare const ConfigurationSchema: z.ZodObject<{
    maxRetries: z.ZodDefault<z.ZodNumber>;
    maxReviewCycles: z.ZodDefault<z.ZodNumber>;
    maxParallelTasks: z.ZodDefault<z.ZodNumber>;
    taskTimeoutMinutes: z.ZodDefault<z.ZodNumber>;
    databasePath: z.ZodDefault<z.ZodString>;
    httpPort: z.ZodDefault<z.ZodNumber>;
    httpHost: z.ZodDefault<z.ZodLiteral<"127.0.0.1">>;
    similarityThreshold: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    maxReviewCycles: number;
    maxRetries: number;
    maxParallelTasks: number;
    taskTimeoutMinutes: number;
    databasePath: string;
    httpPort: number;
    httpHost: "127.0.0.1";
    similarityThreshold: number;
}, {
    maxReviewCycles?: number | undefined;
    maxRetries?: number | undefined;
    maxParallelTasks?: number | undefined;
    taskTimeoutMinutes?: number | undefined;
    databasePath?: string | undefined;
    httpPort?: number | undefined;
    httpHost?: "127.0.0.1" | undefined;
    similarityThreshold?: number | undefined;
}>;
export type Configuration = z.infer<typeof ConfigurationSchema>;
//# sourceMappingURL=types.d.ts.map