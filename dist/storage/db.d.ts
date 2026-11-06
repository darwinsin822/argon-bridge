import { DatabaseSync } from 'node:sqlite';
export interface Migration {
    version: number;
    name: string;
    sql: string;
}
export declare const MIGRATIONS: Migration[];
export declare class StorageDatabase {
    private db;
    constructor(dbPath?: string);
    getRawDb(): DatabaseSync;
    private runMigrations;
    close(): void;
}
//# sourceMappingURL=db.d.ts.map