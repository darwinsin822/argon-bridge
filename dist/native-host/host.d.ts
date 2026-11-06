import { StorageDatabase } from '../storage/db.js';
/**
 * Reads a message from stdin formatted with Chrome Native Messaging protocol
 * (4-byte unsigned integer little-endian length prefix followed by UTF-8 JSON).
 */
export declare class NativeMessagingHost {
    private buffer;
    private repo;
    private engine;
    private memory;
    private sessionManager;
    private supervisor;
    constructor(customDb?: StorageDatabase);
    start(): void;
    private processBuffer;
    handleMessage(msg: any): void;
    sendMessage(obj: any): void;
    private sendError;
}
//# sourceMappingURL=host.d.ts.map