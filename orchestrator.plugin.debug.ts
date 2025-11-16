/**
 * Debug version to see what we can intercept for model selection
 */
import type { Plugin } from "@opencode-ai/plugin";

export const OrchestratorDebugPlugin: Plugin = async ({ project, client, $, directory, worktree }) => {
  console.log("[Debug] Orchestrator plugin loaded");

  // Track which events we've seen
  const seenEventTypes = new Set<string>();

  return {
    /**
     * Log ALL tool executions to see what we can intercept
     */
    "tool.execute.before": async (input, output) => {
      console.log("\n[Debug] ⚙️ TOOL INTERCEPTED:");
      console.log("  input.tool:", input.tool);
      console.log("  output.args keys:", Object.keys(output.args || {}));

      // Try to extract any text/prompt
      if (output.args) {
        console.log("  output.args:", JSON.stringify(output.args, null, 2).substring(0, 500));
      }
    },

    /**
     * Log ALL events to see which ones fire
     */
    event: async ({ event }) => {
      const eventType = event.type || "unknown";

      // Log ALL event types (to discover what's available)
      if (!seenEventTypes.has(eventType)) {
        seenEventTypes.add(eventType);
        console.log("\n[Debug] 🆕 NEW EVENT TYPE DISCOVERED:", eventType);
      }

      // Log message-related events (where model might be)
      if (eventType.includes("message")) {
        console.log("\n[Debug] 💬 MESSAGE EVENT:", eventType);

        // Check for model info
        const info = event.properties?.info;
        if (info?.modelID) {
          console.log("  🎯 MODEL FOUND:", info.providerID + "/" + info.modelID);
          console.log("  📍 Role:", info.role);
          console.log("  📄 Full info:", JSON.stringify(info, null, 2).substring(0, 300));
        }
      }

      // Log session events (less verbose)
      if (eventType.includes("session") && !eventType.includes("diff")) {
        console.log("\n[Debug] 📋 SESSION EVENT:", eventType);
      }
    },
  };
};
