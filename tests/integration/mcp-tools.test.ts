import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StorageDatabase } from '../../src/storage/db.js';
import { createMcpServer } from '../../src/mcp/server.js';
import { MCP_TOOLS } from '../../src/mcp/tools.js';

describe('MCP Tools Suite (14 Mandatory Tools)', () => {
  let db: StorageDatabase;
  let serverCtx: any;

  beforeEach(() => {
    db = new StorageDatabase(':memory:');
    const { context } = createMcpServer(db);
    serverCtx = context;
  });

  afterEach(() => {
    db.close();
  });

  function getTool(name: string) {
    const tool = MCP_TOOLS.find((t) => t.name === name);
    if (!tool) throw new Error(`Tool ${name} not found`);
    return tool;
  }

  it('verifies that exactly all 14 required tools are registered', () => {
    const requiredTools = [
      'argon_consult',
      'argon_plan',
      'argon_delegate',
      'argon_submit_result',
      'argon_review',
      'argon_validate',
      'argon_status',
      'argon_resume',
      'argon_cancel',
      'argon_get_context',
      'argon_list_tasks',
      'argon_get_project',
      'argon_create_project',
      'argon_get_execution_history',
    ];

    const registered = MCP_TOOLS.map((t) => t.name);
    for (const toolName of requiredTools) {
      expect(registered).toContain(toolName);
    }
    expect(registered.length).toBe(14);
  });

  it('runs complete lifecycle across all 14 tools', async () => {
    // 1. argon_create_project
    const createProjectTool = getTool('argon_create_project');
    const projectRes = await createProjectTool.handler(
      {
        name: 'Omni Bridge Project',
        description: 'Complete integration project',
        architectureSummary: 'Hexagonal Architecture',
      },
      serverCtx
    );
    expect(projectRes.success).toBe(true);
    const projectId = projectRes.project.id;

    // 2. argon_get_project
    const getProjectTool = getTool('argon_get_project');
    const getProjectRes = await getProjectTool.handler({ projectId }, serverCtx);
    expect(getProjectRes.success).toBe(true);
    expect(getProjectRes.project.name).toBe('Omni Bridge Project');

    // 3. argon_consult
    const consultTool = getTool('argon_consult');
    const consultRes = await consultTool.handler(
      {
        projectId,
        query: 'How to structure authentication and database pooling?',
      },
      serverCtx
    );
    expect(consultRes.success).toBe(true);
    expect(consultRes.consultation.promptForGemini).toContain('Omni Bridge Project');

    // 4. argon_plan
    const planTool = getTool('argon_plan');
    const planRes = await planTool.handler(
      {
        projectId,
        tasks: [
          {
            tempId: 'backend_core',
            name: 'Implement Backend Core',
            description: 'Setup Node and Express API',
            priority: 'HIGH',
            acceptanceCriteria: ['Must create Express server', 'Must listen on port 4000'],
          },
          {
            tempId: 'frontend_ui',
            name: 'Implement Frontend UI',
            description: 'Setup React dashboard',
            priority: 'MEDIUM',
            dependsOnTempIds: ['backend_core'],
            acceptanceCriteria: ['Must render dashboard UI'],
          },
        ],
      },
      serverCtx
    );
    expect(planRes.success).toBe(true);
    expect(planRes.plannedCount).toBe(2);
    const backendTask = planRes.tasks.find((t: any) => t.name.includes('Backend'));
    const frontendTask = planRes.tasks.find((t: any) => t.name.includes('Frontend'));
    expect(backendTask).toBeDefined();
    expect(frontendTask).toBeDefined();

    // 5. argon_list_tasks
    const listTasksTool = getTool('argon_list_tasks');
    const listRes = await listTasksTool.handler({ projectId }, serverCtx);
    expect(listRes.count).toBe(2);

    // 6. argon_delegate
    const delegateTool = getTool('argon_delegate');
    const delegateRes = await delegateTool.handler(
      {
        taskId: backendTask.id,
        agentId: 'AGENT_BACKEND',
      },
      serverCtx
    );
    expect(delegateRes.success).toBe(true);
    expect(delegateRes.task.status).toBe('RUNNING');

    // 7. argon_validate
    const validateTool = getTool('argon_validate');
    const validateRes = await validateTool.handler({ taskId: backendTask.id }, serverCtx);
    expect(validateRes.success).toBe(true);
    expect(validateRes.report.isHealthy).toBe(true);

    // 8. argon_submit_result
    const submitResultTool = getTool('argon_submit_result');
    const submitRes = await submitResultTool.handler(
      {
        taskId: backendTask.id,
        agentId: 'AGENT_BACKEND',
        output: 'Must create Express server and Must listen on port 4000 successfully implemented with 10 passing tests.',
      },
      serverCtx
    );
    expect(submitRes.success).toBe(true);
    // Auto-approved by supervisor
    expect(submitRes.task.status).toBe('COMPLETED');

    // 9. argon_status
    const statusTool = getTool('argon_status');
    const statusRes = await statusTool.handler({ projectId }, serverCtx);
    expect(statusRes.success).toBe(true);
    expect(statusRes.summary.completed).toBe(1);
    expect(statusRes.runnableNext.length).toBe(1); // Frontend task is now runnable!

    // 10. argon_get_execution_history
    const historyTool = getTool('argon_get_execution_history');
    const historyRes = await historyTool.handler({ taskId: backendTask.id }, serverCtx);
    expect(historyRes.success).toBe(true);
    expect(historyRes.executions.length).toBe(1);

    // 11. argon_cancel
    const cancelTool = getTool('argon_cancel');
    const cancelRes = await cancelTool.handler(
      {
        taskId: frontendTask.id,
        reason: 'Paused by user',
      },
      serverCtx
    );
    expect(cancelRes.success).toBe(true);
    expect(cancelRes.task.status).toBe('CANCELLED');

    // 12. argon_resume
    const resumeTool = getTool('argon_resume');
    const resumeRes = await resumeTool.handler({ taskId: frontendTask.id }, serverCtx);
    expect(resumeRes.success).toBe(true);
    expect(resumeRes.task.status).toBe('READY');

    // 13. argon_review (explicit review)
    // Delegate and submit to put in REVIEW if needed, or directly test review
    await delegateTool.handler({ taskId: frontendTask.id, agentId: 'AGENT_FRONTEND' }, serverCtx);
    serverCtx.repo.updateTask(frontendTask.id, { status: 'REVIEW' });

    const reviewTool = getTool('argon_review');
    const reviewRes = await reviewTool.handler(
      {
        taskId: frontendTask.id,
        reviewer: 'HUMAN_SUPERVISOR',
        approved: true,
        feedback: 'Looks good to go',
      },
      serverCtx
    );
    expect(reviewRes.success).toBe(true);
    expect(reviewRes.task.status).toBe('COMPLETED');

    // 14. argon_get_context
    const getContextTool = getTool('argon_get_context');
    const contextRes = await getContextTool.handler({ projectId }, serverCtx);
    expect(contextRes.success).toBe(true);
    expect(contextRes.contextSummary).toContain('Omni Bridge Project');
  });
});
