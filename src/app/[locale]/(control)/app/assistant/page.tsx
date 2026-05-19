"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AssistantPage() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!message.trim()) return;
    setLoading(true);
    const res = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    setReply(data.reply);
    setLoading(false);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">AI Assistant</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Uses OpenAI when OPENAI_API_KEY is set; otherwise returns helpful mock guidance.
        </p>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col">
        <CardHeader>
          <CardTitle>Chat</CardTitle>
          <CardDescription>Ask about leads, routes, or next actions</CardDescription>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
          <ScrollArea className="min-h-64 flex-1 rounded-lg border p-4">
            {reply ?
              <p className="text-sm whitespace-pre-wrap">{reply}</p>
            : <p className="text-muted-foreground text-sm">
                Example: &quot;Which leads should I call first this week?&quot;
              </p>
            }
          </ScrollArea>
          <div className="flex gap-2">
            <Textarea
              placeholder="Your question…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              className="min-h-0 flex-1 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <Button onClick={send} disabled={loading} className="shrink-0 self-end">
              <Send data-icon="inline-start" />
              {loading ? "…" : "Send"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
