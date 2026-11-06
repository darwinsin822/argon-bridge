import { randomUUID } from 'node:crypto';
import { ArgonRepository, MemoryRecord } from '../storage/repository.js';

export interface DecisionEntry {
  decision: string;
  rationale: string;
  alternativesConsidered?: string[];
  status?: 'PROPOSED' | 'ACCEPTED' | 'SUPERSEDED';
}

export interface RecurringErrorEntry {
  errorSignature: string;
  rootCause: string;
  preventionGuideline: string;
}

export class ProjectMemory {
  constructor(private repo: ArgonRepository) {}

  public recordDecision(
    projectId: string,
    key: string,
    entry: DecisionEntry
  ): MemoryRecord {
    return this.repo.setMemory({
      id: randomUUID(),
      projectId,
      category: 'DECISION',
      key,
      value: entry.decision,
      metadata: {
        rationale: entry.rationale,
        alternativesConsidered: entry.alternativesConsidered || [],
        status: entry.status || 'ACCEPTED',
      },
    });
  }

  public recordRequirement(
    projectId: string,
    key: string,
    requirement: string,
    metadata: Record<string, any> = {}
  ): MemoryRecord {
    return this.repo.setMemory({
      id: randomUUID(),
      projectId,
      category: 'REQUIREMENT',
      key,
      value: requirement,
      metadata,
    });
  }

  public recordRecurringError(
    projectId: string,
    key: string,
    entry: RecurringErrorEntry
  ): MemoryRecord {
    return this.repo.setMemory({
      id: randomUUID(),
      projectId,
      category: 'RECURRING_ERROR',
      key,
      value: entry.errorSignature,
      metadata: {
        rootCause: entry.rootCause,
        preventionGuideline: entry.preventionGuideline,
      },
    });
  }

  public recordInsight(
    projectId: string,
    key: string,
    insight: string,
    metadata: Record<string, any> = {}
  ): MemoryRecord {
    return this.repo.setMemory({
      id: randomUUID(),
      projectId,
      category: 'INSIGHT',
      key,
      value: insight,
      metadata,
    });
  }

  public getDecisions(projectId: string): MemoryRecord[] {
    return this.repo.getMemory(projectId, 'DECISION');
  }

  public getRequirements(projectId: string): MemoryRecord[] {
    return this.repo.getMemory(projectId, 'REQUIREMENT');
  }

  public getRecurringErrors(projectId: string): MemoryRecord[] {
    return this.repo.getMemory(projectId, 'RECURRING_ERROR');
  }

  /**
   * Generates a consolidated contextual summary of the project memory
   * suitable for feeding into an agent or model prompt.
   */
  public generateContextSummary(projectId: string): string {
    const project = this.repo.getProject(projectId);
    if (!project) return 'No project found.';

    const decisions = this.getDecisions(projectId);
    const requirements = this.getRequirements(projectId);
    const errors = this.getRecurringErrors(projectId);
    const tasks = this.repo.listTasks(projectId);

    const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');
    const pendingTasks = tasks.filter((t) => t.status !== 'COMPLETED');

    const lines: string[] = [
      `# PROJECT CONTEXT: ${project.name}`,
      `Description: ${project.description}`,
      `Architecture Summary: ${project.architectureSummary || 'N/A'}`,
      `Created: ${project.createdAt} | Status: ${project.status}`,
      '',
      `## Progress Summary`,
      `- Total Tasks: ${tasks.length}`,
      `- Completed: ${completedTasks.length}`,
      `- Incomplete / Pending: ${pendingTasks.length}`,
      '',
    ];

    if (requirements.length > 0) {
      lines.push('## Key Requirements');
      for (const req of requirements) {
        lines.push(`- [${req.key}]: ${req.value}`);
      }
      lines.push('');
    }

    if (decisions.length > 0) {
      lines.push('## Architectural Decisions');
      for (const dec of decisions) {
        lines.push(`- **${dec.key}**: ${dec.value}`);
        if (dec.metadata.rationale) {
          lines.push(`  *Rationale:* ${dec.metadata.rationale}`);
        }
      }
      lines.push('');
    }

    if (errors.length > 0) {
      lines.push('## Known Pitfalls & Error Prevention (DO NOT REPEAT)');
      for (const err of errors) {
        lines.push(`- ⚠️ **${err.key}**: ${err.value}`);
        if (err.metadata.preventionGuideline) {
          lines.push(`  *Prevention Guideline:* ${err.metadata.preventionGuideline}`);
        }
      }
      lines.push('');
    }

    return lines.join('\n');
  }
}
