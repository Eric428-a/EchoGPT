import { createFileRoute } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { OpenAI } from "openai";
import { useState } from "react";
import {
  RealtimeAgent,
  RealtimeItem,
  RealtimeSession,
} from "@openai/agents-realtime";
import { Button } from "@/components/base/buttons/button";
import { MessageItem } from "~/components/application/messaging/messaging";
import { Phone, PhoneCall01, PhoneHangUp } from "@untitledui/icons";
import { prompts } from "~/lib/prompts";
import { createAudio, sounds } from "~/lib/audio";
import { confettiTool } from "~/lib/tools/confetti";
import { glitchTool } from "~/lib/tools/glitch";
import { MessageActionTextarea } from "~/components/send-message";
import { RealtimeUserInput } from "node_modules/@openai/agents-realtime/dist/clientMessages";
import { convertFileToBase64 } from "~/lib/utils";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      {
        title: "gpt-realtime demo",
      },
    ],
  }),
  component: Home,
});

export const getClientTokenFn = createServerFn().handler(async () => {
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
      instructions: prompts.name,
      tools: [
        // {
        //   type: "mcp",
        //   server_label: "N8N",
        //   server_url: process.env.N8N_MCP_SERVER_URL,
        //   require_approval: "never",
        // },
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
    token: response.value,
  };
});

function Home() {
  const getClientToken = useServerFn(getClientTokenFn);
  const [loading, setLoading] = useState(false);
  const [, setAgent] = useState<RealtimeAgent | null>(null);
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
              className="z-10"
              size="lg"
              onClick={() => {
                session.close();
                setSession(null);
                setAgent(null);
              }}
              iconLeading={<PhoneHangUp data-icon />}
            >
              End Call
            </Button>
          ) : (
            <Button
              isDisabled={loading}
              size="lg"
              className="z-10"
              onClick={async () => {
                const audio = createAudio(sounds.dialing, { loop: true });
                audio.play();
                setLoading(true);
                const { token } = await getClientToken();

                const agent = new RealtimeAgent({
                  name: "Agent",
                  tools: [confettiTool, glitchTool],
                });
                setAgent(agent);

                const session = new RealtimeSession(agent);
                session.on("error", (event) => {
                  console.warn("gpt-realtime error", event);
                });
                session.on("mcp_tool_call_completed", (event) => {
                  console.log("mcp_tool_call_completed", event);
                });
                session.on("history_updated", (event) => {
                  setHistory(event);
                });
                setSession(session);

                await session.connect({
                  apiKey: token,
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

        <ol className="flex h-full flex-col gap-4 overflow-y-auto px-4 py-6 md:px-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-primary">
          {history.map((item) => {
            if (item.type === "message") {
              return (
                <MessageItem
                  key={item.itemId}
                  msg={{
                    id: item.itemId,
                    status: item.role === "user" ? "read" : undefined,
                    text: item.content
                      .map((c) =>
                        c.type === "input_text" || c.type === "output_text"
                          ? c.text
                          : c.type === "input_audio" ||
                            c.type === "output_audio"
                          ? c.transcript
                          : null
                      )
                      .filter(Boolean)
                      .join("\n"),
                    user: {
                      me: item.role === "user",
                      name: item.role === "user" ? "You" : "Agent",
                      status: !!session ? "online" : undefined,
                    },
                  }}
                />
              );
            } else {
              return (
                <div
                  key={item.itemId}
                  className="rounded-lg bg-gray-100 text-xs p-2 overflow-x-scroll"
                >
                  <pre>{JSON.stringify(item, null, 2)}</pre>
                </div>
              );
            }
          })}
        </ol>
        {session && (
          <MessageActionTextarea
            onSubmit={async (message, image) => {
              const input: RealtimeUserInput = {
                role: "user",
                type: "message",
                content: [],
              };

              if (message.trim()) {
                input.content.push({
                  type: "input_text",
                  text: message,
                });
              }

              if (image) {
                const base64Image = await convertFileToBase64(image);
                input.content.push({
                  type: "input_image",
                  image: base64Image,
                });
              }

              session.sendMessage(input);
            }}
          />
        )}
      </div>
    </div>
  );
}
