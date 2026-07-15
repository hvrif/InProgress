import Link from "next/link";
import type { CheckInMessage } from "@/lib/types";

export function ChatCard({
  ended,
  lastMessage,
}: {
  ended: boolean;
  lastMessage: CheckInMessage | null;
}) {
  const label = ended
    ? "Today's check-in is done — tap to review"
    : lastMessage
      ? "Continue talking to your coach"
      : "Check in with your coach today";

  return (
    <Link
      href="/chat"
      className="block rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-4 transition hover:border-neutral-700 hover:bg-neutral-900"
    >
      <p className="text-sm font-medium text-neutral-100">{label}</p>
      {lastMessage && (
        <p className="mt-1.5 line-clamp-2 text-sm text-neutral-500">
          {lastMessage.content}
        </p>
      )}
    </Link>
  );
}
