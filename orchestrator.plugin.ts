/**
 * OpenCode Intelligent Orchestrator Plugin
 *
 * Automatically selects the best model/agent based on task complexity
 * to optimize cost and performance.
 *
 * @author OpenCode Auto Model
 * @version 1.0.0
 */

import type { Plugin } from "@opencode-ai/plugin";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import yaml from "yaml";

// ============================================================================
// Types
// ============================================================================

interface OrchestratorConfig {
  enabled: boolean;
  logLevel: "silent" | "minimal" | "normal" | "verbose";
  defaultModel: string;
  detection: {
    useTokenCount: boolean;
    useCodePatterns: boolean;
    useKeywords: boolean;
    useAIEstimation: boolean;
  };
  models: {
    simple: ModelConfig;
    medium: ModelConfig;
    complex: ModelConfig;
    advanced: ModelConfig;
    planning?: {
      simple: string;
      complex: string;
    };
  };
  indicators: {
    simple: ComplexityIndicator;
    medium: ComplexityIndicator;
    complex: ComplexityIndicator;
    advanced: ComplexityIndicator;
  };
  taskTypes?: Record<string, TaskTypeConfig>;
  costOptimization?: CostOptimizationConfig;
  fallback?: string[];
  filePatternOverrides?: FilePatternOverride[];
}

interface ModelConfig {
  model: string;
  description: string;
  maxTokens: number;
  temperature: number;
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

interface TaskTypeConfig {
  keywords: string[];
  models: {
    simple?: string;
    complex?: string;
    default?: string;
  };
}

interface CostOptimizationConfig {
  enabled: boolean;
  allowDowngrade: boolean;
  maxCostPerRequest: number;
}

interface FilePatternOverride {
  pattern: string;
  model: string;
  reason: string;
}

interface AnalysisResult {
  complexity: "simple" | "medium" | "complex" | "advanced";
  taskType?: string;
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

  log("Orchestrator plugin initialized", "normal", config);
  log(`Default model: ${config.defaultModel}`, "verbose", config);

  // ============================================================================
  // Hook: Before tool execution
  // ============================================================================

  return {
    /**
     * Hook into events to detect when prompts are being sent
     */
    event: async ({ event }) => {
      // Log all events in verbose mode
      if (config.logLevel === "verbose") {
        console.log(`[Orchestrator] Event: ${event.type}`, event.properties);
      }

      // Track session starts to potentially inject model selection context
      if (event.type === "session.start" || event.type === "session.create") {
        log("New session detected, orchestrator is active", "normal", config);
      }
    },

    /**
     * Hook into tool execution to intercept prompts
     * This is where we analyze and potentially switch models
     */
    "tool.execute.before": async (input, output) => {
      // Only intercept when we're about to send a prompt/message
      // Note: The exact tool name might vary - adjust based on OpenCode's actual tool naming
      if (input.tool !== "prompt" && input.tool !== "message" && input.tool !== "session.prompt") {
        return; // Not a prompt, ignore
      }

      try {
        const promptText = extractPromptText(output.args);

        if (!promptText) {
          log("Could not extract prompt text, skipping orchestration", "verbose", config);
          return;
        }

        log(`Analyzing prompt: "${promptText.substring(0, 100)}..."`, "verbose", config);

        // Analyze complexity
        const analysis = await analyzeComplexity(promptText, config, output.args);

        log(`Complexity: ${analysis.complexity} (confidence: ${analysis.confidence})`, "normal", config);
        log(`Recommended model: ${analysis.recommendedModel}`, "normal", config);

        if (config.logLevel === "normal" || config.logLevel === "verbose") {
          console.log("\n[Orchestrator] Task Analysis:");
          console.log(`  Complexity: ${analysis.complexity}`);
          if (analysis.taskType) {
            console.log(`  Task Type: ${analysis.taskType}`);
          }
          console.log(`  Model: ${analysis.recommendedModel}`);
          console.log(`  Reasoning:`);
          analysis.reasoning.forEach(r => console.log(`    - ${r}`));
          console.log("");
        }

        // Inject model selection into the prompt
        // Method 1: Modify the args to include model preference
        if (output.args.model) {
          const [providerId, modelId] = analysis.recommendedModel.split("/");
          output.args.model = {
            providerID: providerId,
            modelID: modelId,
          };
          log(`Updated model in args to ${analysis.recommendedModel}`, "verbose", config);
        }

        // Method 2: Inject context about model preference
        // This adds a system message that suggests using a specific model
        // (OpenCode/AI might respect this depending on implementation)
        if (output.args.parts && Array.isArray(output.args.parts)) {
          const modelHint = {
            type: "text",
            text: `[Orchestrator: Using ${analysis.recommendedModel} for ${analysis.complexity} complexity task]`,
          };

          // Add as metadata or context (adjust based on actual API)
          // output.args.parts.unshift(modelHint);
        }

      } catch (error) {
        log(`Error in orchestrator: ${error}`, "minimal", config);
        console.error("[Orchestrator] Error:", error);
        // Don't block the prompt on error
      }
    },

    /**
     * Custom tool: Manual complexity check
     * Allows users to check what model would be selected for a given prompt
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
          },
          required: ["prompt"],
        },
        async execute(args: { prompt: string }) {
          const analysis = await analyzeComplexity(args.prompt, config, {});
          return {
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
 * Load orchestrator configuration from file
 */
async function loadConfig(directory: string): Promise<OrchestratorConfig> {
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

  // Return default config
  console.log("[Orchestrator] No config found, using defaults");
  return getDefaultConfig();
}

/**
 * Parse configuration from markdown or YAML
 */
function parseConfig(content: string): OrchestratorConfig {
  // Check if it's markdown with frontmatter
  if (content.startsWith("---")) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (match) {
      const yamlContent = match[1];
      return yaml.parse(yamlContent);
    }
  }

  // Otherwise parse as YAML directly
  return yaml.parse(content);
}

/**
 * Get default configuration
 */
function getDefaultConfig(): OrchestratorConfig {
  return {
    enabled: true,
    logLevel: "normal",
    defaultModel: "anthropic/claude-sonnet-4-5-20250929",
    detection: {
      useTokenCount: true,
      useCodePatterns: true,
      useKeywords: true,
      useAIEstimation: false,
    },
    models: {
      simple: {
        model: "openai/gpt-4o-mini",
        description: "Simple tasks",
        maxTokens: 4000,
        temperature: 0.3,
      },
      medium: {
        model: "anthropic/claude-haiku-4-20250514",
        description: "Medium tasks",
        maxTokens: 8000,
        temperature: 0.5,
      },
      complex: {
        model: "anthropic/claude-sonnet-4-5-20250929",
        description: "Complex tasks",
        maxTokens: 16000,
        temperature: 0.7,
      },
      advanced: {
        model: "openai/o1",
        description: "Advanced tasks",
        maxTokens: 32000,
        temperature: 0.9,
      },
    },
    indicators: {
      simple: {
        keywords: ["explain", "what is", "show me", "list", "find"],
        patterns: ["^(what|where|when|who|why|how)\\s"],
        tokenRange: { min: 0, max: 200 },
        fileCount: { max: 1 },
      },
      medium: {
        keywords: ["implement", "create", "add feature", "refactor", "fix bug"],
        patterns: ["\\b(implement|create|add|refactor)\\b"],
        tokenRange: { min: 200, max: 500 },
        fileCount: { min: 1, max: 5 },
      },
      complex: {
        keywords: ["design", "architecture", "migrate", "integrate", "system"],
        patterns: ["\\b(design|architect|migrate)\\b.*\\b(system|application)\\b"],
        tokenRange: { min: 500, max: 1500 },
        fileCount: { min: 5, max: 15 },
      },
      advanced: {
        keywords: ["full system", "complete rewrite", "microservices", "from scratch"],
        patterns: ["\\b(complete|entire|full)\\b.*\\b(rewrite|redesign)\\b"],
        tokenRange: { min: 1500, max: 999999 },
        fileCount: { min: 15, max: 999999 },
      },
    },
  };
}

/**
 * Extract prompt text from tool arguments
 */
function extractPromptText(args: any): string | null {
  // Handle different possible argument structures
  if (typeof args === "string") {
    return args;
  }

  if (args.text) {
    return args.text;
  }

  if (args.message) {
    return args.message;
  }

  if (args.prompt) {
    return args.prompt;
  }

  if (args.parts && Array.isArray(args.parts)) {
    // Extract text from parts array
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
 * Analyze prompt complexity and recommend model
 */
async function analyzeComplexity(
  promptText: string,
  config: OrchestratorConfig,
  args: any
): Promise<AnalysisResult> {
  const reasoning: string[] = [];
  let scores = {
    simple: 0,
    medium: 0,
    complex: 0,
    advanced: 0,
  };

  const promptLower = promptText.toLowerCase();
  const tokenCount = estimateTokenCount(promptText);

  // 1. Check for task type overrides
  if (config.taskTypes) {
    for (const [taskType, taskConfig] of Object.entries(config.taskTypes)) {
      const hasKeyword = taskConfig.keywords.some(kw =>
        promptLower.includes(kw.toLowerCase())
      );

      if (hasKeyword) {
        reasoning.push(`Detected task type: ${taskType}`);

        // Determine complexity within task type
        let taskModel: string;
        if (tokenCount > 500 && taskConfig.models.complex) {
          taskModel = taskConfig.models.complex;
          reasoning.push(`Using complex ${taskType} model due to length`);
        } else if (taskConfig.models.simple) {
          taskModel = taskConfig.models.simple;
          reasoning.push(`Using simple ${taskType} model`);
        } else {
          taskModel = taskConfig.models.default || config.defaultModel;
          reasoning.push(`Using default ${taskType} model`);
        }

        return {
          complexity: tokenCount > 500 ? "complex" : "simple",
          taskType,
          recommendedModel: taskModel,
          reasoning,
          confidence: 0.9,
        };
      }
    }
  }

  // 2. Keyword matching
  if (config.detection.useKeywords) {
    for (const [level, indicator] of Object.entries(config.indicators)) {
      const keywordMatches = indicator.keywords.filter(kw =>
        promptLower.includes(kw.toLowerCase())
      );

      if (keywordMatches.length > 0) {
        scores[level as keyof typeof scores] += keywordMatches.length * 10;
        reasoning.push(
          `Found ${keywordMatches.length} ${level} keywords: ${keywordMatches.slice(0, 3).join(", ")}`
        );
      }
    }
  }

  // 3. Pattern matching
  for (const [level, indicator] of Object.entries(config.indicators)) {
    const patternMatches = indicator.patterns.filter(pattern => {
      try {
        return new RegExp(pattern, "i").test(promptText);
      } catch {
        return false;
      }
    });

    if (patternMatches.length > 0) {
      scores[level as keyof typeof scores] += patternMatches.length * 15;
      reasoning.push(`Matched ${patternMatches.length} ${level} patterns`);
    }
  }

  // 4. Token count analysis
  if (config.detection.useTokenCount) {
    for (const [level, indicator] of Object.entries(config.indicators)) {
      if (
        tokenCount >= indicator.tokenRange.min &&
        tokenCount <= indicator.tokenRange.max
      ) {
        scores[level as keyof typeof scores] += 20;
        reasoning.push(
          `Token count (${tokenCount}) fits ${level} range (${indicator.tokenRange.min}-${indicator.tokenRange.max})`
        );
      }
    }
  }

  // 5. Code pattern detection
  if (config.detection.useCodePatterns) {
    const codeComplexity = analyzeCodeComplexity(promptText);
    if (codeComplexity.hasMultipleFiles) {
      scores.complex += 15;
      scores.advanced += 10;
      reasoning.push("Multiple files detected");
    }
    if (codeComplexity.hasArchitecturalKeywords) {
      scores.complex += 20;
      scores.advanced += 15;
      reasoning.push("Architectural keywords detected");
    }
    if (codeComplexity.hasCodeBlocks) {
      scores.medium += 10;
      scores.complex += 5;
      reasoning.push("Code blocks detected");
    }
  }

  // 6. File count estimation
  const fileCount = estimateFileCount(promptText);
  if (fileCount > 0) {
    for (const [level, indicator] of Object.entries(config.indicators)) {
      if (indicator.fileCount) {
        const min = indicator.fileCount.min ?? 0;
        const max = indicator.fileCount.max ?? 999999;
        if (fileCount >= min && fileCount <= max) {
          scores[level as keyof typeof scores] += 25;
          reasoning.push(`File count (${fileCount}) fits ${level} range`);
        }
      }
    }
  }

  // Determine final complexity
  const maxScore = Math.max(...Object.values(scores));
  const complexity = (Object.keys(scores) as Array<keyof typeof scores>).find(
    level => scores[level] === maxScore
  ) || "medium";

  const confidence = maxScore / 100;

  // Get recommended model
  const modelConfig = config.models[complexity];
  let recommendedModel = modelConfig.model;

  // Check file pattern overrides
  if (config.filePatternOverrides && args.files) {
    for (const override of config.filePatternOverrides) {
      // Simple pattern matching (could be enhanced with glob)
      const files = Array.isArray(args.files) ? args.files : [args.files];
      if (files.some((file: string) => file.includes(override.pattern.replace("**/*", "")))) {
        recommendedModel = override.model;
        reasoning.push(`File pattern override: ${override.reason}`);
        break;
      }
    }
  }

  reasoning.push(`Final complexity score: ${complexity} (${maxScore} points)`);

  return {
    complexity,
    recommendedModel,
    reasoning,
    confidence: Math.min(confidence, 1.0),
  };
}

/**
 * Estimate token count (rough approximation)
 */
function estimateTokenCount(text: string): number {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4);
}

/**
 * Estimate number of files mentioned in prompt
 */
function estimateFileCount(text: string): number {
  // Look for file path patterns
  const filePathPattern = /[\w-]+\.[\w]+|[\w-]+\/[\w-]+/g;
  const matches = text.match(filePathPattern) || [];

  // Look for explicit mentions of "files", "X files", etc.
  const fileCountPattern = /(\d+)\s+files?/i;
  const countMatch = text.match(fileCountPattern);

  if (countMatch) {
    return parseInt(countMatch[1], 10);
  }

  return Math.min(matches.length, 50); // Cap at 50 to avoid over-counting
}

/**
 * Analyze code-specific complexity indicators
 */
function analyzeCodeComplexity(text: string) {
  return {
    hasMultipleFiles: /\b\d+\s+files?\b/i.test(text) || text.split(".").length > 5,
    hasArchitecturalKeywords: /\b(architecture|system design|microservices|api design|database schema)\b/i.test(text),
    hasCodeBlocks: /```/.test(text) || text.includes("function ") || text.includes("class "),
  };
}

/**
 * Simple logging helper
 */
function log(message: string, level: OrchestratorConfig["logLevel"], config: OrchestratorConfig) {
  const levels = { silent: 0, minimal: 1, normal: 2, verbose: 3 };
  if (levels[config.logLevel] >= levels[level]) {
    console.log(`[Orchestrator] ${message}`);
  }
}

// Export default for CommonJS compatibility
export default OrchestratorPlugin;
