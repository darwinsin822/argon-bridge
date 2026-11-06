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
export declare class ProjectMemory {
    private repo;
    constructor(repo: ArgonRepository);
    recordDecision(projectId: string, key: string, entry: DecisionEntry): MemoryRecord;
    recordRequirement(projectId: string, key: string, requirement: string, metadata?: Record<string, any>): MemoryRecord;
    recordRecurringError(projectId: string, key: string, entry: RecurringErrorEntry): MemoryRecord;
    recordInsight(projectId: string, key: string, insight: string, metadata?: Record<string, any>): MemoryRecord;
    getDecisions(projectId: string): MemoryRecord[];
    getRequirements(projectId: string): MemoryRecord[];
    getRecurringErrors(projectId: string): MemoryRecord[];
    /**
     * Generates a consolidated contextual summary of the project memory
     * suitable for feeding into an agent or model prompt.
     */
    generateContextSummary(projectId: string): string;
}
//# sourceMappingURL=project-memory.d.ts.map