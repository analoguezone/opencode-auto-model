/**
 * Debug version to see what we can intercept for model selection
 */
import type { Plugin } from "@opencode-ai/plugin";

export const OrchestratorDebugPlugin: Plugin = async ({ project, client, $, directory, worktree }) => {
  console.log("[Debug] Orchestrator plugin loaded");

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
     * Log message creation events (where model selection happens)
     */
    event: async ({ event }) => {
      // Only log message.created events (where model is selected)
      if (event.type === "message.created") {
        console.log("\n[Debug] 💬 MESSAGE CREATED:");
        console.log("  event.properties.info:", JSON.stringify(event.properties?.info, null, 2));

        // Check if we can modify the model
        if (event.properties?.info?.modelID) {
          console.log("  🎯 Current model:", event.properties.info.providerID + "/" + event.properties.info.modelID);
          console.log("  ℹ️  Can we change it here? Testing...");

          // Try to modify (this might not work, but let's test)
          // event.properties.info.modelID = "test-model";
          // event.properties.info.providerID = "test-provider";
        }
      }

      // Also log session.prompt events if they exist
      if (event.type && event.type.includes("prompt")) {
        console.log("\n[Debug] 📝 PROMPT EVENT:", event.type);
        console.log("  properties:", JSON.stringify(event.properties, null, 2).substring(0, 500));
      }
    },
  };
};
