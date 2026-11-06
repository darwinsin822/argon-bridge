import { createHash } from 'node:crypto';
import { Execution } from '../core/types.js';

export interface LoopDetectionResult {
  isLooping: boolean;
  reason?: 'IDENTICAL_HASH' | 'HIGH_SIMILARITY' | 'CONTRADICTORY_RESULTS';
  similarityScore?: number;
  message?: string;
}

export class LoopDetector {
  /**
   * Computes sha256 hash of a string.
   */
  public static hashOutput(text: string): string {
    return createHash('sha256').update(text.trim()).digest('hex');
  }

  /**
   * Calculates token Jaccard similarity between two texts.
   */
  public static calculateSimilarity(textA: string, textB: string): number {
    const tokensA = new Set(
      textA.toLowerCase().split(/\s+/).filter((t) => t.length > 2)
    );
    const tokensB = new Set(
      textB.toLowerCase().split(/\s+/).filter((t) => t.length > 2)
    );

    if (tokensA.size === 0 && tokensB.size === 0) return 1.0;
    if (tokensA.size === 0 || tokensB.size === 0) return 0.0;

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
  public static analyzeExecutions(
    executions: Execution[],
    similarityThreshold: number = 0.85
  ): LoopDetectionResult {
    if (executions.length < 2) {
      return { isLooping: false };
    }

    const completed = executions
      .filter((e) => e.output !== null)
      .map((e) => e.output!);

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
        message: `Output has ${(score * 100).toFixed(
          1
        )}% similarity to previous attempt without observable progress.`,
      };
    }

    return { isLooping: false, similarityScore: score };
  }
}
