/**
 * Debug version to see what tool calls we can intercept
 */
import type { Plugin } from "@opencode-ai/plugin";

export const OrchestratorDebugPlugin: Plugin = async ({ project, client, $, directory, worktree }) => {
  console.log("[Debug] Orchestrator plugin loaded");

  return {
    /**
     * Log ALL tool executions to see what we can intercept
     */
    "tool.execute.before": async (input, output) => {
      console.log("\n[Debug] Tool intercepted:");
      console.log("  input.tool:", input.tool);
      console.log("  output.args keys:", Object.keys(output.args || {}));

      // Try to extract any text/prompt
      if (output.args) {
        console.log("  output.args:", JSON.stringify(output.args, null, 2).substring(0, 500));
      }
    },

    /**
     * Log all events
     */
    event: async ({ event }) => {
      console.log("\n[Debug] Event:");
      console.log("  type:", event.type);
      console.log("  properties:", event.properties);
    },
  };
};
