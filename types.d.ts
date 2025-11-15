/**
 * Type definitions for OpenCode Orchestrator Plugin
 */

declare module "@opencode-ai/orchestrator" {
  /**
   * Orchestrator configuration schema
   */
  export interface OrchestratorConfig {
    /** Enable or disable the orchestrator */
    enabled: boolean;

    /** Logging verbosity level */
    logLevel: "silent" | "minimal" | "normal" | "verbose";

    /** Default model to use if no match is found */
    defaultModel: string;

    /** Complexity detection settings */
    detection: {
      /** Use token count in complexity analysis */
      useTokenCount: boolean;
      /** Analyze code patterns (imports, classes, functions) */
      useCodePatterns: boolean;
      /** Use keyword matching */
      useKeywords: boolean;
      /** Use AI-based complexity estimation (requires extra API call) */
      useAIEstimation: boolean;
    };

    /** Model assignments for each complexity level */
    models: {
      simple: ModelConfig;
      medium: ModelConfig;
      complex: ModelConfig;
      advanced: ModelConfig;
      /** Optional planning-specific models */
      planning?: {
        simple: string;
        complex: string;
      };
    };

    /** Complexity indicators for detection */
    indicators: {
      simple: ComplexityIndicator;
      medium: ComplexityIndicator;
      complex: ComplexityIndicator;
      advanced: ComplexityIndicator;
    };

    /** Task type overrides */
    taskTypes?: Record<string, TaskTypeConfig>;

    /** Cost optimization settings */
    costOptimization?: CostOptimizationConfig;

    /** Fallback model chain */
    fallback?: string[];

    /** File pattern overrides */
    filePatternOverrides?: FilePatternOverride[];
  }

  /**
   * Model configuration
   */
  export interface ModelConfig {
    /** Model ID in format: provider/model-name */
    model: string;
    /** Human-readable description */
    description: string;
    /** Maximum tokens for this model */
    maxTokens: number;
    /** Temperature setting */
    temperature: number;
  }

  /**
   * Complexity detection indicators
   */
  export interface ComplexityIndicator {
    /** Keywords that indicate this complexity level */
    keywords: string[];
    /** Regex patterns that indicate this complexity level */
    patterns: string[];
    /** Token count range for this complexity */
    tokenRange: {
      min: number;
      max: number;
    };
    /** File count range (optional) */
    fileCount?: {
      min?: number;
      max?: number;
    };
  }

  /**
   * Task type configuration
   */
  export interface TaskTypeConfig {
    /** Keywords that identify this task type */
    keywords: string[];
    /** Model assignments for this task type */
    models: {
      simple?: string;
      complex?: string;
      default?: string;
    };
  }

  /**
   * Cost optimization configuration
   */
  export interface CostOptimizationConfig {
    /** Enable cost optimization */
    enabled: boolean;
    /** Allow using cheaper models when quality difference is minimal */
    allowDowngrade: boolean;
    /** Maximum cost per request in USD */
    maxCostPerRequest: number;
  }

  /**
   * File pattern override
   */
  export interface FilePatternOverride {
    /** Glob pattern to match files */
    pattern: string;
    /** Model to use for matching files */
    model: string;
    /** Reason for the override */
    reason: string;
  }

  /**
   * Analysis result
   */
  export interface AnalysisResult {
    /** Detected complexity level */
    complexity: "simple" | "medium" | "complex" | "advanced";
    /** Detected task type (optional) */
    taskType?: string;
    /** Recommended model ID */
    recommendedModel: string;
    /** Reasoning steps for the decision */
    reasoning: string[];
    /** Confidence score (0-1) */
    confidence: number;
  }

  /**
   * Complexity analysis function
   */
  export function analyzeComplexity(
    promptText: string,
    config: OrchestratorConfig,
    args?: any
  ): Promise<AnalysisResult>;

  /**
   * Load configuration from file
   */
  export function loadConfig(directory: string): Promise<OrchestratorConfig>;
}

/**
 * Augment the OpenCode plugin types
 */
declare module "@opencode-ai/plugin" {
  export interface PluginContext {
    /** Current project information */
    project: any;
    /** Current working directory */
    directory: string;
    /** Git worktree path */
    worktree: string;
    /** OpenCode SDK client */
    client: any;
    /** Bun shell API */
    $: any;
  }

  export interface Plugin {
    (context: PluginContext): Promise<PluginHooks>;
  }

  export interface PluginHooks {
    /** Hook into events */
    event?: (context: { event: any }) => Promise<void>;
    /** Hook before tool execution */
    "tool.execute.before"?: (input: any, output: any) => Promise<void>;
    /** Hook after tool execution */
    "tool.execute.after"?: (input: any, output: any, result: any) => Promise<void>;
    /** Custom tools */
    tool?: Record<string, CustomTool>;
  }

  export interface CustomTool {
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, any>;
      required?: string[];
    };
    execute(args: any): Promise<any>;
  }
}

export {};
