import { createHash } from 'node:crypto';
export class LoopDetector {
    /**
     * Computes sha256 hash of a string.
     */
    static hashOutput(text) {
        return createHash('sha256').update(text.trim()).digest('hex');
    }
    /**
     * Calculates token Jaccard similarity between two texts.
     */
    static calculateSimilarity(textA, textB) {
        const tokensA = new Set(textA.toLowerCase().split(/\s+/).filter((t) => t.length > 2));
        const tokensB = new Set(textB.toLowerCase().split(/\s+/).filter((t) => t.length > 2));
        if (tokensA.size === 0 && tokensB.size === 0)
            return 1.0;
        if (tokensA.size === 0 || tokensB.size === 0)
            return 0.0;
        let intersection = 0;
        for (const t of tokensA) {
            if (tokensB.has(t)) {
                intersection++;
            }
        }
        const union = new Set([...tokensA, ...tokensB]).size;
        return intersection / union;
    }
    /**
     * Analyzes execution history for a task to detect repetitive cycles or lack of progress.
     */
    static analyzeExecutions(executions, similarityThreshold = 0.85) {
        if (executions.length < 2) {
            return { isLooping: false };
        }
        const completed = executions
            .filter((e) => e.output !== null)
            .map((e) => e.output);
        if (completed.length < 2) {
            return { isLooping: false };
        }
        const latest = completed[completed.length - 1];
        const previous = completed[completed.length - 2];
        // Check exact hash match
        if (this.hashOutput(latest) === this.hashOutput(previous)) {
            return {
                isLooping: true,
                reason: 'IDENTICAL_HASH',
                similarityScore: 1.0,
                message: 'Agent submitted identical output across consecutive attempts.',
            };
        }
        // Check textual similarity
        const score = this.calculateSimilarity(latest, previous);
        if (score >= similarityThreshold) {
            return {
                isLooping: true,
                reason: 'HIGH_SIMILARITY',
                similarityScore: score,
                message: `Output has ${(score * 100).toFixed(1)}% similarity to previous attempt without observable progress.`,
            };
        }
        return { isLooping: false, similarityScore: score };
    }
}
//# sourceMappingURL=loop-detector.js.map