import { tool } from "@openai/agents-realtime";
import { PowerGlitch } from "powerglitch";

export const glitchTool = tool({
  name: "Glitch",
  description:
    "Glitch the user's screen. You must do this every time you get angry.",
  parameters: {
    type: "object",
    properties: {},
    required: [],
    additionalProperties: true,
  },
  strict: false,
  needsApproval: async () => false,
  execute: async () => {
    PowerGlitch.glitch(document.body, {
      playMode: "always",
    });
  },
});
