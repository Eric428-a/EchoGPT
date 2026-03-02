import { tool } from "@openai/agents-realtime";
import confetti from "canvas-confetti";

export const confettiTool = tool({
  name: "Fire confetti",
  description: "Execute this function to show confetti on the user's screen",
  parameters: {
    type: "object",
    properties: {},
    required: [],
    additionalProperties: true,
  },
  strict: false,
  needsApproval: async () => false,
  execute: async () => {
    await confetti({
      origin: {
        x: 0.5,
        y: 0.9,
      },
      spread: 70,
      startVelocity: 90,
      particleCount: 250,
    });
  },
});
