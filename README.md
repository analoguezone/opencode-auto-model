# OpenCode Intelligent Orchestrator Plugin

> Automatically select the best AI model for each task based on complexity analysis - optimize costs while maintaining quality.

## 🎯 Overview

The OpenCode Orchestrator Plugin is an intelligent model selection system that automatically chooses the most appropriate AI model for your tasks based on complexity analysis. It helps you:

- **Save costs** by using cheaper models for simple tasks (40-70% cost reduction)
- **Maintain quality** by using premium models for complex work
- **Optimize performance** by matching model capabilities to task requirements
- **Automate decisions** so you can focus on coding instead of model selection

## 🚨 Agent-Activated Design

**Important**: The orchestrator is **agent-activated**, meaning it only runs when you're using specific agents:

- **`auto-optimized`**: Cost-efficient development (minimizes API costs)
- **`auto-performance`**: Performance-optimized development (maximizes quality and speed)

This design prevents interference with other agents and plugins. When you use the standard `build` or `plan` agents, the orchestrator stays inactive.

👉 **[See Agent Setup Guide](AGENT-SETUP.md)** for detailed instructions.

## ✨ Features

- 🎯 **Agent-Activated**: Only runs with specific agents, no interference with other workflows
- 🤖 **Automatic Model Selection**: Analyzes prompts and selects optimal models
- 💰 **Cost Optimization**: Routes simple tasks to cheap/free models (auto-optimized agent)
- ⚡ **Performance Optimization**: Uses best models for quality (auto-performance agent)
- 🎯 **Complexity Detection**: Multi-factor analysis (keywords, patterns, token count, code complexity)
- 🔍 **Task Type Recognition**: Special handling for planning, debugging, code review, etc.
- 📁 **File Pattern Overrides**: Use specific models for critical files (security, migrations, etc.)
- 📊 **Transparency**: See why each model was selected with detailed reasoning
- ⚙️ **Highly Configurable**: Customize thresholds, models, and detection strategies
- 🌍 **Global or Per-Project**: Configure globally or override per project

## 📦 Installation

### 1. Install the Plugin

#### Global Installation (Recommended)
```bash
# Create plugin directory
mkdir -p ~/.config/opencode/plugin

# Copy the plugin file
cp orchestrator.plugin.ts ~/.config/opencode/plugin/
```

#### Per-Project Installation
```bash
# Create project plugin directory
mkdir -p .opencode/plugin

# Copy the plugin file
cp orchestrator.plugin.ts .opencode/plugin/
```

### 2. Install Agents

**IMPORTANT**: Install the orchestrator agents:

```bash
# Global installation (recommended)
mkdir -p ~/.config/opencode/agent
cp agents/auto-optimized.md ~/.config/opencode/agent/
cp agents/auto-performance.md ~/.config/opencode/agent/

# OR Per-project installation
mkdir -p .opencode/agent
cp agents/auto-optimized.md .opencode/agent/
cp agents/auto-performance.md .opencode/agent/
```

### 3. Install Dependencies

```bash
npm install yaml
# or
bun add yaml
```

### 4. Set Up Configuration

Choose one of the example configurations and customize it:

#### Option A: Use the Generic Example
```bash
# Global
cp orchestrator.config.example.md ~/.config/opencode/orchestrator.config.md

# Per-project
cp orchestrator.config.example.md .opencode/orchestrator.config.md
```

#### Option B: Use the User-Optimized Example
This example is optimized for users with GPT-5 Codex, Claude plans, and GLM access:

```bash
# Global
cp orchestrator.config.user-example.md ~/.config/opencode/orchestrator.config.md

# Per-project
cp orchestrator.config.user-example.md .opencode/orchestrator.config.md
```

### 4. Customize Your Configuration

Edit the config file to match your:
- Available models and API keys
- Cost preferences
- Quality requirements
- Specific workflows

## 🚀 Quick Start

### Basic Usage

Once installed, **switch to an orchestrator agent** to activate automatic model selection:

```bash
# Start OpenCode
opencode

# Press Tab to cycle through agents, or type /models
# Select either:
#   - auto-optimized (for cost savings)
#   - auto-performance (for quality)
```

The orchestrator will automatically:
1. Analyze each prompt you send
2. Determine the complexity level
3. Select the optimal model
4. Show you what it chose and why

### Switching Between Modes

- **Use `auto-optimized`** when you want to save money (exploration, prototyping, simple tasks)
- **Use `auto-performance`** when quality matters (production code, complex features)
- **Use `build`** when you want to manually select models (orchestrator stays inactive)
- **Use `plan`** for code review without changes (orchestrator stays inactive)

### Example Interactions

**Simple Question** → Uses GLM 4.6 (free/cheap)
```
You: "What does this function do?"
[Orchestrator] Complexity: simple
[Orchestrator] Model: zhipu/glm-4-flash
[Orchestrator] Reasoning:
  - Found 1 simple keywords: what does
  - Token count (15) fits simple range (0-250)
```

**Medium Implementation** → Uses Claude Haiku (budget-friendly)
```
You: "Implement a login endpoint with JWT authentication"
[Orchestrator] Complexity: medium
[Orchestrator] Model: anthropic/claude-haiku-4-20250514
[Orchestrator] Reasoning:
  - Found 2 medium keywords: implement, authentication
  - Token count (350) fits medium range (250-600)
  - Matched 1 medium patterns
```

**Complex Refactoring** → Uses Claude Sonnet (premium)
```
You: "Refactor the entire authentication system to support OAuth2"
[Orchestrator] Complexity: complex
[Orchestrator] Model: anthropic/claude-sonnet-4-5-20250929
[Orchestrator] Reasoning:
  - Found 3 complex keywords: refactor, entire, authentication
  - Token count (750) fits complex range (600-1800)
  - Architectural keywords detected
```

**Advanced Planning** → Uses GPT-5/o1 (reasoning model)
```
You: "Plan out a migration from monolith to microservices architecture"
[Orchestrator] Complexity: complex
[Orchestrator] Task Type: planning
[Orchestrator] Model: openai/o1
[Orchestrator] Reasoning:
  - Detected task type: planning
  - Found 5 complex keywords: plan, migration, microservices, architecture
  - Using complex planning model due to length
```

## ⚙️ Configuration Guide

### Model Assignment Strategy

Define your model tiers based on your available models and budget:

```yaml
models:
  # Tier 1: Simple tasks (cheap/free)
  simple:
    model: zhipu/glm-4-flash
    description: Quick tasks, simple edits, basic questions
    maxTokens: 4000
    temperature: 0.3

  # Tier 2: Medium tasks (budget)
  medium:
    model: anthropic/claude-haiku-4-20250514
    description: Standard development tasks
    maxTokens: 8000
    temperature: 0.5

  # Tier 3: Complex tasks (premium)
  complex:
    model: anthropic/claude-sonnet-4-5-20250929
    description: Advanced implementations
    maxTokens: 16000
    temperature: 0.7

  # Tier 4: Advanced tasks (ultra-premium)
  advanced:
    model: openai/o1
    description: System-level planning
    maxTokens: 32000
    temperature: 0.9
```

### Complexity Indicators

Customize how tasks are classified:

```yaml
indicators:
  simple:
    keywords:
      - "explain"
      - "what is"
      - "show me"
    patterns:
      - "^(what|where|when|who|why|how)\\s"
    tokenRange:
      min: 0
      max: 250
    fileCount:
      max: 1
```

### Task Type Overrides

Define special handling for specific task types:

```yaml
taskTypes:
  planning:
    keywords:
      - "plan out"
      - "strategy"
      - "approach for"
    models:
      simple: zhipu/glm-4-flash
      complex: openai/o1  # Use reasoning model for complex planning

  debugging:
    keywords:
      - "debug"
      - "error"
      - "not working"
    models:
      default: anthropic/claude-sonnet-4-5-20250929
```

### File Pattern Overrides

Use specific models for critical files:

```yaml
filePatternOverrides:
  - pattern: "**/*.sql"
    model: anthropic/claude-sonnet-4-5-20250929
    reason: "Database queries require careful attention"

  - pattern: "**/*.test.*"
    model: zhipu/glm-4-flash
    reason: "Tests can use faster, cheaper models"
```

## 📊 Cost Optimization

### Example Savings

With the user-optimized configuration:

| Task Type | Volume | Without Orchestrator | With Orchestrator | Savings |
|-----------|--------|---------------------|-------------------|---------|
| Simple questions | 40% | Claude Sonnet | GLM 4.6 (free) | ~100% |
| Medium tasks | 35% | Claude Sonnet | Claude Haiku | ~80% |
| Complex tasks | 20% | Claude Sonnet | Claude Sonnet | 0% |
| Planning | 5% | Claude Sonnet | GPT-5/o1* | Variable |

**Overall estimated savings: 60-70% on API costs**

*Planning uses a specialized reasoning model which may cost more per request but provides better quality for strategic decisions.

### Cost Settings

Enable cost optimization features:

```yaml
costOptimization:
  enabled: true
  allowDowngrade: true  # Use cheaper models when quality difference is minimal
  maxCostPerRequest: 0.50  # Maximum $0.50 per request
```

## 🔧 Advanced Features

### Manual Complexity Check

Use the custom tool to check what model would be selected:

```typescript
// In OpenCode, invoke the custom tool
{
  "tool": "checkComplexity",
  "args": {
    "prompt": "Refactor the authentication system"
  }
}

// Returns:
{
  "complexity": "complex",
  "model": "anthropic/claude-sonnet-4-5-20250929",
  "reasoning": [
    "Found 2 complex keywords: refactor, authentication",
    "Token count (450) fits complex range (600-1800)",
    "Final complexity score: complex (45 points)"
  ],
  "confidence": 0.45
}
```

### Logging Levels

Control verbosity:

```yaml
logLevel: "silent"   # No output
logLevel: "minimal"  # Errors only
logLevel: "normal"   # Model selection + reasoning
logLevel: "verbose"  # All events and decisions
```

### Detection Settings

Fine-tune the detection algorithm:

```yaml
detection:
  useTokenCount: true       # Consider prompt length
  useCodePatterns: true     # Analyze code complexity
  useKeywords: true         # Match keywords
  useAIEstimation: false    # Use AI for estimation (costs extra)
```

## 🎨 Customization Examples

### Example 1: Enterprise Setup (Security-First)

```yaml
models:
  simple:
    model: openai/gpt-4o-mini
  medium:
    model: anthropic/claude-sonnet-4-5-20250929
  complex:
    model: anthropic/claude-opus-4-20250514
  advanced:
    model: anthropic/claude-opus-4-20250514

# Always use premium models for security files
filePatternOverrides:
  - pattern: "**/security/**"
    model: anthropic/claude-opus-4-20250514
    reason: "Security code requires maximum scrutiny"
  - pattern: "**/auth/**"
    model: anthropic/claude-opus-4-20250514
    reason: "Authentication is critical"
```

### Example 2: Budget-Conscious Setup

```yaml
models:
  simple:
    model: zhipu/glm-4-flash
  medium:
    model: zhipu/glm-4-flash
  complex:
    model: anthropic/claude-haiku-4-20250514
  advanced:
    model: anthropic/claude-sonnet-4-5-20250929

costOptimization:
  enabled: true
  allowDowngrade: true
  maxCostPerRequest: 0.10  # Very strict budget
```

### Example 3: Speed-Optimized Setup

```yaml
models:
  simple:
    model: zhipu/glm-4-flash
  medium:
    model: openai/gpt-4o-mini
  complex:
    model: openai/gpt-4-turbo
  advanced:
    model: openai/gpt-4-turbo

# Prefer fast models everywhere
detection:
  useAIEstimation: false  # Skip extra API calls
```

## 🐛 Troubleshooting

### Plugin Not Loading

1. Check plugin file location:
```bash
# Global
ls ~/.config/opencode/plugin/orchestrator.plugin.ts

# Per-project
ls .opencode/plugin/orchestrator.plugin.ts
```

2. Check OpenCode plugin logs:
```bash
opencode --verbose
```

### Models Not Switching

1. Verify configuration is loaded:
```bash
# Check for config file
ls ~/.config/opencode/orchestrator.config.md
# or
ls .opencode/orchestrator.config.md
```

2. Enable verbose logging:
```yaml
logLevel: "verbose"
```

3. Check for YAML syntax errors in config

### Wrong Model Selected

1. Review the reasoning output
2. Adjust complexity thresholds:
```yaml
indicators:
  medium:
    tokenRange:
      min: 200
      max: 600  # Increase/decrease as needed
```

3. Add more specific keywords for your use case

### API Errors

Check fallback chain:
```yaml
fallback:
  - anthropic/claude-sonnet-4-5-20250929
  - openai/gpt-4-turbo
  - zhipu/glm-4-flash
```

## 📚 How It Works

### Detection Algorithm

1. **Keyword Matching**: Scans prompt for complexity keywords
   - Simple: "explain", "what is", "show me"
   - Medium: "implement", "refactor", "fix bug"
   - Complex: "design", "architecture", "migrate"
   - Advanced: "full system", "microservices", "from scratch"

2. **Pattern Recognition**: Uses regex to detect complexity patterns
   - Example: `\b(design|architect)\b.*\b(system|application)\b`

3. **Token Count Analysis**: Estimates prompt length
   - Simple: 0-250 tokens
   - Medium: 250-600 tokens
   - Complex: 600-1800 tokens
   - Advanced: 1800+ tokens

4. **Code Complexity**: Analyzes code-specific indicators
   - Multiple files mentioned
   - Architectural keywords
   - Code blocks present

5. **File Count**: Estimates number of files affected
   - Simple: 0-1 files
   - Medium: 1-5 files
   - Complex: 5-15 files
   - Advanced: 15+ files

6. **Scoring**: Combines all factors with weights
   - Keywords: 10 points each
   - Patterns: 15 points each
   - Token range match: 20 points
   - File count match: 25 points

7. **Task Type Override**: Checks for special task types first
   - Planning, debugging, code review, etc.
   - Overrides complexity-based selection

8. **File Pattern Override**: Checks if files match critical patterns
   - Security files, migrations, etc.
   - Always use premium models for critical code

### Hook Integration

The plugin hooks into OpenCode at the following points:

1. **`event`**: Listens to session events
   - Tracks session starts
   - Logs in verbose mode

2. **`tool.execute.before`**: Intercepts prompts before sending
   - Analyzes prompt complexity
   - Modifies model selection
   - Injects reasoning context

3. **Custom tools**: Provides `checkComplexity` tool
   - Allows manual complexity checking
   - Returns detailed analysis

## 🤝 Contributing

Contributions are welcome! Areas for improvement:

- [ ] Add more sophisticated ML-based complexity detection
- [ ] Support for A/B testing different models
- [ ] Integration with cost tracking APIs
- [ ] Model performance benchmarking
- [ ] UI for configuration management
- [ ] Support for model ensembles

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

Built for the OpenCode community to optimize AI model usage and reduce costs while maintaining high code quality.

---

**Questions or issues?** Open an issue on GitHub or join the OpenCode Discord community.
