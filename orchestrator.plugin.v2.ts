/**
 * OpenCode Intelligent Orchestrator Plugin V2
 *
 * Multi-dimensional model selection: Strategy × Task Type × Complexity
 *
 * @author OpenCode Auto Model
 * @version 2.0.0
 */

import type { Plugin } from "@opencode-ai/plugin";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import yaml from "yaml";

// ============================================================================
// Types - V2 Configuration
// ============================================================================

type TaskType = "coding" | "planning" | "debugging" | "review" | "documentation" | "general";
type Complexity = "simple" | "medium" | "complex" | "advanced";
type Strategy = "cost-optimized" | "performance-optimized" | "balanced";

interface OrchestratorConfigV2 {
  enabled: boolean;
  logLevel: "silent" | "minimal" | "normal" | "verbose";
  defaultModel: string;

  // Agent activation
  activeAgents: string[];

  // Agent-to-strategy mapping
  agentStrategies: Record<string, Strategy>;

  // Complexity detection settings
  detection: {
    useTokenCount: boolean;
    useCodePatterns: boolean;
    useKeywords: boolean;
    useAIEstimation: boolean;
  };

  // Multi-dimensional model selection
  strategies: Record<Strategy, StrategyConfig>;

  // Task type detection
  taskTypeIndicators: Record<TaskType, TaskTypeIndicator>;

  // Complexity indicators
  indicators: Record<Complexity, ComplexityIndicator>;

  // File pattern overrides
  filePatternOverrides?: FilePatternOverride[];

  // Cost optimization
  costOptimization?: CostOptimizationConfig;

  // Fallback chain
  fallback?: string[];
}

interface StrategyConfig {
  [taskType: string]: {
    [complexity: string]: string; // model ID
  };
}

interface TaskTypeIndicator {
  keywords: string[];
  patterns: string[];
}

interface ComplexityIndicator {
  keywords: string[];
  patterns: string[];
  tokenRange: {
    min: number;
    max: number;
  };
  fileCount?: {
    min?: number;
    max?: number;
  };
}

interface FilePatternOverride {
  pattern: string;
  model?: string;
  taskTypeOverride?: TaskType;
  reason: string;
}

interface CostOptimizationConfig {
  enabled: boolean;
  allowDowngrade: boolean;
  maxCostPerRequest: number;
}

interface AnalysisResult {
  complexity: Complexity;
  taskType: TaskType;
  strategy: Strategy;
  recommendedModel: string;
  reasoning: string[];
  confidence: number;
}

// ============================================================================
// Main Plugin
// ============================================================================

export const OrchestratorPlugin: Plugin = async ({ project, client, $, directory, worktree }) => {
  // Load configuration
  const config = await loadConfig(directory);

  if (!config.enabled) {
    log("Orchestrator plugin is disabled", "minimal", config);
    return {};
  }

  log("Orchestrator V2 plugin initialized", "normal", config);
  log(`Active agents: ${config.activeAgents.join(", ")}`, "verbose", config);

  // Track current session/agent info
  let currentSessionId: string | null = null;
  let currentAgent: string | null = null;
  let currentStrategy: Strategy | null = null;

  // ============================================================================
  // Hooks
  // ============================================================================

  return {
    /**
     * Hook into events to detect agent changes
     */
    event: async ({ event }) => {
      if (config.logLevel === "verbose") {
        console.log(`[Orchestrator] Event: ${event.type}`, event.properties);
      }

      if (event.type === "session.start" || event.type === "session.create") {
        currentSessionId = event.properties?.id || null;

        // Try to get session info to check agent
        if (currentSessionId && client) {
          try {
            const session = await client.session.get({ path: { id: currentSessionId } });
            currentAgent = session.agent || session.agentName || null;

            // Map agent to strategy
            if (currentAgent && config.agentStrategies[currentAgent]) {
              currentStrategy = config.agentStrategies[currentAgent];
              log(`Session started with orchestrator agent: ${currentAgent} (strategy: ${currentStrategy})`, "normal", config);
            }
          } catch (error) {
            log(`Could not get session info: ${error}`, "verbose", config);
          }
        }
      }
    },

    /**
     * Hook into tool execution to intercept prompts
     */
    "tool.execute.before": async (input, output) => {
      // Only intercept prompts
      if (input.tool !== "prompt" && input.tool !== "message" && input.tool !== "session.prompt") {
        return;
      }

      // Check if orchestrator should activate
      const shouldActivate = await checkShouldActivate(config, client, output.args, currentAgent);

      if (!shouldActivate.active) {
        log(`Orchestrator not active: ${shouldActivate.reason}`, "verbose", config);
        return;
      }

      // Determine strategy from agent
      const strategy = currentStrategy || shouldActivate.strategy || "balanced";

      log(`Orchestrator active: agent=${shouldActivate.agent}, strategy=${strategy}`, "verbose", config);

      try {
        const promptText = extractPromptText(output.args);

        if (!promptText) {
          log("Could not extract prompt text, skipping orchestration", "verbose", config);
          return;
        }

        log(`Analyzing prompt: "${promptText.substring(0, 100)}..."`, "verbose", config);

        // Perform multi-dimensional analysis
        const analysis = await analyzePrompt(promptText, config, output.args, strategy);

        log(`Analysis: ${analysis.taskType}/${analysis.complexity} → ${analysis.recommendedModel}`, "normal", config);

        if (config.logLevel === "normal" || config.logLevel === "verbose") {
          console.log("\n[Orchestrator V2] Task Analysis:");
          console.log(`  Strategy: ${analysis.strategy}`);
          console.log(`  Task Type: ${analysis.taskType}`);
          console.log(`  Complexity: ${analysis.complexity}`);
          console.log(`  Model: ${analysis.recommendedModel}`);
          console.log(`  Reasoning:`);
          analysis.reasoning.forEach(r => console.log(`    - ${r}`));
          console.log("");
        }

        // Update model in args
        if (output.args.model) {
          const [providerId, modelId] = analysis.recommendedModel.split("/");
          output.args.model = {
            providerID: providerId,
            modelID: modelId,
          };
          log(`Updated model to ${analysis.recommendedModel}`, "verbose", config);
        }

      } catch (error) {
        log(`Error in orchestrator: ${error}`, "minimal", config);
        console.error("[Orchestrator] Error:", error);
      }
    },

    /**
     * Custom tool: Check complexity and model selection
     */
    tool: {
      checkComplexity: {
        description: "Check what model the orchestrator would select for a given prompt",
        parameters: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "The prompt to analyze",
            },
            strategy: {
              type: "string",
              enum: ["cost-optimized", "performance-optimized", "balanced"],
              description: "Strategy to use (optional)",
            },
          },
          required: ["prompt"],
        },
        async execute(args: { prompt: string; strategy?: Strategy }) {
          const strategy = args.strategy || currentStrategy || "balanced";
          const analysis = await analyzePrompt(args.prompt, config, {}, strategy);
          return {
            strategy: analysis.strategy,
            taskType: analysis.taskType,
            complexity: analysis.complexity,
            model: analysis.recommendedModel,
            reasoning: analysis.reasoning,
            confidence: analysis.confidence,
          };
        },
      },
    },
  };
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Load orchestrator configuration
 */
async function loadConfig(directory: string): Promise<OrchestratorConfigV2> {
  const configPaths = [
    join(directory, ".opencode", "orchestrator.config.md"),
    join(directory, ".opencode", "orchestrator.config.yaml"),
    join(process.env.HOME || "~", ".config", "opencode", "orchestrator.config.md"),
    join(process.env.HOME || "~", ".config", "opencode", "orchestrator.config.yaml"),
  ];

  for (const path of configPaths) {
    if (existsSync(path)) {
      try {
        const content = await readFile(path, "utf-8");
        const config = parseConfig(content);
        console.log(`[Orchestrator] Loaded config from ${path}`);
        return config;
      } catch (error) {
        console.error(`[Orchestrator] Error loading config from ${path}:`, error);
      }
    }
  }

  console.log("[Orchestrator] No config found, using defaults");
  return getDefaultConfig();
}

/**
 * Parse configuration from markdown or YAML
 */
function parseConfig(content: string): OrchestratorConfigV2 {
  if (content.startsWith("---")) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (match) {
      return yaml.parse(match[1]);
    }
  }
  return yaml.parse(content);
}

/**
 * Check if orchestration should activate
 */
async function checkShouldActivate(
  config: OrchestratorConfigV2,
  client: any,
  args: any,
  currentAgent: string | null
): Promise<{ active: boolean; reason: string; agent?: string; strategy?: Strategy }> {
  if (!config.activeAgents || config.activeAgents.length === 0) {
    return { active: true, reason: "No agent restrictions" };
  }

  let agentToCheck = currentAgent;

  if (!agentToCheck && args.agent) {
    agentToCheck = args.agent;
  }

  if (!agentToCheck && args.sessionId && client) {
    try {
      const session = await client.session.get({ path: { id: args.sessionId } });
      agentToCheck = session.agent || session.agentName || null;
    } catch (error) {
      // Ignore
    }
  }

  if (agentToCheck && config.activeAgents.includes(agentToCheck)) {
    const strategy = config.agentStrategies[agentToCheck];
    return {
      active: true,
      reason: `Agent ${agentToCheck} is active`,
      agent: agentToCheck,
      strategy,
    };
  }

  return {
    active: false,
    reason: agentToCheck
      ? `Agent ${agentToCheck} not in active list`
      : `No agent detected`,
  };
}

/**
 * Analyze prompt and select model (multi-dimensional)
 */
async function analyzePrompt(
  promptText: string,
  config: OrchestratorConfigV2,
  args: any,
  strategy: Strategy
): Promise<AnalysisResult> {
  const reasoning: string[] = [];

  // Step 1: Detect task type
  const taskType = detectTaskType(promptText, config);
  reasoning.push(`Task type: ${taskType}`);

  // Step 2: Determine complexity
  const complexity = detectComplexity(promptText, config);
  reasoning.push(`Complexity: ${complexity}`);

  // Step 3: Select model from strategy matrix
  let recommendedModel = config.strategies[strategy]?.[taskType]?.[complexity];

  if (!recommendedModel) {
    // Fallback to general task type
    recommendedModel = config.strategies[strategy]?.general?.[complexity];
  }

  if (!recommendedModel) {
    // Ultimate fallback
    recommendedModel = config.defaultModel;
    reasoning.push(`Using default model (no match in strategy matrix)`);
  } else {
    reasoning.push(`Selected from strategy matrix: ${strategy}.${taskType}.${complexity}`);
  }

  // Step 4: Check file pattern overrides
  if (config.filePatternOverrides && args.files) {
    for (const override of config.filePatternOverrides) {
      const files = Array.isArray(args.files) ? args.files : [args.files];
      const matchingFile = files.find((file: string) =>
        file.includes(override.pattern.replace("**/*", ""))
      );

      if (matchingFile) {
        if (override.model) {
          recommendedModel = override.model;
          reasoning.push(`File pattern override: ${override.reason}`);
        } else if (override.taskTypeOverride) {
          // Re-select with overridden task type
          const newTaskType = override.taskTypeOverride;
          const newModel = config.strategies[strategy]?.[newTaskType]?.[complexity];
          if (newModel) {
            recommendedModel = newModel;
            reasoning.push(`File pattern task override: ${newTaskType} (${override.reason})`);
          }
        }
        break;
      }
    }
  }

  return {
    strategy,
    taskType,
    complexity,
    recommendedModel,
    reasoning,
    confidence: 0.8, // Simple fixed confidence for now
  };
}

/**
 * Detect task type from prompt
 */
function detectTaskType(promptText: string, config: OrchestratorConfigV2): TaskType {
  const promptLower = promptText.toLowerCase();

  // Score each task type
  const scores: Record<TaskType, number> = {
    coding: 0,
    planning: 0,
    debugging: 0,
    review: 0,
    documentation: 0,
    general: 0,
  };

  for (const [taskType, indicator] of Object.entries(config.taskTypeIndicators)) {
    // Keyword matching
    const keywordMatches = indicator.keywords.filter(kw =>
      promptLower.includes(kw.toLowerCase())
    );
    scores[taskType as TaskType] += keywordMatches.length * 10;

    // Pattern matching
    const patternMatches = indicator.patterns.filter(pattern => {
      try {
        return new RegExp(pattern, "i").test(promptText);
      } catch {
        return false;
      }
    });
    scores[taskType as TaskType] += patternMatches.length * 15;
  }

  // Find highest scoring task type
  let maxScore = 0;
  let detectedType: TaskType = "general";

  for (const [taskType, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedType = taskType as TaskType;
    }
  }

  return detectedType;
}

/**
 * Detect complexity from prompt
 */
function detectComplexity(promptText: string, config: OrchestratorConfigV2): Complexity {
  const promptLower = promptText.toLowerCase();
  const tokenCount = estimateTokenCount(promptText);

  const scores: Record<Complexity, number> = {
    simple: 0,
    medium: 0,
    complex: 0,
    advanced: 0,
  };

  for (const [level, indicator] of Object.entries(config.indicators)) {
    // Keyword matching
    const keywordMatches = indicator.keywords.filter(kw =>
      promptLower.includes(kw.toLowerCase())
    );
    scores[level as Complexity] += keywordMatches.length * 10;

    // Pattern matching
    const patternMatches = indicator.patterns.filter(pattern => {
      try {
        return new RegExp(pattern, "i").test(promptText);
      } catch {
        return false;
      }
    });
    scores[level as Complexity] += patternMatches.length * 15;

    // Token count
    if (
      tokenCount >= indicator.tokenRange.min &&
      tokenCount <= indicator.tokenRange.max
    ) {
      scores[level as Complexity] += 20;
    }
  }

  // Find highest scoring complexity
  let maxScore = 0;
  let detectedLevel: Complexity = "medium";

  for (const [level, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedLevel = level as Complexity;
    }
  }

  return detectedLevel;
}

/**
 * Estimate token count
 */
function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Extract prompt text from args
 */
function extractPromptText(args: any): string | null {
  if (typeof args === "string") {
    return args;
  }

  if (args.text) return args.text;
  if (args.message) return args.message;
  if (args.prompt) return args.prompt;

  if (args.parts && Array.isArray(args.parts)) {
    return args.parts
      .filter((part: any) => part.type === "text")
      .map((part: any) => part.text)
      .join("\n");
  }

  if (args.body?.parts && Array.isArray(args.body.parts)) {
    return args.body.parts
      .filter((part: any) => part.type === "text")
      .map((part: any) => part.text)
      .join("\n");
  }

  return null;
}

/**
 * Get default configuration
 */
function getDefaultConfig(): OrchestratorConfigV2 {
  return {
    enabled: true,
    logLevel: "normal",
    defaultModel: "anthropic/claude-sonnet-4-5-20250929",
    activeAgents: ["auto-optimized", "auto-performance"],
    agentStrategies: {
      "auto-optimized": "cost-optimized",
      "auto-performance": "performance-optimized",
    },
    detection: {
      useTokenCount: true,
      useCodePatterns: true,
      useKeywords: true,
      useAIEstimation: false,
    },
    strategies: {
      "cost-optimized": {
        coding: {
          simple: "zhipu/glm-4-flash",
          medium: "zhipu/glm-4-flash",
          complex: "anthropic/claude-sonnet-4-5-20250929",
          advanced: "anthropic/claude-sonnet-4-5-20250929",
        },
        planning: {
          simple: "zhipu/glm-4-flash",
          medium: "zhipu/glm-4-flash",
          complex: "openai/gpt-5",
          advanced: "openai/gpt-5",
        },
        general: {
          simple: "zhipu/glm-4-flash",
          medium: "zhipu/glm-4-flash",
          complex: "anthropic/claude-haiku-4-20250514",
          advanced: "anthropic/claude-sonnet-4-5-20250929",
        },
      },
      "performance-optimized": {
        coding: {
          simple: "anthropic/claude-haiku-4-20250514",
          medium: "anthropic/claude-sonnet-4-5-20250929",
          complex: "anthropic/claude-sonnet-4-5-20250929",
          advanced: "anthropic/claude-sonnet-4-5-20250929",
        },
        planning: {
          simple: "anthropic/claude-haiku-4-20250514",
          medium: "anthropic/claude-sonnet-4-5-20250929",
          complex: "openai/o1",
          advanced: "openai/o1",
        },
        general: {
          simple: "anthropic/claude-haiku-4-20250514",
          medium: "anthropic/claude-sonnet-4-5-20250929",
          complex: "anthropic/claude-sonnet-4-5-20250929",
          advanced: "anthropic/claude-sonnet-4-5-20250929",
        },
      },
      balanced: {
        coding: {
          simple: "zhipu/glm-4-flash",
          medium: "anthropic/claude-haiku-4-20250514",
          complex: "anthropic/claude-sonnet-4-5-20250929",
          advanced: "anthropic/claude-sonnet-4-5-20250929",
        },
        planning: {
          simple: "zhipu/glm-4-flash",
          medium: "anthropic/claude-haiku-4-20250514",
          complex: "anthropic/claude-sonnet-4-5-20250929",
          advanced: "openai/gpt-5",
        },
        general: {
          simple: "zhipu/glm-4-flash",
          medium: "anthropic/claude-haiku-4-20250514",
          complex: "anthropic/claude-sonnet-4-5-20250929",
          advanced: "anthropic/claude-sonnet-4-5-20250929",
        },
      },
    },
    taskTypeIndicators: {
      planning: {
        keywords: ["plan", "design", "architecture", "strategy"],
        patterns: ["\\bplan\\b", "\\bdesign\\b.*\\barchitecture\\b"],
      },
      coding: {
        keywords: ["implement", "create", "add", "refactor", "function", "class"],
        patterns: ["\\b(implement|create|add)\\b.*\\b(function|class|component)\\b"],
      },
      debugging: {
        keywords: ["debug", "fix", "error", "bug", "not working"],
        patterns: ["\\b(fix|debug)\\b.*\\b(bug|error)\\b"],
      },
      review: {
        keywords: ["review", "check", "analyze"],
        patterns: ["\\breview\\b.*\\bcode\\b"],
      },
      documentation: {
        keywords: ["document", "explain", "readme", "guide"],
        patterns: ["\\b(add|write)\\b.*\\bdocumentation\\b"],
      },
      general: {
        keywords: ["what", "how", "why", "show", "list"],
        patterns: ["^(what|how|why)\\b"],
      },
    },
    indicators: {
      simple: {
        keywords: ["what is", "explain", "show me"],
        patterns: ["^(what|where|when)\\s"],
        tokenRange: { min: 0, max: 250 },
      },
      medium: {
        keywords: ["implement", "create", "add"],
        patterns: ["\\b(implement|create)\\b"],
        tokenRange: { min: 250, max: 600 },
      },
      complex: {
        keywords: ["design", "architecture", "migrate"],
        patterns: ["\\b(design|architect)\\b"],
        tokenRange: { min: 600, max: 1800 },
      },
      advanced: {
        keywords: ["full system", "microservices", "from scratch"],
        patterns: ["\\b(complete|entire)\\b.*\\brewrite\\b"],
        tokenRange: { min: 1800, max: 999999 },
      },
    },
  };
}

/**
 * Simple logging helper
 */
function log(message: string, level: OrchestratorConfigV2["logLevel"], config: OrchestratorConfigV2) {
  const levels = { silent: 0, minimal: 1, normal: 2, verbose: 3 };
  if (levels[config.logLevel] >= levels[level]) {
    console.log(`[Orchestrator V2] ${message}`);
  }
}

export default OrchestratorPlugin;
