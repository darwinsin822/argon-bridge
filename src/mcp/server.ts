import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { StorageDatabase } from '../storage/db.js';
import { ArgonRepository } from '../storage/repository.js';
import { TaskEngine } from '../core/task-engine.js';
import { ProjectMemory } from '../core/project-memory.js';
import { SessionManager } from '../core/session-manager.js';
import { ArgonSupervisor } from '../supervisor/supervisor.js';
import { ConfigManager } from '../core/config.js';
import { MCP_TOOLS, McpContext } from './tools.js';

export function createMcpServer(customDb?: StorageDatabase) {
  const config = ConfigManager.getConfig();
  const db = customDb || new StorageDatabase(config.databasePath);
  const repo = new ArgonRepository(db.getRawDb());
  const engine = new TaskEngine(repo);
  const memory = new ProjectMemory(repo);
  const sessionManager = new SessionManager(repo);
  const supervisor = new ArgonSupervisor(repo, engine, memory, config);

  const context: McpContext = {
    repo,
    engine,
    memory,
    sessionManager,
    supervisor,
  };

  const server = new Server(
    {
      name: 'argon-bridge-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
  );

  // --------------------------------------------------------------------------
  // TOOLS
  // --------------------------------------------------------------------------
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: MCP_TOOLS.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      })),
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const tool = MCP_TOOLS.find((t) => t.name === name);

    if (!tool) {
      throw new Error(`Tool "${name}" is not registered in Argon Bridge MCP.`);
    }

    try {
      const result = await tool.handler(args || {}, context);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err: any) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: err.message || String(err),
              toolName: name,
            }),
          },
        ],
      };
    }
  });

  // --------------------------------------------------------------------------
  // RESOURCES
  // --------------------------------------------------------------------------
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const projects = repo.listProjects();
    return {
      resources: projects.map((p) => ({
        uri: `argon://project/${p.id}`,
        name: `Project: ${p.name}`,
        mimeType: 'application/json',
        description: p.description || 'Argon Bridge Project Summary',
      })),
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    const match = uri.match(/^argon:\/\/project\/(.+)$/);
    if (!match) {
      throw new Error(`Invalid resource URI: ${uri}`);
    }
    const projectId = match[1];
    const project = repo.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found.`);
    }
    const tasks = repo.listTasks(projectId);
    const contextSummary = memory.generateContextSummary(projectId);

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              project,
              tasksCount: tasks.length,
              tasks,
              contextSummary,
            },
            null,
            2
          ),
        },
      ],
    };
  });

  // --------------------------------------------------------------------------
  // PROMPTS
  // --------------------------------------------------------------------------
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: [
        {
          name: 'argon_strategic_consult',
          description: 'Strategic consultation prompt for Argon with project background and memory',
          arguments: [
            { name: 'projectId', description: 'Project UUID', required: true },
            { name: 'query', description: 'Strategic challenge or dilemma', required: true },
          ],
        },
        {
          name: 'argon_task_review',
          description: 'Supervisor review prompt assessing criteria and loop prevention',
          arguments: [
            { name: 'taskId', description: 'Task UUID', required: true },
          ],
        },
      ],
    };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    if (name === 'argon_strategic_consult') {
      const projectId = args?.projectId;
      if (!projectId) throw new Error('Missing projectId argument');
      const contextSummary = memory.generateContextSummary(projectId);
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `${contextSummary}\n\n## STRATEGIC CONSULTATION:\n${args?.query || ''}\n\nDeconstruct the task, review constraints, and propose an actionable execution plan.`,
            },
          },
        ],
      };
    } else if (name === 'argon_task_review') {
      const taskId = args?.taskId;
      if (!taskId) throw new Error('Missing taskId argument');
      const task = repo.getTask(taskId);
      if (!task) throw new Error(`Task ${taskId} not found`);
      const executions = repo.getExecutionsForTask(taskId);
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `TASK REVIEW: ${task.name}\nStatus: ${task.status}\nCriteria: ${task.acceptanceCriteria.join(', ')}\nLast Output: ${task.result || 'None'}\nAttempts: ${executions.length}`,
            },
          },
        ],
      };
    }
    throw new Error(`Unknown prompt: ${name}`);
  });

  return { server, context, db };
}

// Stdio runner when executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const { server } = createMcpServer();
  const transport = new StdioServerTransport();
  server.connect(transport).catch((err) => {
    console.error('[ArgonMCP] Fatal error running Stdio transport:', err);
    process.exit(1);
  });
}
