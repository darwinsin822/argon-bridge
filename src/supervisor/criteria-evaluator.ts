export interface CriteriaEvaluationResult {
  passed: boolean;
  score: number;
  evaluations: Record<string, boolean>;
  details: string[];
}

export class CriteriaEvaluator {
  /**
   * Evaluates if the output satisfies the task acceptance criteria.
   * Performs semantic keyword checks and structure heuristics.
   */
  public static evaluate(
    output: string,
    acceptanceCriteria: string[]
  ): CriteriaEvaluationResult {
    if (!acceptanceCriteria || acceptanceCriteria.length === 0) {
      return {
        passed: true,
        score: 1.0,
        evaluations: {},
        details: ['No explicit criteria specified; auto-approved.'],
      };
    }

    const lowerOutput = output.toLowerCase();
    const evaluations: Record<string, boolean> = {};
    const details: string[] = [];
    let passedCount = 0;

    for (const criterion of acceptanceCriteria) {
      const lowerCriterion = criterion.toLowerCase();
      // Extract significant terms
      const keywords = lowerCriterion
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 3);

      let matched = false;
      if (lowerOutput.includes(lowerCriterion)) {
        matched = true;
      } else if (keywords.length > 0) {
        // If at least 50% of the significant keywords appear in output
        const matchCount = keywords.filter((kw) => lowerOutput.includes(kw)).length;
        matched = matchCount >= Math.ceil(keywords.length * 0.5);
      } else {
        matched = true;
      }

      evaluations[criterion] = matched;
      if (matched) {
        passedCount++;
        details.push(`✓ Criterion satisfied: "${criterion}"`);
      } else {
        details.push(`✕ Criterion unmet or missing evidence: "${criterion}"`);
      }
    }

    const score = passedCount / acceptanceCriteria.length;
    // Pass if all criteria or at least 80% pass
    const passed = passedCount === acceptanceCriteria.length || score >= 0.8;

    return {
      passed,
      score,
      evaluations,
      details,
    };
  }
}
