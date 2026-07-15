"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DayChat() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/checkin/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong");
      }
      setMessage("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function endForToday() {
    setEnding(true);
    setError(null);

    try {
      const res = await fetch("/api/checkin/end", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setEnding(false);
    }
  }

  return (
    <div className="border-t border-neutral-800 bg-neutral-950 px-4 py-4">
      <form onSubmit={sendMessage} className="mx-auto flex max-w-2xl gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Say more, or end for today."
          disabled={submitting || ending}
          className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-neutral-600 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={submitting || ending}
          className="rounded-lg bg-neutral-100 px-4 py-2 font-medium text-neutral-900 transition hover:bg-white disabled:opacity-50"
        >
          {submitting ? "..." : "Send"}
        </button>
        <button
          type="button"
          onClick={endForToday}
          disabled={submitting || ending}
          className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-400 transition hover:border-neutral-500 hover:text-neutral-200 disabled:opacity-50"
        >
          {ending ? "..." : "End for today"}
        </button>
      </form>
      {error && <p className="mx-auto mt-2 max-w-2xl text-sm text-red-400">{error}</p>}
    </div>
  );
}
