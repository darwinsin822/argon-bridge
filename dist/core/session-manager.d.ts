import { ArgonRepository } from '../storage/repository.js';
import { Session, Message } from './types.js';
export declare class SessionManager {
    private repo;
    constructor(repo: ArgonRepository);
    startSession(projectId: string, title?: string): Session;
    endSession(sessionId: string): Session | null;
    recordMessage(sessionId: string, sender: string, recipient: string, content: string, taskId?: string | null): Message;
    getSessionMessages(sessionId: string): Message[];
}
//# sourceMappingURL=session-manager.d.ts.map