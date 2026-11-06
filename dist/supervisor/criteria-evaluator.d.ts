export interface CriteriaEvaluationResult {
    passed: boolean;
    score: number;
    evaluations: Record<string, boolean>;
    details: string[];
}
export declare class CriteriaEvaluator {
    /**
     * Evaluates if the output satisfies the task acceptance criteria.
     * Performs semantic keyword checks and structure heuristics.
     */
    static evaluate(output: string, acceptanceCriteria: string[]): CriteriaEvaluationResult;
}
//# sourceMappingURL=criteria-evaluator.d.ts.map