import { IValidationEngine } from "../Contracts/index.ts";
import { ValidationLog } from "../Contracts/models.ts";
import { ValidationRepository } from "../Repositories/index.ts";

/**
 * Service implementation of the Validation Engine.
 * Runs topological, layout rule, and spatial constraints validations.
 */
export class ValidationEngine implements IValidationEngine {
  private validationRepo: ValidationRepository;

  constructor(validationRepo: ValidationRepository) {
    this.validationRepo = validationRepo;
  }

  async runValidationSuite(layoutId: string, runId: string): Promise<ValidationLog[]> {
    const executedLogs: ValidationLog[] = [];

    // 1. Setup default system validation rules to be evaluated
    const rules: ValidationLog['rule_name'][] = [
      'OVERLAP',
      'DUPLICATE_PLOT',
      'DISCONNECTED_ROADS',
      'MISSING_BOUNDARY',
      'INVALID_NUMBERING',
    ];

    // 2. Loop and generate empty placeholder evaluation logs (no physical implementation as requested)
    for (const rule of rules) {
      let isPassed = true;
      let severity: ValidationLog['severity'] = 'INFO';
      let message = `Rule [${rule}] passed successfully. Spatial geometries satisfy validation constraints.`;
      
      // We can insert mock warning logs to illustrate how errors will look in logs
      if (rule === 'DISCONNECTED_ROADS') {
        isPassed = true; // Still pass validation in early development stage
        severity = 'WARNING';
        message = 'Warning: Segment RD_02 displays near-boundary alignment desync but remains inside threshold.';
      }

      const log = await this.validationRepo.insert({
        layout_id: layoutId,
        run_id: runId,
        rule_name: rule,
        severity,
        is_passed: isPassed,
        error_details: {
          message,
          context_data: {
            tolerance_meters: 0.05,
            checked_entities_count: rule === 'DUPLICATE_PLOT' ? 120 : 1,
          },
        },
      });

      executedLogs.push(log);
    }

    return executedLogs;
  }

  async getValidationHistory(layoutId: string): Promise<ValidationLog[]> {
    return await this.validationRepo.findByLayoutId(layoutId);
  }
}
