import { ModeSelection } from './types';
import { DEFAULT_BUDGET } from './constants';
import { getSessionTokenUsage, getUserMonthlyTokenUsage } from '../pglite/cost';

/**
 * Cost-aware mode selection for Dojo agents.
 * 
 * This module implements budget-aware mode and model selection following
 * Dataiku's Cost Guard pattern. When user or session budgets are running low,
 * it automatically downgrades to cheaper modes and models.
 * 
 * **Downgrade Logic:**
 * - Budget >40%: Allow requested mode, use GPT-4o
 * - Budget 20-40%: Prefer Mirror/Scout, use GPT-4o-mini
 * - Budget <20%: Force Mirror mode, use GPT-4o-mini
 * 
 * **TODO:** This is a stub implementation waiting for full Dojo mode system.
 * Once modes are implemented, integrate this with the routing layer.
 * 
 * **Integration Points:**
 * - Supervisor Router (Feature 1): Call before routing to get budget-aware mode
 * - Agent Execution: Use selected model for LLM calls
 * - UI: Display downgrade notifications to user
 * 
 * @see `/04_System/V0.3.0_FEATURE_SEEDS.md` - Seed 2 (Cost Guard)
 * @see `/00_Roadmap/v0.3.0_premium_prompts/02_cost_guard_IMPROVED.MD`
 */

/**
 * Select the appropriate Dojo mode and model based on remaining budget.
 * 
 * Checks both session and user monthly budget to determine if the requested
 * mode should be downgraded to save costs. This prevents budget overruns while
 * maintaining quality when budget allows.
 * 
 * @param userId - User ID for budget lookup
 * @param sessionId - Session ID for budget lookup
 * @param requestedMode - The mode the user wants to use
 * @returns Selected mode, model, reason, and whether it was downgraded
 * 
 * @example
 * ```typescript
 * const selection = await selectMode('user_123', 'sess_abc', 'Implementation');
 * if (selection.downgraded) {
 *   console.warn(`Downgraded to ${selection.mode} due to: ${selection.reason}`);
 * }
 * // Use selection.mode for routing, selection.model for LLM calls
 * ```
 */
export async function selectMode(
  userId: string,
  sessionId: string | null,
  requestedMode: 'Mirror' | 'Scout' | 'Gardener' | 'Implementation'
): Promise<ModeSelection> {
  // TODO: This is a stub implementation for when Dojo modes are fully integrated.
  // Currently returns the requested mode with budget-aware model selection only.
  
  try {
    // Check session budget if session provided
    let sessionBudgetPercent = 1.0; // 100% = full budget available
    if (sessionId) {
      const sessionUsage = await getSessionTokenUsage(sessionId);
      const sessionLimit = DEFAULT_BUDGET.session_limit;
      sessionBudgetPercent = 1 - (sessionUsage / sessionLimit);
    }

    // Check user monthly budget
    const userUsage = await getUserMonthlyTokenUsage(userId);
    const userLimit = DEFAULT_BUDGET.user_monthly_limit;
    const userBudgetPercent = 1 - (userUsage / userLimit);

    // Use the more restrictive budget constraint
    const budgetPercent = Math.min(sessionBudgetPercent, userBudgetPercent);

    // Budget-aware mode and model selection
    if (budgetPercent < 0.2) {
      // Budget <20%: Force Mirror mode with mini model
      return {
        mode: 'Mirror',
        model: 'gpt-4o-mini',
        reason: 'Budget critically low (<20%), using cheapest mode and model',
        downgraded: requestedMode !== 'Mirror',
      };
    } else if (budgetPercent < 0.4) {
      // Budget 20-40%: Prefer Mirror or Scout with mini model
      const allowedModes: Array<'Mirror' | 'Scout' | 'Gardener' | 'Implementation'> = ['Mirror', 'Scout'];
      const selectedMode = allowedModes.includes(requestedMode) ? requestedMode : 'Mirror';
      return {
        mode: selectedMode,
        model: 'gpt-4o-mini',
        reason: 'Budget moderate (20-40%), using cheaper model and limiting modes',
        downgraded: requestedMode !== selectedMode || true, // Model always downgraded
      };
    } else {
      // Budget >40%: Allow requested mode with standard model
      return {
        mode: requestedMode,
        model: 'gpt-4o',
        reason: 'Budget sufficient (>40%), using requested mode and model',
        downgraded: false,
      };
    }
  } catch (error) {
    // Graceful degradation: On error, allow requested mode but log warning
    console.error('[selectMode] Error checking budget, allowing requested mode:', error);
    return {
      mode: requestedMode,
      model: 'gpt-4o',
      reason: 'Budget check failed, allowing requested mode (error fallback)',
      downgraded: false,
    };
  }
}

/**
 * Get recommended mode for current budget status.
 * 
 * Helper function that returns the best mode recommendation without requiring
 * a specific requested mode. Useful for suggesting modes to users.
 * 
 * @param userId - User ID for budget lookup
 * @param sessionId - Session ID for budget lookup
 * @returns Recommended mode and model based on budget
 * 
 * @example
 * ```typescript
 * const recommendation = await getRecommendedMode('user_123', 'sess_abc');
 * console.log(`We recommend using ${recommendation.mode} mode`);
 * ```
 */
export async function getRecommendedMode(
  userId: string,
  sessionId: string | null
): Promise<ModeSelection> {
  // Default to Mirror mode, then upgrade if budget allows
  const sessionUsage = sessionId ? await getSessionTokenUsage(sessionId) : 0;
  const sessionLimit = DEFAULT_BUDGET.session_limit;
  const sessionBudgetPercent = 1 - (sessionUsage / sessionLimit);

  const userUsage = await getUserMonthlyTokenUsage(userId);
  const userLimit = DEFAULT_BUDGET.user_monthly_limit;
  const userBudgetPercent = 1 - (userUsage / userLimit);

  const budgetPercent = Math.min(sessionBudgetPercent, userBudgetPercent);

  if (budgetPercent < 0.2) {
    return {
      mode: 'Mirror',
      model: 'gpt-4o-mini',
      reason: 'Budget critically low, Mirror mode recommended',
      downgraded: false, // Not downgraded since no requested mode
    };
  } else if (budgetPercent < 0.4) {
    return {
      mode: 'Scout',
      model: 'gpt-4o-mini',
      reason: 'Budget moderate, Scout mode recommended',
      downgraded: false,
    };
  } else if (budgetPercent < 0.7) {
    return {
      mode: 'Gardener',
      model: 'gpt-4o',
      reason: 'Budget good, Gardener mode recommended',
      downgraded: false,
    };
  } else {
    return {
      mode: 'Implementation',
      model: 'gpt-4o',
      reason: 'Budget excellent, Implementation mode available',
      downgraded: false,
    };
  }
}

/**
 * TODO: Integration Checklist for Future Development
 * 
 * When Dojo modes are fully implemented, complete these integrations:
 * 
 * 1. **Supervisor Router Integration (Feature 1):**
 *    - Call `selectMode()` before routing queries
 *    - Pass selected mode to router decision logic
 *    - Use selected model for LLM calls
 * 
 * 2. **User Notification:**
 *    - Show toast/banner when mode is downgraded
 *    - Explain why downgrade occurred (budget constraint)
 *    - Suggest upgrading budget or ending session
 * 
 * 3. **Agent Execution:**
 *    - Use selected model for all LLM API calls
 *    - Track actual costs under the selected mode/model
 *    - Update UI to show active mode
 * 
 * 4. **Budget Dashboard:**
 *    - Display current mode and model
 *    - Show if mode was downgraded
 *    - Indicate when full modes will be available again (budget reset)
 * 
 * 5. **Testing:**
 *    - Test mode selection at various budget levels
 *    - Test downgrade notifications work
 *    - Verify model changes are applied to LLM calls
 *    - Test budget recovery (mode upgrades as budget resets)
 */
