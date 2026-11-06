import { describe, it, expect } from 'vitest';
import { CriteriaEvaluator } from '../../src/supervisor/criteria-evaluator.js';

describe('CriteriaEvaluator', () => {
  it('approves output when all criteria keywords are satisfied', () => {
    const criteria = [
      'Must implement JWT authentication',
      'Must write unit tests with at least 80% coverage',
    ];
    const output = `
      Completed the task:
      - Implemented JWT authentication in src/auth.ts using HS256 algorithm.
      - Added comprehensive unit tests in tests/auth.test.ts with 95% coverage.
    `;

    const res = CriteriaEvaluator.evaluate(output, criteria);
    expect(res.passed).toBe(true);
    expect(res.score).toBe(1.0);
  });

  it('rejects output when critical criteria keywords are missing', () => {
    const criteria = [
      'Must implement PostgreSQL connection pooling',
      'Must add integration benchmark tests',
    ];
    const output = 'I created a simple hello world script in index.js.';

    const res = CriteriaEvaluator.evaluate(output, criteria);
    expect(res.passed).toBe(false);
    expect(res.score).toBe(0.0);
  });
});
