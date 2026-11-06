import { randomUUID } from 'node:crypto';
import { ArgonRepository } from '../storage/repository.js';
import { Session, Message, SessionSchema, MessageSchema } from './types.js';

export class SessionManager {
  constructor(private repo: ArgonRepository) {}

  public startSession(projectId: string, title?: string): Session {
    const session: Session = SessionSchema.parse({
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

  public endSession(sessionId: string): Session | null {
    const session = this.repo.getSession(sessionId);
    if (!session) return null;
    const ended = {
      ...session,
      endedAt: new Date().toISOString(),
    };
    // Update session table
    const stmt = (this.repo as any).db.prepare(
      'UPDATE sessions SET ended_at = ? WHERE id = ?'
    );
    stmt.run(ended.endedAt, sessionId);
    return ended;
  }

  public recordMessage(
    sessionId: string,
    sender: string,
    recipient: string,
    content: string,
    taskId?: string | null
  ): Message {
    const msg: Message = MessageSchema.parse({
      id: randomUUID(),
      sessionId,
      sender,
      recipient,
      content,
      taskId: taskId || null,
      timestamp: new Date().toISOString(),
    });

    const stmt = (this.repo as any).db.prepare(`
      INSERT INTO messages (id, session_id, sender, recipient, content, task_id, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      msg.id,
      msg.sessionId,
      msg.sender,
      msg.recipient,
      msg.content,
      msg.taskId,
      msg.timestamp
    );
    return msg;
  }

  public getSessionMessages(sessionId: string): Message[] {
    const stmt = (this.repo as any).db.prepare(
      'SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC'
    );
    const rows = stmt.all(sessionId) as any[];
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
