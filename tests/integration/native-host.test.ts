import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StorageDatabase } from '../../src/storage/db.js';
import { NativeMessagingHost } from '../../src/native-host/host.js';
import { ArgonRepository } from '../../src/storage/repository.js';
import { randomUUID } from 'node:crypto';

describe('NativeMessagingHost Integration', () => {
  let db: StorageDatabase;
  let host: NativeMessagingHost;
  let repo: ArgonRepository;

  beforeEach(() => {
    db = new StorageDatabase(':memory:');
    repo = new ArgonRepository(db.getRawDb());
    host = new NativeMessagingHost(db);
  });

  afterEach(() => {
    db.close();
  });

  it('handles PING action and returns PONG with version 1.0.0', () => {
    let capturedResponse: any = null;
    host.sendMessage = (msg: any) => {
      capturedResponse = msg;
    };

    host.handleMessage({ id: 'test_1', action: 'PING' });
    expect(capturedResponse).not.toBeNull();
    expect(capturedResponse.success).toBe(true);
    expect(capturedResponse.data.status).toBe('PONG');
    expect(capturedResponse.data.version).toBe('1.0.0');
  });

  it('handles TRANSFER_RESPONSE and updates memory and task', () => {
    const projectId = randomUUID();
    repo.createProject({
      id: projectId,
      name: 'Transfer Project',
      description: '',
      architectureSummary: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'ACTIVE',
    });

    let capturedResponse: any = null;
    host.sendMessage = (msg: any) => {
      capturedResponse = msg;
    };

    host.handleMessage({
      id: 'test_2',
      action: 'TRANSFER_RESPONSE',
      payload: {
        projectId,
        responseText: 'Gemini suggests using SSE and SQLite for fast IPC.',
        source: 'Gemini Web',
      },
    });

    expect(capturedResponse).not.toBeNull();
    expect(capturedResponse.success).toBe(true);
    expect(capturedResponse.data.transferred).toBe(true);

    const memory = repo.getMemory(projectId);
    expect(memory.length).toBeGreaterThan(0);
    expect(memory[0].value).toContain('Gemini suggests using SSE');
  });
});
