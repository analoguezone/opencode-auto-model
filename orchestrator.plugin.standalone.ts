/**
 * OpenCode Intelligent Orchestrator Plugin V3.0 - STANDALONE
 *
 * NO EXTERNAL DEPENDENCIES - Uses JSON config instead of YAML
 * Works with prompt.before hook!
 *
 * Features:
 * - Respects OPTIMIZE toggle (checks input.optimizeEnabled)
 * - Dynamic model selection based on task complexity
 * - Context-aware complexity adjustment
 * - Plan detection and subtask detection
 * - Per-level fallback arrays
 * - Zero dependencies (only Node.js built-ins)
 *
 * @author OpenCode Auto Model
 * @version 3.0.0-standalone
 */

import type { Plugin } from "@opencode-ai/plugin";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

// ============================================================================
// TYPES
// ============================================================================

type LogLevel = "verbose" | "normal" | "quiet";
type Strategy = "cost-optimized" | "performance-optimized" | "balanced";
type TaskType =
  | "coding-simple"
  | "coding-complex"
  | "planning"
  | "debugging"
  | "review"
  | "documentation"
  | "general";
type Complexity = "simple" | "medium" | "complex" | "advanced";

interface ModelRef {
  providerID: string;
  modelID: string;
}

interface OrchestratorConfig {
  enabled: boolean;
  logLevel: LogLevel;
  defaultModel: ModelRef;
  agentStrategies: Record<string, Strategy>;
  detection: {
    useTokenCount: boolean;
    useKeywords: boolean;
    contextAware: {
      enabled: boolean;
      planAwareness: {
        enabled: boolean;
        planIndicators: string[];
        minStepsForReduction: number;
      };
      subtaskDetection: {
        enabled: boolean;
        subtaskIndicators: string[];
      };
    };
  };
  strategies: {
    [strategy: string]: {
      [taskType: string]: {
        [complexity: string]: string | string[];
      };
    };
  };
  overrides?: {
    filePatterns?: {
      pattern: string;
      minComplexity: Complexity;
    }[];
  };
  taskTypeIndicators?: {
    [taskType: string]: {
      keywords: string[];
      patterns?: string[];
    };
  };
  complexityIndicators?: {
    [complexity: string]: {
      keywords: string[];
      tokenRanges?: [number, number];
    };
  };
}

interface PromptAnalysis {
  taskType: TaskType;
  complexity: Complexity;
  contextSize: number;
  hasPlan: boolean;
  isSubtask: boolean;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: OrchestratorConfig = {
  enabled: true,
  logLevel: "normal",
  defaultModel: {
    providerID: "anthropic",
    modelID: "claude-sonnet-4-5",
  },
  agentStrategies: {
    "auto-optimized": "cost-optimized",
    "auto-performance": "performance-optimized",
    build: "cost-optimized",
    general: "balanced",
  },
  detection: {
    useTokenCount: true,
    useKeywords: true,
    contextAware: {
      enabled: true,
      planAwareness: {
        enabled: true,
        planIndicators: [
          "step 1",
          "step 2",
          "phase 1",
          "## plan",
          "### step",
          "- [ ]",
          "1.",
        ],
        minStepsForReduction: 3,
      },
      subtaskDetection: {
        enabled: true,
        subtaskIndicators: [
          "implement step",
          "complete task",
          "from the plan",
          "as planned",
          "following the plan",
          "next todo",
          "checklist item",
        ],
      },
    },
  },
  strategies: {
    "cost-optimized": {
      "coding-simple": {
        simple: "zai-coding-plan/glm-4.6",
        medium: "zai-coding-plan/glm-4.6",
        complex: ["anthropic/claude-sonnet-4-5", "zai-coding-plan/glm-4.6"],
        advanced: [
          "openai/gpt-5-codex-high",
          "anthropic/claude-sonnet-4-5",
          "zai-coding-plan/glm-4.6",
        ],
      },
      "coding-complex": {
        simple: "zai-coding-plan/glm-4.6",
        medium: ["anthropic/claude-haiku-4-5", "zai-coding-plan/glm-4.6"],
        complex: ["anthropic/claude-sonnet-4-5", "zai-coding-plan/glm-4.6"],
        advanced: [
          "openai/gpt-5-codex-high",
          "anthropic/claude-sonnet-4-5",
        ],
      },
      planning: {
        simple: "anthropic/claude-haiku-4-5",
        medium: [
          "openai/gpt-5-codex-medium",
          "anthropic/claude-sonnet-4-5",
        ],
        complex: [
          "openai/gpt-5-codex-high",
          "anthropic/claude-sonnet-4-5",
        ],
        advanced: "openai/gpt-5-codex-high",
      },
      debugging: {
        simple: "zai-coding-plan/glm-4.6",
        medium: ["anthropic/claude-haiku-4-5", "zai-coding-plan/glm-4.6"],
        complex: [
          "anthropic/claude-sonnet-4-5",
          "openai/gpt-5-codex-medium",
        ],
        advanced: [
          "openai/gpt-5-codex-high",
          "anthropic/claude-sonnet-4-5",
        ],
      },
      review: {
        simple: "anthropic/claude-haiku-4-5",
        medium: "anthropic/claude-haiku-4-5",
        complex: ["anthropic/claude-sonnet-4-5", "anthropic/claude-haiku-4-5"],
        advanced: "anthropic/claude-sonnet-4-5",
      },
      documentation: {
        simple: "zai-coding-plan/glm-4.6",
        medium: "zai-coding-plan/glm-4.6",
        complex: ["anthropic/claude-haiku-4-5", "zai-coding-plan/glm-4.6"],
        advanced: "anthropic/claude-sonnet-4-5",
      },
      general: {
        simple: "zai-coding-plan/glm-4.6",
        medium: "zai-coding-plan/glm-4.6",
        complex: ["anthropic/claude-haiku-4-5", "zai-coding-plan/glm-4.6"],
        advanced: "anthropic/claude-sonnet-4-5",
      },
    },
    "performance-optimized": {
      "coding-simple": {
        simple: "anthropic/claude-haiku-4-5",
        medium: "anthropic/claude-haiku-4-5",
        complex: [
          "anthropic/claude-sonnet-4-5",
          "openai/gpt-5-codex-medium",
          "anthropic/claude-haiku-4-5",
        ],
        advanced: [
          "openai/gpt-5-codex-high",
          "anthropic/claude-sonnet-4-5",
        ],
      },
      "coding-complex": {
        simple: "anthropic/claude-haiku-4-5",
        medium: [
          "anthropic/claude-sonnet-4-5",
          "openai/gpt-5-codex-medium",
        ],
        complex: [
          "openai/gpt-5-codex-high",
          "anthropic/claude-sonnet-4-5",
        ],
        advanced: "openai/gpt-5-codex-high",
      },
      planning: {
        simple: "anthropic/claude-sonnet-4-5",
        medium: [
          "openai/gpt-5-codex-medium",
          "anthropic/claude-sonnet-4-5",
        ],
        complex: [
          "openai/gpt-5-codex-high",
          "anthropic/claude-sonnet-4-5",
        ],
        advanced: "openai/gpt-5-codex-high",
      },
      debugging: {
        simple: "anthropic/claude-haiku-4-5",
        medium: [
          "anthropic/claude-sonnet-4-5",
          "openai/gpt-5-codex-medium",
        ],
        complex: [
          "openai/gpt-5-codex-high",
          "anthropic/claude-sonnet-4-5",
        ],
        advanced: "openai/gpt-5-codex-high",
      },
      review: {
        simple: "anthropic/claude-haiku-4-5",
        medium: "anthropic/claude-sonnet-4-5",
        complex: "anthropic/claude-sonnet-4-5",
        advanced: [
          "openai/gpt-5-codex-high",
          "anthropic/claude-sonnet-4-5",
        ],
      },
      documentation: {
        simple: "anthropic/claude-haiku-4-5",
        medium: "anthropic/claude-haiku-4-5",
        complex: "anthropic/claude-sonnet-4-5",
        advanced: "anthropic/claude-sonnet-4-5",
      },
      general: {
        simple: "anthropic/claude-haiku-4-5",
        medium: "anthropic/claude-haiku-4-5",
        complex: "anthropic/claude-sonnet-4-5",
        advanced: "anthropic/claude-sonnet-4-5",
      },
    },
    balanced: {
      "coding-simple": {
        simple: "zai-coding-plan/glm-4.6",
        medium: ["anthropic/claude-haiku-4-5", "zai-coding-plan/glm-4.6"],
        complex: ["anthropic/claude-sonnet-4-5", "anthropic/claude-haiku-4-5"],
        advanced: [
          "openai/gpt-5-codex-high",
          "anthropic/claude-sonnet-4-5",
        ],
      },
      "coding-complex": {
        simple: "anthropic/claude-haiku-4-5",
        medium: [
          "anthropic/claude-sonnet-4-5",
          "anthropic/claude-haiku-4-5",
        ],
        complex: [
          "anthropic/claude-sonnet-4-5",
          "openai/gpt-5-codex-medium",
        ],
        advanced: [
          "openai/gpt-5-codex-high",
          "anthropic/claude-sonnet-4-5",
        ],
      },
      planning: {
        simple: "anthropic/claude-haiku-4-5",
        medium: [
          "anthropic/claude-sonnet-4-5",
          "openai/gpt-5-codex-medium",
        ],
        complex: [
          "openai/gpt-5-codex-high",
          "anthropic/claude-sonnet-4-5",
        ],
        advanced: "openai/gpt-5-codex-high",
      },
      debugging: {
        simple: "anthropic/claude-haiku-4-5",
        medium: ["anthropic/claude-sonnet-4-5", "anthropic/claude-haiku-4-5"],
        complex: [
          "anthropic/claude-sonnet-4-5",
          "openai/gpt-5-codex-medium",
        ],
        advanced: [
          "openai/gpt-5-codex-high",
          "anthropic/claude-sonnet-4-5",
        ],
      },
      review: {
        simple: "anthropic/claude-haiku-4-5",
        medium: "anthropic/claude-sonnet-4-5",
        complex: "anthropic/claude-sonnet-4-5",
        advanced: "anthropic/claude-sonnet-4-5",
      },
      documentation: {
        simple: "zai-coding-plan/glm-4.6",
        medium: "anthropic/claude-haiku-4-5",
        complex: "anthropic/claude-haiku-4-5",
        advanced: "anthropic/claude-sonnet-4-5",
      },
      general: {
        simple: "zai-coding-plan/glm-4.6",
        medium: "anthropic/claude-haiku-4-5",
        complex: "anthropic/claude-sonnet-4-5",
        advanced: "anthropic/claude-sonnet-4-5",
      },
    },
  },
  taskTypeIndicators: {
    "coding-simple": {
      keywords: ["fix typo", "update text", "change variable", "rename"],
    },
    "coding-complex": {
      keywords: [
        "refactor",
        "implement",
        "architecture",
        "system",
        "algorithm",
        "optimize performance",
      ],
    },
    planning: {
      keywords: ["plan", "design", "architecture", "strategy", "approach"],
    },
    debugging: {
      keywords: ["debug", "fix bug", "error", "issue", "problem", "crash"],
    },
    review: {
      keywords: ["review", "analyze", "check", "audit", "assess"],
    },
    documentation: {
      keywords: ["document", "readme", "docs", "comment", "explain"],
    },
  },
  complexityIndicators: {
    simple: {
      keywords: ["typo", "small change", "quick fix", "minor"],
      tokenRanges: [0, 500],
    },
    medium: {
      keywords: ["update", "add feature", "modify"],
      tokenRanges: [500, 2000],
    },
    complex: {
      keywords: ["refactor", "redesign", "multiple files"],
      tokenRanges: [2000, 5000],
    },
    advanced: {
      keywords: [
        "architecture",
        "system-wide",
        "major refactor",
        "performance optimization",
      ],
      tokenRanges: [5000, 999999],
    },
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function log(message: string, level: LogLevel, config: OrchestratorConfig) {
  const levels: LogLevel[] = ["quiet", "normal", "verbose"];
  const messageLevel = levels.indexOf(level);
  const configLevel = levels.indexOf(config.logLevel);

  if (messageLevel <= configLevel) {
    console.log(`[Orchestrator V3] ${message}`);
  }
}

async function loadConfig(directory: string): Promise<OrchestratorConfig> {
  // Try to load JSON config file
  const configPath = join(directory, "orchestrator.config.json");

  if (existsSync(configPath)) {
    try {
      const content = await readFile(configPath, "utf-8");
      const userConfig = JSON.parse(content);

      // Deep merge with defaults
      return {
        ...DEFAULT_CONFIG,
        ...userConfig,
        defaultModel: {
          ...DEFAULT_CONFIG.defaultModel,
          ...(userConfig.defaultModel || {}),
        },
        agentStrategies: {
          ...DEFAULT_CONFIG.agentStrategies,
          ...(userConfig.agentStrategies || {}),
        },
        detection: {
          ...DEFAULT_CONFIG.detection,
          ...(userConfig.detection || {}),
          contextAware: {
            ...DEFAULT_CONFIG.detection.contextAware,
            ...(userConfig.detection?.contextAware || {}),
            planAwareness: {
              ...DEFAULT_CONFIG.detection.contextAware.planAwareness,
              ...(userConfig.detection?.contextAware?.planAwareness || {}),
            },
            subtaskDetection: {
              ...DEFAULT_CONFIG.detection.contextAware.subtaskDetection,
              ...(userConfig.detection?.contextAware?.subtaskDetection || {}),
            },
          },
        },
        strategies: {
          ...DEFAULT_CONFIG.strategies,
          ...(userConfig.strategies || {}),
        },
      };
    } catch (err) {
      console.error(
        `[Orchestrator V3] Failed to load config: ${err}. Using defaults.`
      );
      return DEFAULT_CONFIG;
    }
  }

  // No config file, use defaults
  return DEFAULT_CONFIG;
}

function estimateTokenCount(text: string): number {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4);
}

function detectTaskType(
  prompt: string,
  config: OrchestratorConfig
): TaskType {
  const lower = prompt.toLowerCase();

  // Check each task type's keywords
  const indicators = config.taskTypeIndicators || {};

  for (const [taskType, data] of Object.entries(indicators)) {
    for (const keyword of data.keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        return taskType as TaskType;
      }
    }
  }

  // Default: general
  return "general";
}

function detectComplexity(
  prompt: string,
  tokenCount: number,
  config: OrchestratorConfig
): Complexity {
  const lower = prompt.toLowerCase();
  const indicators = config.complexityIndicators || {};

  // Check keywords
  for (const [complexity, data] of Object.entries(indicators).reverse()) {
    for (const keyword of data.keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        return complexity as Complexity;
      }
    }
  }

  // Check token ranges
  for (const [complexity, data] of Object.entries(indicators)) {
    if (data.tokenRanges) {
      const [min, max] = data.tokenRanges;
      if (tokenCount >= min && tokenCount <= max) {
        return complexity as Complexity;
      }
    }
  }

  // Default: medium
  return "medium";
}

function detectPlan(prompt: string, config: OrchestratorConfig): boolean {
  if (!config.detection.contextAware.planAwareness.enabled) {
    return false;
  }

  const indicators =
    config.detection.contextAware.planAwareness.planIndicators;
  const lower = prompt.toLowerCase();

  let matchCount = 0;
  for (const indicator of indicators) {
    if (lower.includes(indicator.toLowerCase())) {
      matchCount++;
    }
  }

  return (
    matchCount >= config.detection.contextAware.planAwareness.minStepsForReduction
  );
}

function detectSubtask(prompt: string, config: OrchestratorConfig): boolean {
  if (!config.detection.contextAware.subtaskDetection.enabled) {
    return false;
  }

  const indicators =
    config.detection.contextAware.subtaskDetection.subtaskIndicators;
  const lower = prompt.toLowerCase();

  for (const indicator of indicators) {
    if (lower.includes(indicator.toLowerCase())) {
      return true;
    }
  }

  return false;
}

function adjustComplexityForContext(
  baseComplexity: Complexity,
  contextSize: number,
  hasPlan: boolean,
  isSubtask: boolean
): Complexity {
  const levels: Complexity[] = ["simple", "medium", "complex", "advanced"];
  let currentIndex = levels.indexOf(baseComplexity);

  // Context size adjustment
  if (contextSize < 50000) {
    currentIndex = Math.max(0, currentIndex - 1);
  } else if (contextSize > 100000) {
    currentIndex = Math.min(levels.length - 1, currentIndex + 1);
  }

  // Plan awareness: reduce complexity if detailed plan exists
  if (hasPlan || isSubtask) {
    currentIndex = Math.max(0, currentIndex - 1);
  }

  return levels[currentIndex];
}

function analyzePrompt(
  prompt: string,
  sessionID: string,
  config: OrchestratorConfig,
  strategy: Strategy
): PromptAnalysis {
  const tokenCount = estimateTokenCount(prompt);
  const taskType = detectTaskType(prompt, config);
  const baseComplexity = detectComplexity(prompt, tokenCount, config);

  const hasPlan = detectPlan(prompt, config);
  const isSubtask = detectSubtask(prompt, config);

  const complexity = config.detection.contextAware.enabled
    ? adjustComplexityForContext(baseComplexity, tokenCount, hasPlan, isSubtask)
    : baseComplexity;

  log(
    `Analysis: taskType=${taskType}, complexity=${complexity} (base: ${baseComplexity}), tokens=${tokenCount}, hasPlan=${hasPlan}, isSubtask=${isSubtask}`,
    "verbose",
    config
  );

  return {
    taskType,
    complexity,
    contextSize: tokenCount,
    hasPlan,
    isSubtask,
  };
}

function selectModels(
  strategy: Strategy,
  taskType: TaskType,
  complexity: Complexity,
  config: OrchestratorConfig
): string[] {
  const strategyConfig = config.strategies[strategy];
  if (!strategyConfig) {
    log(`Strategy ${strategy} not found, using default`, "normal", config);
    return [`${config.defaultModel.providerID}/${config.defaultModel.modelID}`];
  }

  const taskConfig = strategyConfig[taskType];
  if (!taskConfig) {
    log(
      `Task type ${taskType} not found in strategy ${strategy}, using default`,
      "normal",
      config
    );
    return [`${config.defaultModel.providerID}/${config.defaultModel.modelID}`];
  }

  const modelConfig = taskConfig[complexity];
  if (!modelConfig) {
    log(
      `Complexity ${complexity} not found for ${taskType} in ${strategy}, using default`,
      "normal",
      config
    );
    return [`${config.defaultModel.providerID}/${config.defaultModel.modelID}`];
  }

  // Return array of models (either single model or fallback chain)
  return Array.isArray(modelConfig) ? modelConfig : [modelConfig];
}

// ============================================================================
// PLUGIN EXPORT
// ============================================================================

export const OrchestratorPlugin: Plugin = async ({ directory }) => {
  const config = await loadConfig(directory);

  if (!config.enabled) {
    console.log("[Orchestrator V3] Plugin disabled in config");
    return {};
  }

  log("Plugin initialized (standalone version)", "normal", config);

  return {
    "prompt.before": async (input, output) => {
      try {
        // Check if optimization is enabled via toggle
        if (!input.optimizeEnabled) {
          log("Optimization disabled by user (toggle OFF)", "verbose", config);
          return;
        }

        log(
          `Processing prompt for agent: ${input.agent}`,
          "verbose",
          config
        );

        // Get strategy for this agent
        const strategy =
          (config.agentStrategies[input.agent] as Strategy) || "balanced";
        log(`Using strategy: ${strategy}`, "verbose", config);

        // Analyze the prompt
        const analysis = analyzePrompt(
          input.prompt,
          input.sessionID,
          config,
          strategy
        );

        // Get recommended models (with fallback chain)
        const models = selectModels(
          strategy,
          analysis.taskType,
          analysis.complexity,
          config
        );

        if (models && models.length > 0) {
          const [providerID, modelID] = models[0].split("/");

          // Override the model selection
          output.model = { providerID, modelID };

          log(
            `✅ Selected: ${providerID}/${modelID} (${analysis.taskType} / ${analysis.complexity})`,
            "normal",
            config
          );

          // Log fallback chain if exists
          if (models.length > 1) {
            log(`Fallback chain: ${models.join(" → ")}`, "verbose", config);
          }
        }
      } catch (err) {
        console.error(`[Orchestrator V3] Error in prompt.before hook:`, err);
        // Don't override model on error - let OpenCode use default
      }
    },
  };
};

export default OrchestratorPlugin;
