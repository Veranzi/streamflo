"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Navbar from "@/components/Navbar";

const mdComponents = {
  h1: (p: React.ComponentProps<"h1">) => <h1 className="text-xl font-bold mt-3 mb-2" {...p} />,
  h2: (p: React.ComponentProps<"h2">) => <h2 className="text-lg font-bold mt-3 mb-2" {...p} />,
  h3: (p: React.ComponentProps<"h3">) => <h3 className="text-base font-semibold mt-3 mb-1" {...p} />,
  p:  (p: React.ComponentProps<"p">)  => <p className="mb-2 last:mb-0" {...p} />,
  ul: (p: React.ComponentProps<"ul">) => <ul className="list-disc pl-5 mb-2 space-y-1" {...p} />,
  ol: (p: React.ComponentProps<"ol">) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...p} />,
  li: (p: React.ComponentProps<"li">) => <li className="leading-relaxed" {...p} />,
  strong: (p: React.ComponentProps<"strong">) => <strong className="font-semibold" {...p} />,
  em: (p: React.ComponentProps<"em">) => <em className="italic" {...p} />,
  code: (p: React.ComponentProps<"code">) => <code className="bg-slate-200 text-slate-900 rounded px-1 py-0.5 text-[0.9em] font-mono" {...p} />,
  pre: (p: React.ComponentProps<"pre">) => <pre className="bg-slate-900 text-slate-100 rounded p-3 my-2 overflow-x-auto text-sm" {...p} />,
  a:  (p: React.ComponentProps<"a">)  => <a className="text-blue-700 underline hover:text-blue-900" target="_blank" rel="noopener noreferrer" {...p} />,
  hr: (p: React.ComponentProps<"hr">) => <hr className="border-slate-300 my-3" {...p} />,
  blockquote: (p: React.ComponentProps<"blockquote">) => <blockquote className="border-l-4 border-slate-300 pl-3 italic text-slate-600 my-2" {...p} />,
};

interface Attachment {
  id: number;
  kind: "image" | "pdf";
  mime_type: string;
  size_bytes: number;
  original_name: string | null;
}

interface Conversation {
  id: number;
  title: string;
  grade_context?: number | null;
  subject_context?: string | null;
  updated_at?: string;
}

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
}

interface Quota {
  has_subscription: boolean;
  tier: "basic" | "plus" | "premium" | null;
  plan_name: string | null;
  text_chat_allowed: boolean;
  uploads_used: number;
  uploads_limit: number;       // -1 = unlimited
  uploads_remaining: number;   // -1 = unlimited
  period_resets_at: string;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_FILES = 4;

/** Parse JSON from a Response, returning null if the body is empty / not JSON
 * (e.g. cold-start timeouts, edge 502s). Caller decides what to do with null. */
async function safeJson(res: Response): Promise<any | null> {
  const text = await res.text().catch(() => "");
  if (!text) return null;
  try { return JSON.parse(text); } catch { return null; }
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function uploadCounterText(q: Quota): string {
  if (q.uploads_limit === -1) return "Unlimited uploads";
  return `${q.uploads_used}/${q.uploads_limit} uploads this month`;
}

export default function ChatPage() {
  const { status } = useSession();
  const router = useRouter();

  const [quota, setQuota] = useState<Quota | null>(null);
  const [quotaLoaded, setQuotaLoaded] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [grade, setGrade] = useState<number | "">("");
  const [subject, setSubject] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/ai/chat");
  }, [status, router]);

  // Load quota first — it determines whether we can show the chat at all
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/ai/subscription/subscriptions/quota")
      .then((r) => r.ok ? r.json() : null)
      .then((q: Quota | null) => setQuota(q))
      .catch(() => setQuota(null))
      .finally(() => setQuotaLoaded(true));
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!quota?.has_subscription) return;
    fetch("/api/ai/chat/conversations")
      .then((r) => r.json())
      .then((data) => setConversations(Array.isArray(data) ? data : []))
      .catch(() => setConversations([]));
  }, [status, quota?.has_subscription]);

  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    fetch(`/api/ai/chat/conversations/${activeId}/messages`)
      .then((r) => r.json())
      .then((d: { conversation?: Conversation; messages: Message[] }) => {
        setMessages(d.messages ?? []);
        if (d.conversation) {
          setGrade(d.conversation.grade_context ?? "");
          setSubject(d.conversation.subject_context ?? "");
        }
      })
      .catch(() => {});
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  function startNewChat() {
    setActiveId(null);
    setMessages([]);
    setGrade("");
    setSubject("");
    setInput("");
    setPendingFiles([]);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function refreshQuota() {
    fetch("/api/ai/subscription/subscriptions/quota")
      .then((r) => r.ok ? r.json() : null)
      .then((q: Quota | null) => q && setQuota(q))
      .catch(() => {});
  }

  function pickFiles() {
    fileInputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(e.target.files ?? []);
    e.target.value = ""; // reset so picking the same file twice still fires onChange

    const accepted: File[] = [];
    const rejections: string[] = [];
    for (const f of incoming) {
      if (!ALLOWED_TYPES.includes(f.type)) {
        rejections.push(`${f.name}: unsupported type (${f.type || "unknown"})`);
        continue;
      }
      if (f.size > MAX_FILE_BYTES) {
        rejections.push(`${f.name}: too large (max 25 MB)`);
        continue;
      }
      accepted.push(f);
    }

    const next = [...pendingFiles, ...accepted].slice(0, MAX_FILES);
    if (pendingFiles.length + accepted.length > MAX_FILES) {
      rejections.push(`Only ${MAX_FILES} files per message — extras ignored.`);
    }
    setPendingFiles(next);
    if (rejections.length) alert(rejections.join("\n"));
  }

  function removePending(idx: number) {
    setPendingFiles((p) => p.filter((_, i) => i !== idx));
  }

  async function send() {
    if (sending) return;
    const text = input.trim();
    if (!text && pendingFiles.length === 0) return;
    setInput("");
    const filesToSend = pendingFiles;
    setPendingFiles([]);
    setSending(true);

    let convId = activeId;

    // Optimistic user message — render local previews for file chips
    const localPreviews: Attachment[] = filesToSend.map((f, i) => ({
      id: -1 - i,
      kind: f.type === "application/pdf" ? "pdf" : "image",
      mime_type: f.type,
      size_bytes: f.size,
      original_name: f.name,
    }));
    setMessages((m) => [...m, {
      id: Date.now(),
      role: "user",
      content: text || (filesToSend.length ? "(file upload)" : ""),
      attachments: localPreviews,
    }]);

    try {
      if (!convId) {
        const title = (text || filesToSend[0]?.name || "New chat").slice(0, 80);
        const createRes = await fetch("/api/ai/chat/conversations", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            grade: grade === "" ? undefined : Number(grade),
            subject: subject || undefined,
          }),
        });
        const createData = await safeJson(createRes);
        if (!createData?.id) throw new Error(createData?.error ?? `Could not start chat (HTTP ${createRes.status}). The AI service may be warming up — try again in a few seconds.`);
        convId = createData.id;
        setActiveId(convId);
        setConversations((c) => [
          { id: convId!, title, grade_context: grade === "" ? null : Number(grade), subject_context: subject || null },
          ...c,
        ]);
      }

      const fd = new FormData();
      fd.append("conversation_id", String(convId));
      fd.append("content", text);
      for (const f of filesToSend) fd.append("files", f, f.name);

      const res = await fetch("/api/ai/chat/chat", { method: "POST", body: fd });
      const data = await safeJson(res) ?? { error: `AI service is warming up (HTTP ${res.status}). Please try again in a few seconds.` };

      if (!res.ok) {
        const detail = data?.details?.code ?? "";
        let msg = data?.error ?? "Something went wrong.";
        if (detail === "quota_exceeded")
          msg = `You've used ${data.details.used}/${data.details.limit} uploads this month. Upgrade for more.`;
        if (detail === "tier_blocks_uploads")
          msg = "Your current plan doesn't include file uploads. Upgrade to Plus or Premium.";
        if (detail === "no_subscription")
          msg = "Your subscription has lapsed. Renew to keep using AI chat.";
        setMessages((m) => [...m, {
          id: Date.now() + 1, role: "assistant", content: `⚠ ${msg}`,
        }]);
        refreshQuota();
        return;
      }

      if (data.assistant_message) {
        // Replace the optimistic local-preview attachments with server-issued ones
        // so the chips link to /api/ai/chat/attachments/:id correctly.
        const serverAtts: Attachment[] = (data.user_attachments ?? []).map((a: {
          id: number; mime_type: string; original_name: string;
        }) => ({
          id: a.id,
          kind: a.mime_type === "application/pdf" ? "pdf" : "image",
          mime_type: a.mime_type,
          size_bytes: 0,
          original_name: a.original_name,
        }));
        setMessages((m) => {
          const copy = [...m];
          for (let i = copy.length - 1; i >= 0; i--) {
            if (copy[i].role === "user") {
              copy[i] = { ...copy[i], attachments: serverAtts.length ? serverAtts : copy[i].attachments };
              break;
            }
          }
          copy.push({
            id: data.assistant_message.id, role: "assistant", content: data.assistant_message.content,
          });
          return copy;
        });
        if (filesToSend.length > 0) refreshQuota();
      } else {
        setMessages((m) => [...m, {
          id: Date.now() + 1, role: "assistant",
          content: `⚠ ${data.error ?? "Something went wrong."}`,
        }]);
      }
    } catch (err) {
      setMessages((m) => [...m, {
        id: Date.now() + 1, role: "assistant",
        content: `⚠ ${(err as Error).message}`,
      }]);
    } finally {
      setSending(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  async function deleteChat(id: number) {
    if (!window.confirm("Delete this chat?")) return;
    await fetch(`/api/ai/chat/conversations/${id}`, { method: "DELETE" });
    setConversations((c) => c.filter((x) => x.id !== id));
    if (activeId === id) startNewChat();
  }

  // ============================================================
  // Subscription gate — block the chat for users without a paid plan
  // ============================================================
  if (status === "loading" || !quotaLoaded) {
    return (
      <>
        <Navbar />
        <div className="max-w-3xl mx-auto px-6 py-16 text-center text-slate-500">Loading…</div>
      </>
    );
  }

  if (quota && !quota.has_subscription) {
    return (
      <>
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 py-12">
          <Link href="/ai" className="text-sm text-blue-600 hover:underline">← AI Tools</Link>
          <div className="bg-white rounded-2xl shadow p-8 mt-4 text-center">
            <div className="text-5xl mb-3">🔒</div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">A subscription is required</h1>
            <p className="text-slate-600 mb-6">
              The CBC Study Chatbot is available on our paid plans. Pick a plan to start asking questions
              and uploading photos or PDFs of your assignments.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left mb-6">
              <PlanCard name="Basic"   price="Ksh 500/mo"   line1="Text chat"            line2="No file uploads" />
              <PlanCard name="Plus"    price="Ksh 1,000/mo" line1="Text chat"            line2="5 uploads / month"   highlight />
              <PlanCard name="Premium" price="Ksh 2,000/mo" line1="Text chat"            line2="Unlimited uploads" />
            </div>
            <p className="text-xs text-slate-500 mb-4">
              School plans available: Plus Ksh 5,000/mo · Premium Ksh 10,000/mo
            </p>
            <Link href="/ai/subscribe"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold">
              View plans &amp; subscribe
            </Link>
          </div>
        </div>
      </>
    );
  }

  const isEmpty = !activeId && messages.length === 0;
  const canUpload = !!quota && quota.uploads_limit !== 0 && (quota.uploads_remaining === -1 || quota.uploads_remaining > 0);

  return (
    <>
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-2">
          <Link href="/ai" className="text-sm text-blue-600 hover:underline">← AI Tools</Link>
          {quota && (
            <div className="text-xs text-slate-500">
              <span className="font-semibold capitalize">{quota.tier}</span>
              <span className="mx-1.5">·</span>
              {uploadCounterText(quota)}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[calc(100vh-160px)] mt-2">

          {/* Sidebar */}
          <aside className="md:col-span-1 bg-white rounded shadow p-3 overflow-y-auto flex flex-col">
            <button onClick={startNewChat}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 mb-3 font-semibold flex items-center justify-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              New chat
            </button>

            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <p className="text-sm text-slate-500 italic p-2">No chats yet.</p>
              ) : (
                <ul className="space-y-1">
                  {conversations.map((c) => (
                    <li key={c.id} className="group flex items-center gap-1">
                      <button onClick={() => setActiveId(c.id)}
                        className={`flex-1 text-left p-2 rounded text-sm truncate ${
                          activeId === c.id ? "bg-blue-50 text-blue-800 font-semibold" : "hover:bg-slate-50"
                        }`}>
                        {c.title}
                      </button>
                      <button onClick={() => deleteChat(c.id)}
                        title="Delete chat"
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 p-1 transition">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/></svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>

          {/* Main chat */}
          <main className="md:col-span-3 bg-white rounded shadow flex flex-col">

            {/* Empty state */}
            {isEmpty && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="text-5xl mb-3">💬</div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">CBC Study Chatbot</h2>
                <p className="text-slate-500 max-w-md mb-6">
                  Ask anything across CBC grades 1–10. Type below to start.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl w-full">
                  {[
                    "Explain photosynthesis for Grade 5",
                    "Help me with a Grade 8 maths fractions problem",
                    "What careers suit a learner who enjoys science?",
                    "Write a Kiswahili insha intro about my school",
                  ].map((q) => (
                    <button key={q} onClick={() => setInput(q)}
                      className="text-left text-sm border border-slate-200 hover:border-blue-400 hover:bg-blue-50 p-3 rounded-lg text-slate-700 transition">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {!isEmpty && (
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl leading-relaxed ${
                      m.role === "user"
                        ? "bg-blue-600 text-white rounded-br-sm whitespace-pre-wrap"
                        : "bg-slate-100 text-slate-800 rounded-bl-sm"
                    }`}>
                      {m.attachments && m.attachments.length > 0 && (
                        <div className="mb-2 space-y-1.5">
                          {m.attachments.map((a) => (
                            <AttachmentTile key={a.id} att={a} onUserBubble={m.role === "user"} />
                          ))}
                        </div>
                      )}
                      {m.role === "assistant" ? (
                        m.content && (
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                            {m.content}
                          </ReactMarkdown>
                        )
                      ) : (
                        m.content
                      )}
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 text-slate-500 p-3 rounded-2xl rounded-bl-sm italic flex items-center gap-2">
                      <span className="inline-flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Composer */}
            <div className="border-t p-3">
              <div className="flex gap-2 mb-2 text-xs">
                <select value={grade} onChange={(e) => setGrade(e.target.value === "" ? "" : Number(e.target.value))}
                  className="border rounded px-2 py-1 text-slate-600 bg-white">
                  <option value="">Grade (any)</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((g) =>
                    <option key={g} value={g}>Grade {g}</option>
                  )}
                </select>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject (optional)"
                  className="flex-1 border rounded px-2 py-1 text-slate-600 max-w-[200px]"
                />
              </div>

              {/* Pending file chips */}
              {pendingFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {pendingFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700">
                      <span>{f.type === "application/pdf" ? "📄" : "🖼"}</span>
                      <span className="truncate max-w-[180px]">{f.name}</span>
                      <span className="text-slate-400">{formatBytes(f.size)}</span>
                      <button onClick={() => removePending(i)} className="text-slate-400 hover:text-red-600 ml-1" title="Remove">×</button>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 items-end">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ALLOWED_TYPES.join(",")}
                  className="hidden"
                  onChange={onFileChange}
                />
                <button
                  type="button"
                  onClick={pickFiles}
                  disabled={!canUpload || sending}
                  title={
                    !canUpload && quota?.uploads_limit === 0
                      ? "Your plan doesn't include uploads — upgrade to Plus or Premium"
                      : !canUpload
                        ? "Upload limit reached for this month"
                        : "Attach images or PDFs"
                  }
                  className="border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg px-3 py-3"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                  </svg>
                </button>

                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Type your message…  (Enter to send, Shift+Enter for new line)"
                  rows={1}
                  className="flex-1 border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-40"
                  style={{ minHeight: "48px" }}
                />
                <button type="submit" disabled={sending || (!input.trim() && pendingFiles.length === 0)}
                  className="bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold">
                  {sending ? "…" : "Send"}
                </button>
              </form>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

function AttachmentTile({ att, onUserBubble }: { att: Attachment; onUserBubble: boolean }) {
  const isImage = att.kind === "image";
  // For local previews (id < 0) we don't yet have a server URL; show name only.
  const url = att.id > 0 ? `/api/ai/chat/attachments/${att.id}` : null;
  const labelClasses = onUserBubble
    ? "bg-blue-700/40 text-white"
    : "bg-white border border-slate-200 text-slate-700";

  if (isImage && url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        <img src={url} alt={att.original_name ?? "image"} className="max-w-[260px] max-h-[260px] rounded-lg" />
      </a>
    );
  }

  return (
    <div className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${labelClasses}`}>
      <span>{isImage ? "🖼" : "📄"}</span>
      <span className="truncate max-w-[220px]">{att.original_name ?? (isImage ? "image" : "document")}</span>
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer"
           className={`ml-1 underline ${onUserBubble ? "text-blue-100" : "text-blue-700"}`}>
          open
        </a>
      )}
    </div>
  );
}

function PlanCard({
  name, price, line1, line2, highlight,
}: { name: string; price: string; line1: string; line2: string; highlight?: boolean }) {
  return (
    <div className={`border rounded-xl p-4 ${highlight ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"}`}>
      <div className="text-sm text-slate-500">{name}</div>
      <div className="text-xl font-bold text-slate-800 my-1">{price}</div>
      <div className="text-sm text-slate-700">{line1}</div>
      <div className="text-sm text-slate-500">{line2}</div>
    </div>
  );
}
