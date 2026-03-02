import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { Phone, PhoneCall01, PhoneHangUp } from "@untitledui/icons";
import { createAudio, sounds } from "~/lib/audio";
import {
  RealtimeAgent,
  RealtimeItem,
  RealtimeSession,
  tool,
} from "@openai/agents-realtime";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import OpenAI from "openai";
import { MessageItem } from "~/components/application/messaging/messaging";
import { MessageActionTextarea } from "~/components/send-message";
import { convertFileToBase64 } from "~/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "My Realtime Agent",
      },
    ],
  }),
  component: Home,
});

export const getApiKeyFn = createServerFn().handler(async () => {
  const client = new OpenAI();

  const response = await client.realtime.clientSecrets.create({
    session: {
      type: "realtime",
      model: "gpt-realtime",
      audio: {
        output: {
          voice: "cedar",
        },
      },
      instructions: "You are an angry assistant.",
      tools: [
        {
          type: "mcp",
          server_label: "HomeAssistant",
          server_url: process.env.HOME_ASSISTANT_MCP_ENDPOINT,
          authorization: process.env.HOME_ASSISTANT_TOKEN,
          require_approval: "never",
        },
      ],
    },
  });

  return {
    apiKey: response.value,
  };
});

function Home() {
  const getApiKey = useServerFn(getApiKeyFn);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<RealtimeSession | null>(null);
  const [history, setHistory] = useState<RealtimeItem[]>([]);

  return (
    <div className="p-2 min-h-screen pb-24 flex items-center justify-center w-full bg-bg-primary dark:bg-brand-950">
      <div className="p-4 rounded-xl border border-border-brand/30 dark:border-border-brand/50 mx-auto max-w-full w-xl bg-white dark:bg-bg-secondary shadow-2xl shadow-brand-600/10 dark:shadow-brand-600/20">
        <div className="relative flex justify-between flex-col rounded-lg p-8 items-center gap-4 bg-brand-50 dark:bg-brand-950">
          <h1 className="text-2xl font-bold text-brand-800 dark:text-text-primary z-10">
            Who you gonna call?
          </h1>

          {session && !loading ? (
            <Button
              color="primary-destructive"
              className="z-10 dark:bg-error-solid dark:text-white dark:hover:bg-error-solid_hover dark:shadow-xs-skeumorphic dark:ring-1 dark:ring-transparent dark:ring-inset dark:before:absolute dark:before:inset-px dark:before:border dark:before:border-white/12 dark:before:mask-b-from-0%"
              size="lg"
              onClick={() => {
                session.close();
                setSession(null);
              }}
              iconLeading={<PhoneHangUp data-icon />}
            >
              End Call
            </Button>
          ) : (
            <Button
              isDisabled={loading}
              size="lg"
              className="z-10 dark:bg-brand-solid dark:text-white dark:hover:bg-brand-solid_hover dark:shadow-xs-skeumorphic dark:ring-1 dark:ring-transparent dark:ring-inset dark:before:absolute dark:before:inset-px dark:before:border dark:before:border-white/12 dark:before:mask-b-from-0%"
              onClick={async () => {
                const audio = createAudio(sounds.dialing, { loop: true });
                audio.play();
                setLoading(true);

                const agent = new RealtimeAgent({
                  name: "Agent",
                  instructions:
                    "You are a helpful assistant. At the end of every sentence, you say 'Moo' like a cow.",
                  tools: [
                    tool({
                      name: "Test Tool",
                      description:
                        "This is a test tool. Use this at the start of a conversation to test the tool.",
                      execute: async () => {
                        console.log("Test Tool executed");
                      },
                      parameters: {
                        type: "object",
                        properties: {},
                        required: [],
                        additionalProperties: true,
                      },
                      strict: false,
                    }),
                  ],
                });

                const session = new RealtimeSession(agent);
                setSession(session);

                session.on("history_updated", (event) => {
                  setHistory(event);
                });

                await session.connect({
                  apiKey: (await getApiKey()).apiKey,
                });

                setLoading(false);
                createAudio(sounds.connected, { volume: 0.7 }).play();
                audio.stop();
              }}
              iconLeading={
                loading ? <PhoneCall01 data-icon /> : <Phone data-icon />
              }
            >
              {loading ? "Calling..." : "Start Call"}
            </Button>
          )}
        </div>

        {/* History */}
        <ol className="flex h-full flex-col gap-4 overflow-y-auto px-4 py-6 md:px-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-primary dark:[&::-webkit-scrollbar-track]:bg-bg-primary">
          {session?.history.map((item) => {
            if (item.type === "message") {
              const text = item.content
                .map((c) => {
                  if (c.type === "input_audio" || c.type === "output_audio") {
                    return c.transcript;
                  }

                  if (c.type === "input_text" || c.type === "output_text") {
                    return c.text;
                  }

                  return "";
                })
                .filter(Boolean)
                .join("\n");

              return (
                <MessageItem
                  key={item.itemId}
                  msg={{
                    id: item.itemId,
                    text,
                    user: {
                      me: item.role === "user",
                      name: item.role === "user" ? "You" : "Agent",
                    },
                  }}
                />
              );
            } else {
              return (
                <div
                  key={item.itemId}
                  className="rounded-lg bg-gray-100 dark:bg-bg-tertiary text-xs p-2 overflow-x-scroll text-fg-primary dark:text-fg-primary"
                >
                  <pre>{JSON.stringify(item, null, 2)}</pre>
                </div>
              );
            }
          })}
        </ol>

        {/* Text and Image Input */}
        <MessageActionTextarea
          onSubmit={async (message, image) => {
            if (!session) return;

            if (message.trim()) {
              session.sendMessage({
                role: "user",
                type: "message",
                content: [
                  {
                    type: "input_text",
                    text: message,
                  },
                ],
              });
            }

            if (image) {
              session.sendMessage({
                role: "user",
                type: "message",
                content: [
                  {
                    type: "input_image",
                    image: await convertFileToBase64(image),
                  },
                ],
              });
            }
          }}
        />
      </div>
    </div>
  );
}
