type Speaker = "user" | "coach";

export function MessageBubble({
  speaker,
  children,
  tone,
}: {
  speaker: Speaker;
  children: React.ReactNode;
  tone?: "win" | "miss";
}) {
  const isUser = speaker === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-neutral-100 text-neutral-900"
            : tone === "miss"
              ? "border border-red-900/40 bg-red-950/30 text-red-100"
              : tone === "win"
                ? "border border-emerald-900/40 bg-emerald-950/30 text-emerald-100"
                : "border border-neutral-800 bg-neutral-900 text-neutral-100",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}
