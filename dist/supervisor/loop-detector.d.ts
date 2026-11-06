import { Execution } from '../core/types.js';
export interface LoopDetectionResult {
    isLooping: boolean;
    reason?: 'IDENTICAL_HASH' | 'HIGH_SIMILARITY' | 'CONTRADICTORY_RESULTS';
    similarityScore?: number;
    message?: string;
}
export declare class LoopDetector {
    /**
     * Computes sha256 hash of a string.
     */
    static hashOutput(text: string): string;
    /**
     * Calculates token Jaccard similarity between two texts.
     */
    static calculateSimilarity(textA: string, textB: string): number;
    /**
     * Analyzes execution history for a task to detect repetitive cycles or lack of progress.
     */
    static analyzeExecutions(executions: Execution[], similarityThreshold?: number): LoopDetectionResult;
}
//# sourceMappingURL=loop-detector.d.ts.map