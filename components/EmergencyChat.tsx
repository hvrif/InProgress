"use client";

import { useEffect, useRef, useState } from "react";
import { MessageBubble } from "@/components/MessageBubble";
import type { SupportMessage } from "@/lib/types";

let localIdCounter = 0;
function nextLocalId(): string {
  localIdCounter += 1;
  return `local-${localIdCounter}`;
}

export function EmergencyChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    // Standard fetch-on-open pattern for a modal; nothing to derive this from.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    fetch("/api/support")
      .then((res) => res.json())
      .then((body) => setMessages(body.messages ?? []))
      .catch(() => setError("Couldn't load your history."))
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;

    setSending(true);
    setError(null);
    setDraft("");
    setMessages((prev) => [
      ...prev,
      {
        id: nextLocalId(),
        user_id: "",
        role: "user",
        content,
        created_at: new Date().toISOString(),
      },
    ]);

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong");
      }
      const body = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: nextLocalId(),
          user_id: "",
          role: "assistant",
          content: body.reply,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border border-red-900/60 bg-red-950/40 px-3 py-1 text-xs font-medium text-red-200 transition hover:bg-red-950/60"
      >
        Talk now
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
          <div className="flex h-[85vh] w-full max-w-lg flex-col rounded-t-2xl border border-neutral-800 bg-neutral-950 sm:h-[80vh] sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-neutral-900 px-4 py-3">
              <p className="text-sm font-medium text-neutral-200">Talk now</p>
              <button
                onClick={() => setOpen(false)}
                className="text-sm text-neutral-500 hover:text-neutral-300"
              >
                Close
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {loading && <p className="text-sm text-neutral-500">Loading...</p>}
              {!loading && messages.length === 0 && (
                <p className="text-sm text-neutral-500">
                  Say what&rsquo;s going on. This doesn&rsquo;t count toward today&rsquo;s
                  check-in — it&rsquo;s just for right now.
                </p>
              )}
              {messages.map((m) => (
                <MessageBubble key={m.id} speaker={m.role === "user" ? "user" : "coach"}>
                  {m.content}
                </MessageBubble>
              ))}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={send} className="flex gap-2 border-t border-neutral-900 px-4 py-3">
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="What's going on right now?"
                disabled={sending}
                className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-neutral-600 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={sending}
                className="rounded-lg bg-neutral-100 px-4 py-2 font-medium text-neutral-900 transition hover:bg-white disabled:opacity-50"
              >
                {sending ? "..." : "Send"}
              </button>
            </form>
            {error && <p className="px-4 pb-3 text-sm text-red-400">{error}</p>}
          </div>
        </div>
      )}
    </>
  );
}
