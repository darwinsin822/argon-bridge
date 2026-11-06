import { DatabaseSync } from 'node:sqlite';
import { Project, Session, Task, Agent, Execution, Review, Event } from '../core/types.js';
export interface MemoryRecord {
    id: string;
    projectId: string;
    category: 'DECISION' | 'REQUIREMENT' | 'RECURRING_ERROR' | 'INSIGHT';
    key: string;
    value: string;
    metadata: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}
export declare class ArgonRepository {
    private db;
    constructor(db: DatabaseSync);
    createProject(project: Project): Project;
    getProject(id: string): Project | null;
    listProjects(): Project[];
    updateProject(id: string, updates: Partial<Pick<Project, 'name' | 'description' | 'architectureSummary' | 'status'>>): Project | null;
    createSession(session: Session): Session;
    getSession(id: string): Session | null;
    createTask(task: Task): Task;
    getTask(id: string): Task | null;
    listTasks(projectId?: string): Task[];
    updateTask(id: string, updates: Partial<Task>): Task | null;
    private mapTaskRow;
    registerAgent(agent: Agent): Agent;
    getAgent(id: string): Agent | null;
    listAgents(): Agent[];
    recordExecution(execution: Execution): Execution;
    getExecutionsForTask(taskId: string): Execution[];
    recordReview(review: Review): Review;
    getReviewsForTask(taskId: string): Review[];
    recordEvent(event: Event): Event;
    getEvents(projectId?: string, limit?: number): Event[];
    setMemory(record: Omit<MemoryRecord, 'createdAt' | 'updatedAt'>): MemoryRecord;
    getMemory(projectId: string, category?: MemoryRecord['category']): MemoryRecord[];
}
//# sourceMappingURL=repository.d.ts.map