import { randomUUID } from 'node:crypto';
import { SessionSchema, MessageSchema } from './types.js';
export class SessionManager {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    startSession(projectId, title) {
        const session = SessionSchema.parse({
            id: randomUUID(),
            projectId,
            title: title || `Session ${new Date().toISOString()}`,
            startedAt: new Date().toISOString(),
            endedAt: null,
            activeAgentId: null,
            metadata: {},
        });
        return this.repo.createSession(session);
    }
    endSession(sessionId) {
        const session = this.repo.getSession(sessionId);
        if (!session)
            return null;
        const ended = {
            ...session,
            endedAt: new Date().toISOString(),
        };
        // Update session table
        const stmt = this.repo.db.prepare('UPDATE sessions SET ended_at = ? WHERE id = ?');
        stmt.run(ended.endedAt, sessionId);
        return ended;
    }
    recordMessage(sessionId, sender, recipient, content, taskId) {
        const msg = MessageSchema.parse({
            id: randomUUID(),
            sessionId,
            sender,
            recipient,
            content,
            taskId: taskId || null,
            timestamp: new Date().toISOString(),
        });
        const stmt = this.repo.db.prepare(`
      INSERT INTO messages (id, session_id, sender, recipient, content, task_id, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
        stmt.run(msg.id, msg.sessionId, msg.sender, msg.recipient, msg.content, msg.taskId, msg.timestamp);
        return msg;
    }
    getSessionMessages(sessionId) {
        const stmt = this.repo.db.prepare('SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC');
        const rows = stmt.all(sessionId);
        return rows.map((r) => ({
            id: r.id,
            sessionId: r.session_id,
            sender: r.sender,
            recipient: r.recipient,
            content: r.content,
            taskId: r.task_id,
            timestamp: r.timestamp,
        }));
    }
}
//# sourceMappingURL=session-manager.js.map