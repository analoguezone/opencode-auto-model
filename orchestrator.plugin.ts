/**
 * OpenCode Intelligent Orchestrator Plugin V2.1
 *
 * Context-Aware Multi-Dimensional Selection:
 * - Strategy × Task Type × Complexity
 * - Per-level fallback arrays
 * - Context-aware complexity adjustment
 * - Plan detection and reduction
 * - Subtask detection
 *
 * @author OpenCode Auto Model
 * @version 2.1.0
 */

import type { Plugin } from "@opencode-ai/plugin";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import yaml from "yaml";

// ============================================================================
// Types - V2.1 Configuration
// ============================================================================

type TaskType = "coding-simple" | "coding-complex" | "planning" | "debugging" | "review" | "documentation" | "general";
type Complexity = "simple" | "medium" | "complex" | "advanced";
type Strategy = "cost-optimized" | "performance-optimized" | "balanced";

interface OrchestratorConfigV21 {
  enabled: boolean;
  logLevel: "silent" | "minimal" | "normal" | "verbose";
  defaultModel: string;

  // Agent activation
  activeAgents: string[];

  // Agent-to-strategy mapping
  agentStrategies: Record<string, Strategy>;

  // Detection settings
  detection: {
    useTokenCount: boolean;
    useCodePatterns: boolean;
    useKeywords: boolean;
    useAIEstimation: boolean;

    // Context-aware adjustments
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
      contextSize?: {
        enabled: boolean;
        smallContextThreshold: number;  // <50K: reduce complexity
        largeContextThreshold: number;  // >100K: raise complexity
      };
    };
  };

  // Multi-dimensional model selection with fallback arrays
  strategies: Record<Strategy, StrategyConfig>;

  // Task type detection
  taskTypeIndicators: Record<TaskType, TaskTypeIndicator>;

  // Complexity indicators
  indicators: Record<Complexity, ComplexityIndicator>;

  // File pattern overrides
  filePatternOverrides?: FilePatternOverride[];
}

interface StrategyConfig {
  [taskType: string]: {
    [complexity: string]: string | string[]; // Single model or fallback array
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

interface AnalysisResult {
  complexity: Complexity;
  baseComplexity: Complexity;
  taskType: TaskType;
  strategy: Strategy;
  recommendedModels: string[];  // Array for fallback support
  reasoning: string[];
  confidence: number;
  contextAdjustments?: string[];
}

// ============================================================================
// Main Plugin
// ============================================================================

// Global initialization flag to prevent duplicate logs
let _isInitialized = false;

export const OrchestratorPlugin: Plugin = async ({ project, client, $, directory, worktree }) => {
  // Load configuration
  const config = await loadConfig(directory);

  if (!config.enabled) {
    log("Orchestrator plugin is disabled", "minimal", config);
    return {};
  }

  // Only log initialization once to avoid clutter
  if (!_isInitialized) {
    log("Orchestrator V2.1 plugin initialized", "normal", config);
    log(`Active agents: ${config.activeAgents.join(", ")}`, "verbose", config);
    _isInitialized = true;
  }

  // Track current session/agent info
  let currentSessionId: string | null = null;
  let currentAgent: string | null = null;
  let currentStrategy: Strategy | null = null;
  let contextTokens: number = 0;

  // ============================================================================
  // Hooks
  // ============================================================================

  return {
    /**
     * Hook into events to detect agent changes and track context
     */
    event: async ({ event }) => {
      if (config.logLevel === "verbose") {
        console.log(`[Orchestrator V2.1] Event: ${event.type}`, event.properties);
      }

      if (event.type === "session.start" || event.type === "session.create") {
        currentSessionId = event.properties?.id || null;
        contextTokens = 0; // Reset context on new session

        // Try to get session info to check agent
        if (currentSessionId && client) {
          try {
            const session = await client.session.get({ path: { id: currentSessionId } });
            currentAgent = session.agent || session.agentName || null;

            // Map agent to strategy
            if (currentAgent && config.agentStrategies[currentAgent]) {
              currentStrategy = config.agentStrategies[currentAgent];
              log(`Session started: agent=${currentAgent}, strategy=${currentStrategy}`, "normal", config);
            }
          } catch (error) {
            log(`Could not get session info: ${error}`, "verbose", config);
          }
        }
      }

      // Track message events to estimate context size
      if (event.type === "message.create" || event.type === "message.complete") {
        if (event.properties?.content) {
          contextTokens += estimateTokenCount(event.properties.content);
        }
      }
    },

    /**
     * Hook into tool execution to intercept prompts
     */
    "tool.execute.before": async (input, output) => {
      // Log all intercepted calls for debugging
      log(`Tool intercepted: ${input.tool}`, "verbose", config);

      // Try to extract prompt text - if we can't, this isn't an LLM call
      const promptText = extractPromptText(output.args);

      if (!promptText) {
        // Not an LLM call (might be file read, write, etc)
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

      log(`Orchestrator active: agent=${shouldActivate.agent}, strategy=${strategy}, tool=${input.tool}`, "verbose", config);

      try {

        log(`Analyzing prompt: "${promptText.substring(0, 100)}..."`, "verbose", config);

        // Get context from session if available
        let sessionContext = "";
        if (currentSessionId && client) {
          try {
            const messages = await client.session.messages({ path: { id: currentSessionId } });
            // Concatenate recent messages for context
            sessionContext = messages.slice(-5).map((msg: any) =>
              msg.parts?.map((p: any) => p.text).join("\n") || ""
            ).join("\n");
          } catch (error) {
            log(`Could not fetch session context: ${error}`, "verbose", config);
          }
        }

        // Perform multi-dimensional analysis with context awareness
        const analysis = await analyzePromptV21(
          promptText,
          sessionContext,
          contextTokens,
          config,
          output.args,
          strategy
        );

        log(`Analysis: ${analysis.taskType}/${analysis.complexity} → ${analysis.recommendedModels[0]}`, "normal", config);

        if (config.logLevel === "normal" || config.logLevel === "verbose") {
          console.log("\n[Orchestrator V2.1] Task Analysis:");
          console.log(`  Strategy: ${analysis.strategy}`);
          console.log(`  Task Type: ${analysis.taskType}`);
          console.log(`  Base Complexity: ${analysis.baseComplexity}`);
          if (analysis.contextAdjustments && analysis.contextAdjustments.length > 0) {
            console.log(`  Context Adjustments:`);
            analysis.contextAdjustments.forEach(adj => console.log(`    - ${adj}`));
          }
          console.log(`  Final Complexity: ${analysis.complexity}`);
          console.log(`  Model: ${analysis.recommendedModels[0]}`);
          if (analysis.recommendedModels.length > 1) {
            console.log(`  Fallbacks: ${analysis.recommendedModels.slice(1).join(", ")}`);
          }
          console.log(`  Reasoning:`);
          analysis.reasoning.forEach(r => console.log(`    - ${r}`));
          console.log("");
        }

        // Update model in args (use first model in fallback array)
        if (output.args.model && analysis.recommendedModels.length > 0) {
          const [providerId, modelId] = analysis.recommendedModels[0].split("/");
          output.args.model = {
            providerID: providerId,
            modelID: modelId,
          };
          log(`Updated model to ${analysis.recommendedModels[0]}`, "verbose", config);
        }

      } catch (error) {
        log(`Error in orchestrator: ${error}`, "minimal", config);
        console.error("[Orchestrator V2.1] Error:", error);
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
            context: {
              type: "string",
              description: "Context/background (optional)",
            },
          },
          required: ["prompt"],
        },
        async execute(args: { prompt: string; strategy?: Strategy; context?: string }) {
          // Validate prompt parameter
          if (!args.prompt || typeof args.prompt !== "string") {
            return {
              error: "Invalid or missing prompt parameter",
              usage: "Please provide a prompt to analyze, e.g., checkComplexity({ prompt: 'your task here' })"
            };
          }

          const strategy = args.strategy || currentStrategy || "balanced";
          const context = args.context || "";
          const tokens = estimateTokenCount(context);

          const analysis = await analyzePromptV21(
            args.prompt,
            context,
            tokens,
            config,
            {},
            strategy
          );

          // Return formatted string output for OpenCode compatibility
          const result = {
            strategy: analysis.strategy,
            taskType: analysis.taskType,
            baseComplexity: analysis.baseComplexity,
            finalComplexity: analysis.complexity,
            models: analysis.recommendedModels,
            primaryModel: analysis.recommendedModels[0],
            fallbackModels: analysis.recommendedModels.slice(1),
            reasoning: analysis.reasoning,
            contextAdjustments: analysis.contextAdjustments || [],
            confidence: analysis.confidence,
          };

          // Format as readable string
          let output = `## Complexity Analysis\n\n`;
          output += `**Strategy:** ${result.strategy}\n`;
          output += `**Task Type:** ${result.taskType}\n`;
          output += `**Base Complexity:** ${result.baseComplexity}\n`;
          output += `**Final Complexity:** ${result.finalComplexity}\n\n`;
          output += `**Selected Model:** ${result.primaryModel}\n`;
          if (result.fallbackModels.length > 0) {
            output += `**Fallback Models:** ${result.fallbackModels.join(", ")}\n`;
          }
          if (result.contextAdjustments.length > 0) {
            output += `\n**Context Adjustments:**\n`;
            result.contextAdjustments.forEach(adj => {
              output += `- ${adj}\n`;
            });
          }
          output += `\n**Reasoning:**\n`;
          result.reasoning.forEach(r => {
            output += `- ${r}\n`;
          });
          output += `\n**Confidence:** ${result.confidence}%\n`;

          return output;
        },
      },
    },
  };
};

// ============================================================================
// Helper Functions
// ============================================================================

// Config cache to prevent duplicate loads and logs
let _configCache: OrchestratorConfigV21 | null = null;
let _configLoaded = false;

/**
 * Load orchestrator configuration
 */
async function loadConfig(directory: string): Promise<OrchestratorConfigV21> {
  // Return cached config if already loaded
  if (_configCache) {
    return _configCache;
  }

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
        if (!_configLoaded) {
          console.log(`[Orchestrator V2.1] Loaded config from ${path}`);
          _configLoaded = true;
        }
        _configCache = config;
        return config;
      } catch (error) {
        console.error(`[Orchestrator V2.1] Error loading config from ${path}:`, error);
      }
    }
  }

  if (!_configLoaded) {
    console.log("[Orchestrator V2.1] No config found, using defaults");
    _configLoaded = true;
  }
  return getDefaultConfig();
}

/**
 * Parse configuration from markdown or YAML
 */
function parseConfig(content: string): OrchestratorConfigV21 {
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
  config: OrchestratorConfigV21,
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
 * Analyze prompt with context-aware complexity adjustment (V2.1)
 */
async function analyzePromptV21(
  promptText: string,
  sessionContext: string,
  contextTokens: number,
  config: OrchestratorConfigV21,
  args: any,
  strategy: Strategy
): Promise<AnalysisResult> {
  const reasoning: string[] = [];
  const contextAdjustments: string[] = [];

  // Step 1: Detect task type
  const taskType = detectTaskType(promptText, config);
  reasoning.push(`Task type: ${taskType}`);

  // Step 2: Determine base complexity
  const baseComplexity = detectComplexity(promptText, config);
  reasoning.push(`Base complexity: ${baseComplexity}`);

  // Step 3: Context-aware adjustments
  let finalComplexity = baseComplexity;

  if (config.detection.contextAware?.enabled) {
    // Plan awareness
    if (config.detection.contextAware.planAwareness?.enabled) {
      const hasPlan = detectPlan(sessionContext, config.detection.contextAware.planAwareness);
      if (hasPlan) {
        finalComplexity = reduceComplexity(finalComplexity);
        contextAdjustments.push(`Plan detected: ${baseComplexity} → ${finalComplexity}`);
        reasoning.push(`Detailed plan exists in context, reduced complexity`);
      }
    }

    // Subtask detection
    if (config.detection.contextAware.subtaskDetection?.enabled) {
      const isSubtask = detectSubtask(promptText, config.detection.contextAware.subtaskDetection);
      if (isSubtask && finalComplexity !== "simple") {
        finalComplexity = reduceComplexity(finalComplexity);
        contextAdjustments.push(`Subtask detected: reduced to ${finalComplexity}`);
        reasoning.push(`Implementing subtask from plan, reduced complexity`);
      }
    }

    // Context size adjustment
    if (config.detection.contextAware.contextSize?.enabled) {
      const { smallContextThreshold, largeContextThreshold } = config.detection.contextAware.contextSize;

      if (contextTokens < smallContextThreshold) {
        // Small context: reduce complexity (focused task)
        const oldComplexity = finalComplexity;
        finalComplexity = reduceComplexity(finalComplexity);
        if (oldComplexity !== finalComplexity) {
          contextAdjustments.push(`Small context (${contextTokens}K < ${smallContextThreshold/1000}K): ${oldComplexity} → ${finalComplexity}`);
          reasoning.push(`Small context indicates focused task, reduced complexity`);
        }
      } else if (contextTokens > largeContextThreshold) {
        // Large context: raise complexity (multi-faceted task)
        const oldComplexity = finalComplexity;
        finalComplexity = raiseComplexity(finalComplexity);
        if (oldComplexity !== finalComplexity) {
          contextAdjustments.push(`Large context (${contextTokens}K > ${largeContextThreshold/1000}K): ${oldComplexity} → ${finalComplexity}`);
          reasoning.push(`Large context indicates multi-faceted task, raised complexity`);
        }
      } else {
        reasoning.push(`Normal context (${Math.round(contextTokens/1000)}K tokens), no adjustment`);
      }
    }
  }

  // Step 4: Select models from strategy matrix (with fallback support)
  let recommendedModels: string[] = [];
  const strategyModels = config.strategies[strategy]?.[taskType]?.[finalComplexity];

  if (Array.isArray(strategyModels)) {
    // Fallback array configured
    recommendedModels = strategyModels;
    reasoning.push(`Fallback chain from ${strategy}.${taskType}.${finalComplexity}: ${strategyModels.join(" → ")}`);
  } else if (typeof strategyModels === "string") {
    // Single model
    recommendedModels = [strategyModels];
    reasoning.push(`Selected from ${strategy}.${taskType}.${finalComplexity}`);
  }

  // Fallback to general if task type not found
  if (recommendedModels.length === 0 && taskType !== "general") {
    const generalModels = config.strategies[strategy]?.general?.[finalComplexity];
    if (Array.isArray(generalModels)) {
      recommendedModels = generalModels;
    } else if (typeof generalModels === "string") {
      recommendedModels = [generalModels];
    }
    reasoning.push(`Task type ${taskType} not in strategy, using general fallback`);
  }

  // Ultimate fallback to default
  if (recommendedModels.length === 0) {
    recommendedModels = [config.defaultModel];
    reasoning.push(`No match in strategy matrix, using default model`);
  }

  // Step 5: Check file pattern overrides
  if (config.filePatternOverrides && args.files) {
    for (const override of config.filePatternOverrides) {
      const files = Array.isArray(args.files) ? args.files : [args.files];
      const matchingFile = files.find((file: string) =>
        file.includes(override.pattern.replace("**/*", ""))
      );

      if (matchingFile) {
        if (override.model) {
          recommendedModels = [override.model];
          reasoning.push(`File pattern override: ${override.reason}`);
        } else if (override.taskTypeOverride) {
          // Re-select with overridden task type
          const newTaskType = override.taskTypeOverride;
          const newModels = config.strategies[strategy]?.[newTaskType]?.[finalComplexity];
          if (newModels) {
            recommendedModels = Array.isArray(newModels) ? newModels : [newModels];
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
    baseComplexity,
    complexity: finalComplexity,
    recommendedModels,
    reasoning,
    contextAdjustments: contextAdjustments.length > 0 ? contextAdjustments : undefined,
    confidence: 0.8,
  };
}

/**
 * Detect if context contains a detailed plan
 */
function detectPlan(context: string, planConfig: { planIndicators: string[]; minStepsForReduction: number }): boolean {
  const contextLower = context.toLowerCase();
  let stepCount = 0;

  for (const indicator of planConfig.planIndicators) {
    const regex = new RegExp(indicator.replace(/\./g, "\\."), "gi");
    const matches = context.match(regex);
    if (matches) {
      stepCount += matches.length;
    }
  }

  return stepCount >= planConfig.minStepsForReduction;
}

/**
 * Detect if prompt is about implementing a subtask
 */
function detectSubtask(promptText: string, subtaskConfig: { subtaskIndicators: string[] }): boolean {
  if (!promptText || typeof promptText !== "string") {
    return false; // No subtask if invalid input
  }
  const promptLower = promptText.toLowerCase();
  return subtaskConfig.subtaskIndicators.some(indicator =>
    promptLower.includes(indicator.toLowerCase())
  );
}

/**
 * Reduce complexity by one level
 */
function reduceComplexity(complexity: Complexity): Complexity {
  const levels: Complexity[] = ["simple", "medium", "complex", "advanced"];
  const index = levels.indexOf(complexity);
  return index > 0 ? levels[index - 1] : complexity;
}

/**
 * Raise complexity by one level
 */
function raiseComplexity(complexity: Complexity): Complexity {
  const levels: Complexity[] = ["simple", "medium", "complex", "advanced"];
  const index = levels.indexOf(complexity);
  return index < levels.length - 1 ? levels[index + 1] : complexity;
}

/**
 * Detect task type from prompt
 */
function detectTaskType(promptText: string, config: OrchestratorConfigV21): TaskType {
  if (!promptText || typeof promptText !== "string") {
    return "general"; // Fallback to general if invalid input
  }
  const promptLower = promptText.toLowerCase();

  // Score each task type
  const scores: Partial<Record<TaskType, number>> = {};

  for (const [taskType, indicator] of Object.entries(config.taskTypeIndicators)) {
    scores[taskType as TaskType] = 0;

    // Keyword matching
    const keywordMatches = indicator.keywords.filter(kw =>
      promptLower.includes(kw.toLowerCase())
    );
    scores[taskType as TaskType]! += keywordMatches.length * 10;

    // Pattern matching
    const patternMatches = indicator.patterns.filter(pattern => {
      try {
        return new RegExp(pattern, "i").test(promptText);
      } catch {
        return false;
      }
    });
    scores[taskType as TaskType]! += patternMatches.length * 15;
  }

  // Find highest scoring task type
  let maxScore = 0;
  let detectedType: TaskType = "general";

  for (const [taskType, score] of Object.entries(scores)) {
    if (score! > maxScore) {
      maxScore = score!;
      detectedType = taskType as TaskType;
    }
  }

  return detectedType;
}

/**
 * Detect complexity from prompt
 */
function detectComplexity(promptText: string, config: OrchestratorConfigV21): Complexity {
  if (!promptText || typeof promptText !== "string") {
    return "simple"; // Fallback to simple if invalid input
  }
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
function getDefaultConfig(): OrchestratorConfigV21 {
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
      contextAware: {
        enabled: true,
        planAwareness: {
          enabled: true,
          planIndicators: ["step 1", "step 2", "- [ ]", "1."],
          minStepsForReduction: 3,
        },
        subtaskDetection: {
          enabled: true,
          subtaskIndicators: ["implement step", "from the plan", "next todo"],
        },
        contextSize: {
          enabled: true,
          smallContextThreshold: 50000,
          largeContextThreshold: 100000,
        },
      },
    },
    strategies: {
      "cost-optimized": {
        "coding-simple": {
          simple: "zai-coding-plan/glm-4.6",
          medium: "zai-coding-plan/glm-4.6",
          complex: ["anthropic/claude-sonnet-4-5-20250929", "zai-coding-plan/glm-4.6"],
          advanced: ["openai/gpt-5-codex-high", "anthropic/claude-sonnet-4-5-20250929"],
        },
        general: {
          simple: "zai-coding-plan/glm-4.6",
          medium: "zai-coding-plan/glm-4.6",
          complex: ["anthropic/claude-haiku-4-20250514", "zai-coding-plan/glm-4.6"],
          advanced: ["anthropic/claude-sonnet-4-5-20250929"],
        },
      },
      "performance-optimized": {
        "coding-simple": {
          simple: "anthropic/claude-haiku-4-20250514",
          medium: "anthropic/claude-haiku-4-20250514",
          complex: ["anthropic/claude-sonnet-4-5-20250929", "anthropic/claude-haiku-4-20250514"],
          advanced: ["anthropic/claude-sonnet-4-5-20250929"],
        },
        general: {
          simple: "anthropic/claude-haiku-4-20250514",
          medium: ["anthropic/claude-sonnet-4-5-20250929", "anthropic/claude-haiku-4-20250514"],
          complex: ["anthropic/claude-sonnet-4-5-20250929"],
          advanced: ["anthropic/claude-sonnet-4-5-20250929"],
        },
      },
      balanced: {
        "coding-simple": {
          simple: "zai-coding-plan/glm-4.6",
          medium: "anthropic/claude-haiku-4-20250514",
          complex: ["anthropic/claude-sonnet-4-5-20250929", "anthropic/claude-haiku-4-20250514"],
          advanced: ["anthropic/claude-sonnet-4-5-20250929"],
        },
        general: {
          simple: "zai-coding-plan/glm-4.6",
          medium: "anthropic/claude-haiku-4-20250514",
          complex: ["anthropic/claude-sonnet-4-5-20250929"],
          advanced: ["anthropic/claude-sonnet-4-5-20250929"],
        },
      },
    },
    taskTypeIndicators: {
      "coding-simple": {
        keywords: ["implement from plan", "from the task list", "next step"],
        patterns: ["\\bimplement\\b.*\\b(step|task|from plan)\\b"],
      },
      "coding-complex": {
        keywords: ["architecture", "design and implement", "critical"],
        patterns: ["\\b(architect|design)\\b.*\\b(system|solution)\\b"],
      },
      planning: {
        keywords: ["plan", "design", "architecture", "strategy"],
        patterns: ["\\bplan\\b.*\\b(out|for|how)\\b"],
      },
      debugging: {
        keywords: ["debug", "fix bug", "error"],
        patterns: ["\\b(fix|debug)\\b.*\\b(bug|error)\\b"],
      },
      review: {
        keywords: ["review", "check code"],
        patterns: ["\\breview\\b.*\\bcode\\b"],
      },
      documentation: {
        keywords: ["document", "explain", "readme"],
        patterns: ["\\b(add|write)\\b.*\\bdocumentation\\b"],
      },
      general: {
        keywords: ["what", "how", "why"],
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
        keywords: ["refactor", "migrate"],
        patterns: ["\\b(refactor|migrate)\\b"],
        tokenRange: { min: 600, max: 1800 },
      },
      advanced: {
        keywords: ["complete rewrite", "from scratch"],
        patterns: ["\\b(complete|entire)\\b.*\\brewrite\\b"],
        tokenRange: { min: 1800, max: 999999 },
      },
    },
  };
}

/**
 * Simple logging helper
 */
function log(message: string, level: OrchestratorConfigV21["logLevel"], config: OrchestratorConfigV21) {
  const levels = { silent: 0, minimal: 1, normal: 2, verbose: 3 };
  if (levels[config.logLevel] >= levels[level]) {
    console.log(`[Orchestrator V2.1] ${message}`);
  }
}

export default OrchestratorPlugin;
