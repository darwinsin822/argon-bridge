import { z } from 'zod';
import { TaskPriorityEnum, TaskStatusEnum } from '../core/types.js';
export const MCP_TOOLS = [
    // 1. argon_create_project
    {
        name: 'argon_create_project',
        description: 'Creates a new project in Argon Bridge with architecture summary and requirements tracking.',
        inputSchema: {
            type: 'object',
            properties: {
                name: { type: 'string', description: 'Name of the project' },
                description: { type: 'string', description: 'Project description or objective' },
                architectureSummary: { type: 'string', description: 'Initial architectural notes or guidelines' },
            },
            required: ['name'],
        },
        handler: async (args, ctx) => {
            const schema = z.object({
                name: z.string().min(1),
                description: z.string().optional(),
                architectureSummary: z.string().optional(),
            });
            const data = schema.parse(args);
            const project = ctx.engine.createProject(data.name, data.description || '', data.architectureSummary || '');
            return {
                success: true,
                project,
                message: `Project "${project.name}" created successfully with ID: ${project.id}`,
            };
        },
    },
    // 2. argon_get_project
    {
        name: 'argon_get_project',
        description: 'Retrieves project details, metadata and current status.',
        inputSchema: {
            type: 'object',
            properties: {
                projectId: { type: 'string', description: 'UUID of the project' },
            },
            required: ['projectId'],
        },
        handler: async (args, ctx) => {
            const schema = z.object({ projectId: z.string().uuid() });
            const { projectId } = schema.parse(args);
            const project = ctx.repo.getProject(projectId);
            if (!project)
                throw new Error(`Project ${projectId} not found.`);
            return { success: true, project };
        },
    },
    // 3. argon_consult
    {
        name: 'argon_consult',
        description: 'Prepares a strategic architectural query for Argon / Gemini Web with current project context and task dependencies.',
        inputSchema: {
            type: 'object',
            properties: {
                projectId: { type: 'string', description: 'UUID of the project' },
                query: { type: 'string', description: 'Strategic question, dilemma, or architectural challenge to consult' },
                taskId: { type: 'string', description: 'Optional UUID of the specific task being consulted' },
            },
            required: ['projectId', 'query'],
        },
        handler: async (args, ctx) => {
            const schema = z.object({
                projectId: z.string().uuid(),
                query: z.string().min(1),
                taskId: z.string().uuid().optional(),
            });
            const { projectId, query, taskId } = schema.parse(args);
            const project = ctx.repo.getProject(projectId);
            if (!project)
                throw new Error(`Project ${projectId} not found.`);
            const contextSummary = ctx.memory.generateContextSummary(projectId);
            let taskDetails = '';
            if (taskId) {
                const task = ctx.repo.getTask(taskId);
                if (task) {
                    taskDetails = `\n\n### Task in Focus: ${task.name} (${task.status})\nDescription: ${task.description}\nCriteria: ${task.acceptanceCriteria.join(', ')}`;
                }
            }
            const consultationPacket = {
                consultationId: crypto.randomUUID(),
                timestamp: new Date().toISOString(),
                projectId,
                taskId: taskId || null,
                promptForGemini: `${contextSummary}${taskDetails}\n\n## STRATEGIC CONSULTATION REQUEST\n${query}\n\nProvide: (1) Architecture recommendation, (2) Subtask breakdown if needed, (3) Risk/pitfall mitigation guidelines.`,
            };
            return {
                success: true,
                consultation: consultationPacket,
                instructions: 'Use Chrome extension or copy prompt to Gemini Web for strategic insights, then submit decomposition via argon_plan.',
            };
        },
    },
    // 4. argon_plan
    {
        name: 'argon_plan',
        description: 'Plans and decomposes a project into tasks with dependencies, priorities, and acceptance criteria. Validates DAG graph to guarantee no circular dependencies.',
        inputSchema: {
            type: 'object',
            properties: {
                projectId: { type: 'string', description: 'UUID of the project' },
                tasks: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            tempId: { type: 'string', description: 'Temporary ID (e.g. task_backend) to link dependencies within the plan' },
                            name: { type: 'string', description: 'Task name' },
                            description: { type: 'string', description: 'Detailed description and responsibilities' },
                            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
                            dependsOnTempIds: { type: 'array', items: { type: 'string' }, description: 'tempIds of prerequisite tasks' },
                            dependencies: { type: 'array', items: { type: 'string' }, description: 'UUIDs of existing prerequisite tasks' },
                            acceptanceCriteria: { type: 'array', items: { type: 'string' }, description: 'Verification checklist' },
                        },
                        required: ['name'],
                    },
                },
            },
            required: ['projectId', 'tasks'],
        },
        handler: async (args, ctx) => {
            const schema = z.object({
                projectId: z.string().uuid(),
                tasks: z.array(z.object({
                    tempId: z.string().optional(),
                    name: z.string().min(1),
                    description: z.string().optional(),
                    priority: TaskPriorityEnum.optional(),
                    dependsOnTempIds: z.array(z.string()).optional(),
                    dependencies: z.array(z.string()).optional(),
                    acceptanceCriteria: z.array(z.string()).optional(),
                })),
            });
            const data = schema.parse(args);
            const planned = ctx.engine.planTasks(data);
            return {
                success: true,
                plannedCount: planned.length,
                tasks: planned,
                message: `Successfully planned and validated DAG for ${planned.length} tasks.`,
            };
        },
    },
    // 5. argon_delegate
    {
        name: 'argon_delegate',
        description: 'Delegates a task to an executor agent in Antigravity, advancing its state to RUNNING and recording execution attempt.',
        inputSchema: {
            type: 'object',
            properties: {
                taskId: { type: 'string', description: 'UUID of the task' },
                agentId: { type: 'string', description: 'ID or name of the assigned executor agent (e.g., AGENT_BACKEND)' },
            },
            required: ['taskId', 'agentId'],
        },
        handler: async (args, ctx) => {
            const schema = z.object({
                taskId: z.string().uuid(),
                agentId: z.string().min(1),
            });
            const { taskId, agentId } = schema.parse(args);
            const task = ctx.engine.delegateTask(taskId, agentId);
            return {
                success: true,
                task,
                message: `Task "${task.name}" successfully delegated to agent "${agentId}".`,
            };
        },
    },
    // 6. argon_submit_result
    {
        name: 'argon_submit_result',
        description: 'Submits a deliverable/output from an executor agent. Automatically invokes Argon Supervisor to audit for loops and evaluate acceptance criteria.',
        inputSchema: {
            type: 'object',
            properties: {
                taskId: { type: 'string', description: 'UUID of the task' },
                agentId: { type: 'string', description: 'ID of the agent submitting output' },
                output: { type: 'string', description: 'The completed code, deliverable, or test output' },
                status: { type: 'string', enum: ['SUCCESS', 'FAILURE'], default: 'SUCCESS' },
            },
            required: ['taskId', 'agentId', 'output'],
        },
        handler: async (args, ctx) => {
            const schema = z.object({
                taskId: z.string().uuid(),
                agentId: z.string().min(1),
                output: z.string().min(1),
                status: z.enum(['SUCCESS', 'FAILURE']).optional().default('SUCCESS'),
            });
            const { taskId, agentId, output, status } = schema.parse(args);
            const result = ctx.supervisor.handleAgentSubmission(taskId, agentId, output);
            return {
                success: true,
                task: result.task,
                supervision: result.report,
            };
        },
    },
    // 7. argon_review
    {
        name: 'argon_review',
        description: 'Performs explicit review of a task under REVIEW status, either approving (COMPLETED) or rejecting (READY / FAILED).',
        inputSchema: {
            type: 'object',
            properties: {
                taskId: { type: 'string', description: 'UUID of the task' },
                reviewer: { type: 'string', description: 'Name of reviewer (e.g. ARGON_QA, USER)' },
                approved: { type: 'boolean', description: 'Whether the deliverable meets requirements' },
                feedback: { type: 'string', description: 'Actionable feedback or approval remarks' },
                criteriaEvaluations: { type: 'object', additionalProperties: { type: 'boolean' } },
            },
            required: ['taskId', 'reviewer', 'approved', 'feedback'],
        },
        handler: async (args, ctx) => {
            const schema = z.object({
                taskId: z.string().uuid(),
                reviewer: z.string().min(1),
                approved: z.boolean(),
                feedback: z.string(),
                criteriaEvaluations: z.record(z.boolean()).optional().default({}),
            });
            const { taskId, reviewer, approved, feedback, criteriaEvaluations } = schema.parse(args);
            const task = ctx.engine.reviewTask(taskId, reviewer, approved, feedback, criteriaEvaluations);
            return {
                success: true,
                task,
                message: `Task review completed with decision: ${approved ? 'APPROVED' : 'REJECTED'}. Status: ${task.status}`,
            };
        },
    },
    // 8. argon_validate
    {
        name: 'argon_validate',
        description: 'Validates a task result or ongoing execution against acceptance criteria and loop detection without changing state.',
        inputSchema: {
            type: 'object',
            properties: {
                taskId: { type: 'string', description: 'UUID of the task' },
            },
            required: ['taskId'],
        },
        handler: async (args, ctx) => {
            const schema = z.object({ taskId: z.string().uuid() });
            const { taskId } = schema.parse(args);
            const report = ctx.supervisor.auditTask(taskId);
            return { success: true, report };
        },
    },
    // 9. argon_status
    {
        name: 'argon_status',
        description: 'Retrieves current project progress, running tasks, runnable tasks, and supervisor bottleneck alerts.',
        inputSchema: {
            type: 'object',
            properties: {
                projectId: { type: 'string', description: 'UUID of the project' },
            },
            required: ['projectId'],
        },
        handler: async (args, ctx) => {
            const schema = z.object({ projectId: z.string().uuid() });
            const { projectId } = schema.parse(args);
            const project = ctx.repo.getProject(projectId);
            if (!project)
                throw new Error(`Project ${projectId} not found.`);
            const audit = ctx.supervisor.auditProject(projectId);
            const runnable = ctx.engine.getRunnableTasks(projectId, 4);
            return {
                success: true,
                project: { id: project.id, name: project.name, status: project.status },
                summary: {
                    totalTasks: audit.totalTasks,
                    completed: audit.completed,
                    running: audit.running,
                    blocked: audit.blocked,
                    failed: audit.failed,
                    pending: audit.pending,
                },
                runnableNext: runnable.map((t) => ({ id: t.id, name: t.name, priority: t.priority })),
                alerts: audit.reports,
            };
        },
    },
    // 10. argon_resume
    {
        name: 'argon_resume',
        description: 'Resumes a BLOCKED, FAILED, or CANCELLED task back to READY so it can be re-executed.',
        inputSchema: {
            type: 'object',
            properties: {
                taskId: { type: 'string', description: 'UUID of the task' },
            },
            required: ['taskId'],
        },
        handler: async (args, ctx) => {
            const schema = z.object({ taskId: z.string().uuid() });
            const { taskId } = schema.parse(args);
            const task = ctx.engine.resumeTask(taskId);
            return { success: true, task, message: `Task "${task.name}" resumed to READY.` };
        },
    },
    // 11. argon_cancel
    {
        name: 'argon_cancel',
        description: 'Cancels an active or pending task, freeing assigned agents and stopping execution.',
        inputSchema: {
            type: 'object',
            properties: {
                taskId: { type: 'string', description: 'UUID of the task' },
                reason: { type: 'string', description: 'Reason for cancellation' },
            },
            required: ['taskId'],
        },
        handler: async (args, ctx) => {
            const schema = z.object({
                taskId: z.string().uuid(),
                reason: z.string().optional(),
            });
            const { taskId, reason } = schema.parse(args);
            const task = ctx.engine.cancelTask(taskId, reason);
            return { success: true, task, message: `Task "${task.name}" cancelled.` };
        },
    },
    // 12. argon_get_context
    {
        name: 'argon_get_context',
        description: 'Retrieves consolidated architectural memory, decisions, and recurring error prevention guidelines for a project.',
        inputSchema: {
            type: 'object',
            properties: {
                projectId: { type: 'string', description: 'UUID of the project' },
            },
            required: ['projectId'],
        },
        handler: async (args, ctx) => {
            const schema = z.object({ projectId: z.string().uuid() });
            const { projectId } = schema.parse(args);
            const contextSummary = ctx.memory.generateContextSummary(projectId);
            const decisions = ctx.memory.getDecisions(projectId);
            const errors = ctx.memory.getRecurringErrors(projectId);
            return {
                success: true,
                contextSummary,
                decisions,
                recurringErrors: errors,
            };
        },
    },
    // 13. argon_list_tasks
    {
        name: 'argon_list_tasks',
        description: 'Lists all tasks for a project, with optional filtering by status.',
        inputSchema: {
            type: 'object',
            properties: {
                projectId: { type: 'string', description: 'UUID of the project' },
                status: { type: 'string', enum: ['PENDING', 'PLANNING', 'READY', 'RUNNING', 'REVIEW', 'COMPLETED', 'BLOCKED', 'FAILED', 'CANCELLED'] },
            },
            required: ['projectId'],
        },
        handler: async (args, ctx) => {
            const schema = z.object({
                projectId: z.string().uuid(),
                status: TaskStatusEnum.optional(),
            });
            const { projectId, status } = schema.parse(args);
            let tasks = ctx.repo.listTasks(projectId);
            if (status) {
                tasks = tasks.filter((t) => t.status === status);
            }
            return { success: true, count: tasks.length, tasks };
        },
    },
    // 14. argon_get_execution_history
    {
        name: 'argon_get_execution_history',
        description: 'Retrieves detailed execution history, attempts, reviews, and timings for a task.',
        inputSchema: {
            type: 'object',
            properties: {
                taskId: { type: 'string', description: 'UUID of the task' },
            },
            required: ['taskId'],
        },
        handler: async (args, ctx) => {
            const schema = z.object({ taskId: z.string().uuid() });
            const { taskId } = schema.parse(args);
            const task = ctx.repo.getTask(taskId);
            if (!task)
                throw new Error(`Task ${taskId} not found.`);
            const executions = ctx.repo.getExecutionsForTask(taskId);
            const reviews = ctx.repo.getReviewsForTask(taskId);
            return {
                success: true,
                taskId,
                taskName: task.name,
                attempts: task.attempts,
                reviewCycles: task.reviewCycles,
                executions,
                reviews,
            };
        },
    },
];
//# sourceMappingURL=tools.js.map