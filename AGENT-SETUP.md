# Agent Setup Guide

The orchestrator plugin is **agent-activated**, meaning it only runs when you're using specific agents. This prevents interference with other plugins and gives you full control.

## 🎯 Quick Start

### 1. Install Agent Configurations

Copy the agent configuration files to your OpenCode agent directory:

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

### 2. Verify Agent Configuration

The orchestrator config must include these agents in the `activeAgents` list:

```yaml
# In orchestrator.config.md
activeAgents:
  - auto-optimized    # Cost-efficient agent
  - auto-performance  # Performance-optimized agent
```

### 3. Use the Agents

Start OpenCode and switch to one of the orchestrator agents:

```bash
opencode

# In OpenCode, press Tab to switch agents or type:
# /models
# Then select "auto-optimized" or "auto-performance"
```

## 🤖 Available Agents

### `auto-optimized` - Cost-Efficient Development

**Use when**: You want to minimize API costs while maintaining quality

**Strategy**:
- Uses free/cheap models (GLM 4.6, GPT-4o-mini) for simple tasks
- Budget models (Claude Haiku) for medium tasks
- Premium models (Claude Sonnet) only for complex work
- Estimated 60-70% cost savings

**Example**:
```
You: "Explain this function"
→ GLM 4.6 Flash (FREE)

You: "Implement login endpoint"
→ Claude Haiku 4 ($)

You: "Refactor auth system for security"
→ Claude Sonnet 4.5 ($$$)
```

### `auto-performance` - Quality-Focused Development

**Use when**: You prioritize quality and speed over cost

**Strategy**:
- Fast models (GPT-4o-mini) for simple tasks
- High-quality models (Claude Haiku, GPT-4-Turbo) for medium tasks
- Premium models (Claude Sonnet, GPT-4) for complex tasks
- Reasoning models (GPT-5, o1) for advanced planning

**Example**:
```
You: "Explain this function"
→ GPT-4o-mini (FAST)

You: "Implement login endpoint"
→ Claude Haiku 4 (FAST + QUALITY)

You: "Design microservices architecture"
→ GPT-5/o1 (BEST REASONING)
```

## 🔄 Switching Agents

### Method 1: Tab Key (Recommended)

Press `Tab` to cycle through available agents:
- `build` (default OpenCode agent)
- `plan` (planning-only agent)
- `auto-optimized` (orchestrator - cost focus)
- `auto-performance` (orchestrator - quality focus)

### Method 2: Models Menu

1. Type `/models` in OpenCode
2. Select the agent from the list
3. The orchestrator will activate for that agent

### Method 3: Session Creation

When creating a new session, specify the agent:

```bash
opencode --agent auto-optimized
```

## ⚙️ How Agent Activation Works

### When Orchestrator is Active

The orchestrator **only runs** when you're using an agent listed in `activeAgents`:

```yaml
activeAgents:
  - auto-optimized
  - auto-performance
```

### When Orchestrator is Inactive

When using other agents (like `build` or `plan`), the orchestrator **does not interfere**:

- You can use specific models directly
- Other plugins work normally
- No automatic model switching

### Visual Feedback

When the orchestrator is active, you'll see:

```
[Orchestrator] Orchestrator active for agent: auto-optimized
[Orchestrator] Task Analysis:
  Complexity: medium
  Model: anthropic/claude-haiku-4-20250514
  Reasoning:
    - Found 2 medium keywords: implement, endpoint
    - Token count (350) fits medium range (250-600)
```

When inactive (using a different agent):

```
[Orchestrator] Orchestrator not active: Agent build not in active list
```

## 🎨 Customization

### Create Your Own Orchestrator Agent

You can create custom agents with different strategies:

```markdown
---
description: My custom orchestrator agent
mode: primary
tools:
  write: true
  edit: true
  bash: true
---

# My Custom Agent

Custom orchestrator strategy...
```

Then add it to the config:

```yaml
activeAgents:
  - auto-optimized
  - auto-performance
  - my-custom-agent  # Your custom agent
```

### Agent-Specific Strategies

You can configure different strategies for different agents:

```yaml
activeAgents:
  - auto-optimized
  - auto-performance

strategy: balanced  # Default strategy

# Or use agent detection to auto-switch strategies
# (requires custom plugin modification)
```

## 🔧 Troubleshooting

### Orchestrator Not Activating

**Problem**: You're using `auto-optimized` but the orchestrator isn't running.

**Solutions**:
1. Check that agent files are installed:
   ```bash
   ls ~/.config/opencode/agent/auto-optimized.md
   ```

2. Verify `activeAgents` in config:
   ```bash
   grep -A 2 "activeAgents" ~/.config/opencode/orchestrator.config.md
   ```

3. Enable verbose logging:
   ```yaml
   logLevel: verbose
   ```

4. Restart OpenCode

### Agent Not Showing in List

**Problem**: `auto-optimized` doesn't appear when pressing Tab.

**Solutions**:
1. Check agent file syntax (YAML frontmatter must be valid)
2. Ensure file is in correct location
3. Restart OpenCode
4. Check OpenCode logs for errors

### Wrong Model Selected

**Problem**: Orchestrator is active but selecting wrong models.

**Solutions**:
1. Check which agent you're actually using (might not be orchestrator agent)
2. Review complexity thresholds in config
3. Enable verbose logging to see reasoning
4. Verify agent is in `activeAgents` list

## 📊 Best Practices

### 1. Use the Right Agent for the Job

- **Start of project**: Use `auto-optimized` for exploration and prototyping
- **Production code**: Use `auto-performance` for critical features
- **Code review**: Use `plan` agent (no orchestrator)
- **Quick edits**: Use `build` agent with specific model

### 2. Monitor Costs

Track which agent you're using and the models being selected:

```yaml
logLevel: normal  # Shows model selection
```

### 3. Override When Needed

If orchestrator selects wrong model:
- Switch to `build` agent temporarily
- Use `/models` to select specific model
- Adjust thresholds in config

### 4. Per-Project Configuration

Use different strategies for different projects:

```bash
# Cost-sensitive project
cp orchestrator.config.cost-optimized.md .opencode/orchestrator.config.md

# Production project
cp orchestrator.config.performance.md .opencode/orchestrator.config.md
```

## 🚀 Quick Reference

| Agent | Use Case | Cost | Quality | Speed |
|-------|----------|------|---------|-------|
| `build` | Manual model selection | Variable | Variable | Variable |
| `plan` | Code review, planning | Low | High | Fast |
| `auto-optimized` | Cost-conscious development | **Low** | High | Medium |
| `auto-performance` | Quality-focused development | High | **Highest** | **Fastest** |

## 📝 Example Workflow

```bash
# 1. Start with auto-optimized for exploration
opencode --agent auto-optimized
> "Analyze the codebase structure"  # Uses GLM 4.6 (free)
> "What are the main components?"   # Uses GLM 4.6 (free)

# 2. Switch to auto-performance for implementation
# (Press Tab to switch agents)
> "Implement OAuth2 authentication"  # Uses Claude Sonnet (premium)
> "Add security middleware"          # Uses Claude Sonnet (premium)

# 3. Use plan agent for review
# (Press Tab to switch to plan)
> "Review the auth implementation"   # Uses configured review model

# 4. Back to auto-optimized for documentation
# (Press Tab to switch back)
> "Add documentation to auth code"   # Uses GLM 4.6 (cheap)
```

---

**Questions?** See the main [README.md](README.md) for full documentation.
