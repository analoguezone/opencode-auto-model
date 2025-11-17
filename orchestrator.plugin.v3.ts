/**
 * OpenCode Intelligent Orchestrator Plugin V3.0
 *
 * NOW WORKS with prompt.before hook!
 *
 * Features:
 * - Respects OPTIMIZE toggle (checks input.optimizeEnabled)
 * - Dynamic model selection based on task complexity
 * - Context-aware complexity adjustment
 * - Plan detection and subtask detection
 * - Per-level fallback arrays
 *
 * @author OpenCode Auto Model
 * @version 3.0.0
 */

import type { Plugin } from "@opencode-ai/plugin";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import yaml from "yaml";

// ============================================================================
// Types
// ============================================================================

type TaskType = "coding-simple" | "coding-complex" | "planning" | "debugging" | "review" | "documentation" | "general";
type Complexity = "simple" | "medium" | "complex" | "advanced";
type Strategy = "cost-optimized" | "performance-optimized" | "balanced";

interface OrchestratorConfig {
  enabled: boolean;
  logLevel: "silent" | "minimal" | "normal" | "verbose";
  defaultModel: { providerID: string; modelID: string };

  // Agent-to-strategy mapping
  agentStrategies: Record<string, Strategy>;

  // Detection settings
  detection: {
    useTokenCount: boolean;
    useKeywords: boolean;
    contextAware?: {
      enabled: boolean;
      planAwareness?: {
        enabled: boolean;
        planIndicators: string[];
        minStepsForReduction: number;
      };
      subtaskDetection?: {
        enabled: boolean;
        subtaskIndicators: string[];
      };
    };
  };

  // Multi-dimensional model selection
  strategies: Record<Strategy, StrategyConfig>;

  // Task type detection
  taskTypeIndicators: Record<TaskType, TaskTypeIndicator>;

  // Complexity indicators
  indicators: Record<Complexity, ComplexityIndicator>;
}

interface StrategyConfig {
  [taskType: string]: {
    [complexity: string]: string | string[]; // Single model or fallback array
  };
}

interface TaskTypeIndicator {
  keywords: string[];
}

interface ComplexityIndicator {
  keywords: string[];
  tokenRange: { min: number; max: number };
}

// ============================================================================
// Main Plugin
// ============================================================================

export const OrchestratorPlugin: Plugin = async ({ directory }) => {
  // Load configuration
  const config = await loadConfig(directory);

  if (!config.enabled) {
    console.log("[Orchestrator] Plugin is disabled in config");
    return {};
  }

  console.log("[Orchestrator V3] ✅ Plugin loaded and enabled");
  console.log("[Orchestrator V3] Will respect OPTIMIZE toggle");

  return {
    /**
     * NEW: prompt.before hook - fires BEFORE LLM call
     * This is where we can change the model!
     */
    "prompt.before": async (input, output) => {
      // Check if optimization is enabled via toggle
      if (!input.optimizeEnabled) {
        log("Optimization disabled by user (toggle OFF)", "verbose", config);
        return; // Skip optimization
      }

      log(`Analyzing prompt for agent: ${input.agent}`, "verbose", config);

      // Get strategy for this agent
      const strategy = config.agentStrategies[input.agent] || "balanced";

      try {
        // Analyze the prompt
        const analysis = analyzePrompt(
          input.prompt,
          input.sessionID,
          config,
          strategy
        );

        log(
          `Task: ${analysis.taskType}, Complexity: ${analysis.complexity}, Strategy: ${strategy}`,
          "normal",
          config
        );

        // Get recommended model
        const models = selectModels(
          strategy,
          analysis.taskType,
          analysis.complexity,
          config
        );

        if (models && models.length > 0) {
          const [providerID, modelID] = models[0].split("/");

          // Override the model selection
          output.model = {
            providerID,
            modelID,
          };

          log(`✅ Selected: ${providerID}/${modelID}`, "normal", config);

          if (models.length > 1) {
            log(`   Fallbacks: ${models.slice(1).join(", ")}`, "verbose", config);
          }

          // Add reasoning to context
          if (config.logLevel === "normal" || config.logLevel === "verbose") {
            output.additionalContext = `\n<!-- Orchestrator: Using ${providerID}/${modelID} for ${analysis.taskType}/${analysis.complexity} task -->\n`;
          }
        }
      } catch (error) {
        log(`Error in orchestrator: ${error}`, "minimal", config);
      }
    },
  };
};

// ============================================================================
// Analysis Functions
// ============================================================================

interface AnalysisResult {
  taskType: TaskType;
  complexity: Complexity;
  reasoning: string[];
}

function analyzePrompt(
  prompt: string,
  sessionID: string,
  config: OrchestratorConfig,
  strategy: Strategy
): AnalysisResult {
  const reasoning: string[] = [];

  // Detect task type
  const taskType = detectTaskType(prompt, config);
  reasoning.push(`Detected ${taskType} task`);

  // Detect base complexity
  let complexity = detectComplexity(prompt, config);
  reasoning.push(`Base complexity: ${complexity}`);

  // Context-aware adjustments (simplified for V3)
  if (config.detection.contextAware?.enabled) {
    // Check for plan indicators
    if (config.detection.contextAware.planAwareness?.enabled) {
      const indicators = config.detection.contextAware.planAwareness.planIndicators;
      const hasPlan = indicators.some((ind) =>
        prompt.toLowerCase().includes(ind.toLowerCase())
      );

      if (hasPlan && complexity !== "simple") {
        const oldComplexity = complexity;
        complexity = reduceComplexity(complexity);
        reasoning.push(`Plan detected: ${oldComplexity} → ${complexity}`);
      }
    }

    // Check for subtask indicators
    if (config.detection.contextAware.subtaskDetection?.enabled) {
      const indicators = config.detection.contextAware.subtaskDetection.subtaskIndicators;
      const isSubtask = indicators.some((ind) =>
        prompt.toLowerCase().includes(ind.toLowerCase())
      );

      if (isSubtask && complexity !== "simple") {
        const oldComplexity = complexity;
        complexity = reduceComplexity(complexity);
        reasoning.push(`Subtask detected: ${oldComplexity} → ${complexity}`);
      }
    }
  }

  return {
    taskType,
    complexity,
    reasoning,
  };
}

function detectTaskType(prompt: string, config: OrchestratorConfig): TaskType {
  const promptLower = prompt.toLowerCase();
  let bestMatch: TaskType = "general";
  let bestScore = 0;

  for (const [taskType, indicator] of Object.entries(config.taskTypeIndicators)) {
    const score = indicator.keywords.filter((kw) =>
      promptLower.includes(kw.toLowerCase())
    ).length;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = taskType as TaskType;
    }
  }

  return bestMatch;
}

function detectComplexity(prompt: string, config: OrchestratorConfig): Complexity {
  const promptLower = prompt.toLowerCase();
  const tokenCount = estimateTokenCount(prompt);

  const scores: Record<Complexity, number> = {
    simple: 0,
    medium: 0,
    complex: 0,
    advanced: 0,
  };

  // Score by keywords
  for (const [complexity, indicator] of Object.entries(config.indicators)) {
    const keywordScore = indicator.keywords.filter((kw) =>
      promptLower.includes(kw.toLowerCase())
    ).length;

    scores[complexity as Complexity] += keywordScore * 3;

    // Score by token count
    if (
      tokenCount >= indicator.tokenRange.min &&
      tokenCount <= indicator.tokenRange.max
    ) {
      scores[complexity as Complexity] += 2;
    }
  }

  // Return highest score
  let maxComplexity: Complexity = "simple";
  let maxScore = scores.simple;

  for (const complexity of ["medium", "complex", "advanced"] as Complexity[]) {
    if (scores[complexity] > maxScore) {
      maxScore = scores[complexity];
      maxComplexity = complexity;
    }
  }

  return maxComplexity;
}

function selectModels(
  strategy: Strategy,
  taskType: TaskType,
  complexity: Complexity,
  config: OrchestratorConfig
): string[] | null {
  const strategyModels = config.strategies[strategy]?.[taskType]?.[complexity];

  if (Array.isArray(strategyModels)) {
    return strategyModels;
  } else if (typeof strategyModels === "string") {
    return [strategyModels];
  }

  // Fallback to general
  const generalModels = config.strategies[strategy]?.general?.[complexity];
  if (Array.isArray(generalModels)) {
    return generalModels;
  } else if (typeof generalModels === "string") {
    return [generalModels];
  }

  return null;
}

// ============================================================================
// Helper Functions
// ============================================================================

function reduceComplexity(complexity: Complexity): Complexity {
  const levels: Complexity[] = ["simple", "medium", "complex", "advanced"];
  const index = levels.indexOf(complexity);
  return index > 0 ? levels[index - 1] : complexity;
}

function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

function log(message: string, level: OrchestratorConfig["logLevel"], config: OrchestratorConfig) {
  const levels = ["silent", "minimal", "normal", "verbose"];
  const configLevel = levels.indexOf(config.logLevel);
  const messageLevel = levels.indexOf(level);

  if (messageLevel <= configLevel) {
    console.log(`[Orchestrator V3] ${message}`);
  }
}

// ============================================================================
// Config Loading
// ============================================================================

let _configCache: OrchestratorConfig | null = null;

async function loadConfig(directory: string): Promise<OrchestratorConfig> {
  if (_configCache) {
    return _configCache;
  }

  const configPaths = [
    join(directory, ".opencode", "orchestrator.config.md"),
    join(process.env.HOME || "~", ".config", "opencode", "orchestrator.config.md"),
  ];

  for (const path of configPaths) {
    if (existsSync(path)) {
      try {
        const content = await readFile(path, "utf-8");
        const config = parseConfig(content);
        console.log(`[Orchestrator V3] Loaded config from ${path}`);
        _configCache = config;
        return config;
      } catch (error) {
        console.error(`[Orchestrator V3] Error loading config:`, error);
      }
    }
  }

  console.log("[Orchestrator V3] No config found, using defaults");
  const defaultConfig = getDefaultConfig();
  _configCache = defaultConfig;
  return defaultConfig;
}

function parseConfig(content: string): OrchestratorConfig {
  // Extract YAML frontmatter
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    throw new Error("No YAML frontmatter found");
  }

  const config = yaml.parse(match[1]) as OrchestratorConfig;

  // Validate required fields
  if (!config.enabled === undefined) {
    config.enabled = true;
  }

  if (!config.logLevel) {
    config.logLevel = "normal";
  }

  return config;
}

function getDefaultConfig(): OrchestratorConfig {
  return {
    enabled: true,
    logLevel: "normal",
    defaultModel: {
      providerID: "anthropic",
      modelID: "claude-sonnet-4-5-20250929",
    },
    agentStrategies: {
      "auto-optimized": "cost-optimized",
      "auto-performance": "performance-optimized",
    },
    detection: {
      useTokenCount: true,
      useKeywords: true,
      contextAware: {
        enabled: true,
        planAwareness: {
          enabled: true,
          planIndicators: ["step 1", "step 2", "- [ ]", "1.", "## Plan"],
          minStepsForReduction: 3,
        },
        subtaskDetection: {
          enabled: true,
          subtaskIndicators: ["implement step", "from the plan", "following the plan"],
        },
      },
    },
    strategies: {
      "cost-optimized": {
        "coding-simple": {
          simple: "zai-coding-plan/glm-4.6",
          medium: "zai-coding-plan/glm-4.6",
          complex: "anthropic/claude-sonnet-4-5-20250929",
          advanced: "openai/gpt-5-codex-high",
        },
        general: {
          simple: "zai-coding-plan/glm-4.6",
          medium: "zai-coding-plan/glm-4.6",
          complex: "anthropic/claude-haiku-4-20250514",
          advanced: "anthropic/claude-sonnet-4-5-20250929",
        },
      },
      "performance-optimized": {
        "coding-simple": {
          simple: "anthropic/claude-haiku-4-20250514",
          medium: "anthropic/claude-sonnet-4-5-20250929",
          complex: "anthropic/claude-sonnet-4-5-20250929",
          advanced: "openai/gpt-5-codex-high",
        },
        general: {
          simple: "anthropic/claude-haiku-4-20250514",
          medium: "anthropic/claude-sonnet-4-5-20250929",
          complex: "anthropic/claude-sonnet-4-5-20250929",
          advanced: "anthropic/claude-sonnet-4-5-20250929",
        },
      },
      balanced: {
        "coding-simple": {
          simple: "anthropic/claude-haiku-4-20250514",
          medium: "anthropic/claude-sonnet-4-5-20250929",
          complex: "anthropic/claude-sonnet-4-5-20250929",
          advanced: "openai/gpt-5-codex-high",
        },
        general: {
          simple: "anthropic/claude-haiku-4-20250514",
          medium: "anthropic/claude-sonnet-4-5-20250929",
          complex: "anthropic/claude-sonnet-4-5-20250929",
          advanced: "anthropic/claude-sonnet-4-5-20250929",
        },
      },
    },
    taskTypeIndicators: {
      "coding-simple": {
        keywords: ["fix", "update", "add", "change", "typo", "simple"],
      },
      "coding-complex": {
        keywords: ["refactor", "architecture", "redesign", "migrate"],
      },
      planning: {
        keywords: ["plan", "design", "architecture", "strategy"],
      },
      debugging: {
        keywords: ["debug", "error", "bug", "issue", "problem"],
      },
      review: {
        keywords: ["review", "check", "audit", "analyze"],
      },
      documentation: {
        keywords: ["document", "readme", "doc", "comment"],
      },
      general: {
        keywords: [],
      },
    },
    indicators: {
      simple: {
        keywords: ["quick", "simple", "minor", "small", "typo"],
        tokenRange: { min: 0, max: 100 },
      },
      medium: {
        keywords: ["add", "update", "modify", "feature"],
        tokenRange: { min: 100, max: 300 },
      },
      complex: {
        keywords: ["refactor", "redesign", "optimize"],
        tokenRange: { min: 300, max: 600 },
      },
      advanced: {
        keywords: ["architecture", "migrate", "comprehensive"],
        tokenRange: { min: 600, max: 999999 },
      },
    },
  };
}
