# OpenCode `prompt.before` Hook Implementation Guide

## Objective

Implement a new plugin hook `prompt.before` that fires BEFORE OpenCode sends a prompt to the LLM, allowing plugins to:
1. Inspect the prompt and session context
2. Override model selection dynamically
3. Inject additional context
4. Block prompts if needed

## Why This Hook Is Needed

**Current limitation**: OpenCode plugins can only intercept tool executions (read, write, bash) via `tool.execute.before`, but they CANNOT intercept the initial LLM reasoning call where the model is selected.

**Use case**: Dynamic model selection based on task complexity
- Simple tasks → cheap model (GLM 4.6)
- Complex tasks → expensive model (GPT-5)
- Saves cost while maintaining quality

**Prior art**: Droid (Factory AI) has a `UserPromptSubmit` hook that works exactly this way.

---

## Investigation Phase

### Step 1: Find the Prompt Handling Code

Search for where OpenCode processes user prompts and creates LLM messages:

```bash
# Key search patterns
rg "session\.prompt" --type ts -A 5
rg "client\.chat" --type ts -A 5
rg "createMessage" --type ts -A 5
rg "streamText" --type ts -A 5  # AI SDK call
rg "tool\.execute\.before" --type ts -A 10  # Study existing hook

# Find plugin hook registration
rg "PluginHooks" --type ts
rg "registerHook" --type ts
```

### Step 2: Key Files to Examine

Based on typical architecture, check:

```
packages/core/src/
  ├── session/
  │   ├── message.ts          # Message creation/handling
  │   ├── prompt.ts           # Prompt processing
  │   └── session.ts          # Session management
  ├── plugin/
  │   ├── types.ts            # Plugin type definitions
  │   ├── loader.ts           # Plugin loading
  │   └── hooks.ts            # Hook execution
  └── ai/
      ├── client.ts           # AI provider client
      └── model.ts            # Model selection
```

### Step 3: Understand the Flow

Trace the execution path:
1. User types prompt → `session.prompt()`
2. Session creates message → `createMessage()`
3. Model is selected → `getModel()` or similar
4. LLM call is made → `client.chat()` or `streamText()`

**We need to inject between steps 2 and 3!**

---

## Implementation Phase

### Step 1: Define the Hook Interface

**File**: `packages/plugin/src/types.ts` (or similar)

```typescript
export interface PluginHooks {
  "tool.execute.before"?: (input: ToolExecuteInput, output: ToolExecuteOutput) => Promise<void>;
  "tool.execute.after"?: (input: ToolExecuteInput, output: ToolExecuteOutput) => Promise<void>;

  // 🆕 NEW HOOK
  "prompt.before"?: (input: PromptBeforeInput, output: PromptBeforeOutput) => Promise<void>;

  event?: (event: Event) => Promise<void>;
}

// 🆕 NEW INPUT TYPE
export interface PromptBeforeInput {
  prompt: string;              // User's prompt text
  sessionId: string;           // Current session ID
  contextTokens: number;       // Estimated context size
  currentModel: ModelInfo;     // Currently selected model
}

// 🆕 NEW OUTPUT TYPE
export interface PromptBeforeOutput {
  args: {
    prompt?: string;           // Can modify prompt
    model?: ModelInfo;         // Can override model
    additionalContext?: string; // Can inject context
    block?: boolean;           // Can block prompt
    blockReason?: string;      // Reason for blocking
  };
}

export interface ModelInfo {
  providerId: string;          // e.g., "openai", "anthropic", "zai-coding-plan"
  modelId: string;             // e.g., "gpt-5-codex", "claude-sonnet-4-5"
}
```

### Step 2: Add Hook Execution

**File**: `packages/core/src/session/prompt.ts` (or wherever prompt handling lives)

Find the function that processes user prompts, something like:

```typescript
// BEFORE (pseudocode - find the actual code)
async function processPrompt(prompt: string, sessionId: string) {
  const model = getCurrentModel(); // Model selected here

  const response = await client.chat.create({
    model: `${model.providerId}/${model.modelId}`,
    messages: [...],
  });

  return response;
}
```

Modify it to:

```typescript
// AFTER (pseudocode - adapt to actual code)
async function processPrompt(prompt: string, sessionId: string) {
  let model = getCurrentModel();
  let modifiedPrompt = prompt;

  // 🆕 EXECUTE PROMPT.BEFORE HOOKS
  const hookInput: PromptBeforeInput = {
    prompt,
    sessionId,
    contextTokens: estimateTokenCount(getSessionContext(sessionId)),
    currentModel: model,
  };

  const hookOutput: PromptBeforeOutput = {
    args: {
      prompt: modifiedPrompt,
      model: model,
    },
  };

  // Execute all registered hooks
  await executeHooks("prompt.before", hookInput, hookOutput);

  // Apply hook modifications
  if (hookOutput.args.block) {
    throw new Error(hookOutput.args.blockReason || "Prompt blocked by plugin");
  }

  if (hookOutput.args.model) {
    model = hookOutput.args.model; // Plugin overrode model!
  }

  if (hookOutput.args.prompt) {
    modifiedPrompt = hookOutput.args.prompt;
  }

  if (hookOutput.args.additionalContext) {
    modifiedPrompt = `${hookOutput.args.additionalContext}\n\n${modifiedPrompt}`;
  }

  // NOW create the LLM message with potentially modified model
  const response = await client.chat.create({
    model: `${model.providerId}/${model.modelId}`,
    messages: [...],
  });

  return response;
}
```

### Step 3: Implement Hook Execution Function

**File**: `packages/core/src/plugin/hooks.ts` (or wherever hook execution lives)

Study the existing `executeHooks` function for `tool.execute.before` and create a similar one for `prompt.before`:

```typescript
export async function executePromptBeforeHooks(
  hookInput: PromptBeforeInput,
  hookOutput: PromptBeforeOutput
): Promise<void> {
  const plugins = getLoadedPlugins();

  for (const plugin of plugins) {
    if (plugin.hooks?.["prompt.before"]) {
      try {
        await plugin.hooks["prompt.before"](hookInput, hookOutput);
      } catch (error) {
        console.error(`[Plugin] prompt.before hook failed:`, error);
        // Don't let plugin errors break execution
      }
    }
  }
}
```

---

## Testing Phase

### Step 1: Create Test Plugin

**File**: `test-plugins/prompt-logger.plugin.ts`

```typescript
import type { Plugin } from "@opencode-ai/plugin";

export const PromptLoggerPlugin: Plugin = async ({ directory }) => {
  console.log("[PromptLogger] Plugin loaded");

  return {
    "prompt.before": async (input, output) => {
      console.log("\n🎯 PROMPT INTERCEPTED:");
      console.log("  Prompt:", input.prompt.substring(0, 100));
      console.log("  Session:", input.sessionId);
      console.log("  Context tokens:", input.contextTokens);
      console.log("  Current model:", input.currentModel.providerId + "/" + input.currentModel.modelId);

      // Don't modify anything yet - just log
    },
  };
};
```

### Step 2: Create Model Switcher Plugin

**File**: `test-plugins/model-switcher.plugin.ts`

```typescript
import type { Plugin } from "@opencode-ai/plugin";

export const ModelSwitcherPlugin: Plugin = async ({ directory }) => {
  console.log("[ModelSwitcher] Plugin loaded");

  return {
    "prompt.before": async (input, output) => {
      const promptLower = input.prompt.toLowerCase();

      // Simple complexity detection
      const isSimple =
        promptLower.includes("fix typo") ||
        promptLower.includes("simple") ||
        promptLower.includes("quick") ||
        input.prompt.length < 50;

      const isComplex =
        promptLower.includes("refactor") ||
        promptLower.includes("architecture") ||
        promptLower.includes("design") ||
        input.contextTokens > 100000;

      if (isSimple) {
        output.args.model = {
          providerId: "zai-coding-plan",
          modelId: "glm-4.6"
        };
        console.log("  ✅ Switched to GLM 4.6 (simple task)");
      } else if (isComplex) {
        output.args.model = {
          providerId: "openai",
          modelId: "gpt-5-codex-high"
        };
        console.log("  ✅ Switched to GPT-5 (complex task)");
      }
    },
  };
};
```

### Step 3: Test Scenarios

```bash
# Build OpenCode
npm run build

# Test 1: Simple prompt (should use GLM 4.6)
opencode --print-logs --log-level DEBUG
> "fix typo in readme"

# Expected output:
# 🎯 PROMPT INTERCEPTED:
#   Prompt: fix typo in readme
#   Current model: anthropic/claude-sonnet-4-5
# ✅ Switched to GLM 4.6 (simple task)

# Test 2: Complex prompt (should use GPT-5)
> "refactor the entire authentication system to use JWT"

# Expected output:
# 🎯 PROMPT INTERCEPTED:
#   Prompt: refactor the entire authentication...
#   Current model: anthropic/claude-sonnet-4-5
# ✅ Switched to GPT-5 (complex task)

# Test 3: Verify model was actually used
# Check the response header or logs to confirm the switched model was called
```

---

## Validation Checklist

- [ ] Hook fires BEFORE LLM call
- [ ] Hook receives correct prompt text
- [ ] Hook receives session context
- [ ] Hook can read current model
- [ ] Hook can override model selection
- [ ] Overridden model is actually used for LLM call
- [ ] Multiple plugins can chain (last one wins)
- [ ] Hook errors don't crash OpenCode
- [ ] Existing functionality still works
- [ ] Tests pass

---

## Key Questions to Answer

During implementation, find answers to:

1. **Where is model selection done?**
   - File: `???`
   - Function: `???`
   - Line: `???`

2. **Where is the LLM call made?**
   - File: `???`
   - Function: `???`
   - Line: `???`

3. **How are existing hooks executed?**
   - File: `???`
   - Function: `???`

4. **How are plugins loaded?**
   - File: `???`
   - Function: `???`

5. **Where are plugin types defined?**
   - File: `???`

---

## Success Criteria

You know it works when:

1. ✅ You can log every prompt before it's sent to LLM
2. ✅ You can see the current model that would be used
3. ✅ You can change the model in the plugin
4. ✅ The changed model is actually used for that LLM call
5. ✅ OpenCode shows "using model X" in the response header reflecting your change
6. ✅ Your orchestrator plugin from this repo works perfectly when copied to OpenCode

---

## Final Deliverable

Once working, create:

1. **Implementation PR** to OpenCode with:
   - New hook type definitions
   - Hook execution in prompt handler
   - Documentation for the hook
   - Example plugin (model switcher)
   - Tests

2. **Working orchestrator plugin** that:
   - Detects task complexity
   - Switches models dynamically
   - Logs decisions
   - Actually works in production OpenCode

---

## Reference: Your Working Orchestrator Plugin

Once the hook exists, your plugin from this repo becomes:

```typescript
// orchestrator.plugin.ts
import type { Plugin } from "@opencode-ai/plugin";

export const OrchestratorPlugin: Plugin = async ({ directory }) => {
  const config = await loadConfig(directory);

  return {
    "prompt.before": async (input, output) => {
      const analysis = analyzeComplexity(
        input.prompt,
        input.contextTokens,
        config
      );

      const selectedModel = selectModel(
        analysis.taskType,
        analysis.complexity,
        config
      );

      output.args.model = selectedModel;

      console.log(`[Orchestrator] ${analysis.taskType}/${analysis.complexity} → ${selectedModel.providerId}/${selectedModel.modelId}`);
    },
  };
};
```

And it will FINALLY work! 🎉

---

## Next Steps

1. Clone your forked repo
2. Search for the key files listed above
3. Answer the "Key Questions" section
4. Implement the hook following the pattern
5. Test with the simple plugins
6. Port your full orchestrator plugin
7. Submit PR to OpenCode
8. Celebrate! 🚀
