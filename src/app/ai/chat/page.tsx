"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ChevronLeft, Plus, Trash2, MessagesSquare, Paperclip, SendHorizontal, FileText,
  Image as ImageIcon, X, Lock, Loader2, History, Bot, TriangleAlert, Check, ExternalLink,
} from "lucide-react";
import Navbar from "@/components/Navbar";

const mdComponents = {
  h1: (p: React.ComponentProps<"h1">) => <h1 className="text-lg font-bold mt-3 mb-2" {...p} />,
  h2: (p: React.ComponentProps<"h2">) => <h2 className="text-base font-bold mt-3 mb-2" {...p} />,
  h3: (p: React.ComponentProps<"h3">) => <h3 className="text-sm font-semibold mt-3 mb-1" {...p} />,
  p:  (p: React.ComponentProps<"p">)  => <p className="mb-2 last:mb-0" {...p} />,
  ul: (p: React.ComponentProps<"ul">) => <ul className="list-disc pl-5 mb-2 space-y-1" {...p} />,
  ol: (p: React.ComponentProps<"ol">) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...p} />,
  li: (p: React.ComponentProps<"li">) => <li className="leading-relaxed" {...p} />,
  strong: (p: React.ComponentProps<"strong">) => <strong className="font-semibold" {...p} />,
  em: (p: React.ComponentProps<"em">) => <em className="italic" {...p} />,
  code: (p: React.ComponentProps<"code">) => <code className="bg-slate-200 text-slate-900 rounded px-1 py-0.5 text-[0.9em] font-mono" {...p} />,
  pre: (p: React.ComponentProps<"pre">) => <pre className="bg-slate-900 text-slate-100 rounded p-3 my-2 overflow-x-auto text-sm" {...p} />,
  a:  (p: React.ComponentProps<"a">)  => <a className="text-primary-700 underline hover:text-primary-800" target="_blank" rel="noopener noreferrer" {...p} />,
  table: (p: React.ComponentProps<"table">) => <div className="my-2 overflow-x-auto"><table className="w-full border-collapse text-sm" {...p} /></div>,
  th: (p: React.ComponentProps<"th">) => <th className="border border-slate-200 bg-slate-50 px-2 py-1 text-left font-semibold" {...p} />,
  td: (p: React.ComponentProps<"td">) => <td className="border border-slate-200 px-2 py-1" {...p} />,
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
  /** Local only: marks an error notice shown in place of an assistant reply. */
  error?: boolean;
}

const SUGGESTIONS = [
  "Explain photosynthesis for Grade 5",
  "Help me with a Grade 8 maths fractions problem",
  "What careers suit a learner who enjoys science?",
  "Write a Kiswahili insha intro about my school",
];

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
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/ai/chat");
  }, [status, router]);

  // Load quota first: it determines whether we can show the chat at all
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
      rejections.push(`Only ${MAX_FILES} files per message. Extras were ignored.`);
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

    // Optimistic user message: render local previews for file chips
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
        if (!createData?.id) throw new Error(createData?.error ?? `Could not start chat (HTTP ${createRes.status}). The AI service may be warming up. Try again in a few seconds.`);
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
          id: Date.now() + 1, role: "assistant", content: msg, error: true,
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
          content: data.error ?? "Something went wrong.", error: true,
        }]);
      }
    } catch (err) {
      setMessages((m) => [...m, {
        id: Date.now() + 1, role: "assistant",
        content: (err as Error).message, error: true,
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
  // Subscription gate: block the chat for users without a paid plan
  // ============================================================
  if (status === "loading" || !quotaLoaded) {
    return (
      <>
        <Navbar />
        <div className="container-page flex items-center justify-center gap-2 py-24 text-sm text-ink-soft">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading...
        </div>
      </>
    );
  }

  if (quota && !quota.has_subscription) {
    return (
      <>
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <Link href="/ai" className="link inline-flex items-center gap-1 text-sm">
            <ChevronLeft className="h-4 w-4" /> Learning tools
          </Link>
          <div className="card card-pad mt-4 text-center sm:p-10">
            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-700">
              <Lock className="h-6 w-6" />
            </span>
            <h1 className="page-title">A subscription is required</h1>
            <p className="mx-auto mt-2 max-w-lg text-sm text-ink-soft sm:text-base">
              The CBE Study Chatbot is available on our paid plans. Pick a plan to start asking questions
              and uploading photos or PDFs of your assignments.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-3 text-left md:grid-cols-3">
              <PlanCard name="Basic"   price="KES 500"   line1="Text chat" line2="No file uploads" />
              <PlanCard name="Plus"    price="KES 1,000" line1="Text chat" line2="5 uploads per month" highlight />
              <PlanCard name="Premium" price="KES 2,000" line1="Text chat" line2="Unlimited uploads" />
            </div>
            <p className="mt-5 text-xs text-ink-soft">
              School plans available: Plus KES 5,000 per month | Premium KES 10,000 per month
            </p>
            <Link href="/ai/subscribe" className="btn btn-primary btn-lg mt-6">
              View plans and subscribe
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

      <div className="container-page flex h-[calc(100dvh-4rem)] flex-col py-3 sm:py-4">
        {/* Top bar */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link href="/ai" className="link inline-flex items-center gap-1 text-sm">
              <ChevronLeft className="h-4 w-4" /> Learning tools
            </Link>
            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              className="btn btn-secondary btn-sm md:hidden"
            >
              <History className="h-4 w-4" /> Chats
            </button>
          </div>
          {quota && (
            <div className="flex items-center gap-2 text-xs text-ink-soft">
              <span className="badge badge-blue capitalize">{quota.tier ?? "Plan"}</span>
              <span className="hidden sm:inline">{uploadCounterText(quota)}</span>
            </div>
          )}
        </div>

        <div className="relative flex min-h-0 flex-1 gap-4">

          {/* Sidebar */}
          <aside
            className={`${showHistory ? "flex" : "hidden"} card absolute inset-0 z-20 flex-col p-3 md:static md:flex md:w-72 md:shrink-0`}
          >
            <div className="mb-3 flex items-center gap-2">
              <button onClick={() => { startNewChat(); setShowHistory(false); }} className="btn btn-primary flex-1">
                <Plus className="h-4 w-4" /> New chat
              </button>
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="btn-icon md:hidden"
                aria-label="Close chat list"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Recent chats</p>
            <div className="scroll-thin flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <p className="p-2 text-sm text-ink-soft">No chats yet.</p>
              ) : (
                <ul className="space-y-0.5">
                  {conversations.map((c) => (
                    <li key={c.id} className="group flex items-center gap-1">
                      <button
                        onClick={() => { setActiveId(c.id); setShowHistory(false); }}
                        className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                          activeId === c.id
                            ? "bg-primary-50 font-semibold text-primary-800"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <MessagesSquare className={`h-4 w-4 shrink-0 ${activeId === c.id ? "text-primary-700" : "text-slate-400"}`} />
                        <span className="truncate">{c.title}</span>
                      </button>
                      <button
                        onClick={() => deleteChat(c.id)}
                        title="Delete chat"
                        aria-label="Delete chat"
                        className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 md:opacity-0 md:group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>

          {/* Main chat */}
          <main className="card flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">

            {/* Empty state */}
            {isEmpty && (
              <div className="scroll-thin flex flex-1 flex-col items-center justify-center overflow-y-auto p-6 text-center sm:p-8">
                <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                  <MessagesSquare className="h-7 w-7" />
                </span>
                <h2 className="section-title">CBE Study Chatbot</h2>
                <p className="mt-2 max-w-md text-sm text-ink-soft">
                  Ask anything across CBE Grades 1 to 10. Pick a suggestion or type below to start.
                </p>
                <div className="mt-6 flex max-w-2xl flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); inputRef.current?.focus(); }}
                      className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 shadow-sm transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-800"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {!isEmpty && (
              <div ref={scrollRef} className="scroll-thin flex-1 space-y-5 overflow-y-auto bg-slate-50/60 p-4 sm:p-6">
                {messages.map((m) => (
                  <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    {m.role === "assistant" && (
                      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        m.error ? "bg-amber-50 text-amber-700" : "bg-primary-700 text-white"
                      }`}>
                        {m.error ? <TriangleAlert className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </span>
                    )}
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:text-[15px] ${
                      m.role === "user"
                        ? "whitespace-pre-wrap rounded-br-md bg-primary-700 text-white"
                        : m.error
                          ? "rounded-bl-md border border-amber-200 bg-amber-50 text-amber-800"
                          : "rounded-bl-md border border-slate-200 bg-white text-slate-800 shadow-sm"
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
                  <div className="flex justify-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-700 text-white">
                      <Bot className="h-4 w-4" />
                    </span>
                    <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
                      <span className="inline-flex gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "0ms" }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "150ms" }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "300ms" }} />
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Composer */}
            <div className="border-t border-slate-200 bg-white p-3 sm:p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value === "" ? "" : Number(e.target.value))}
                  className="select w-auto py-1.5 text-xs"
                  aria-label="Grade"
                >
                  <option value="">Any grade</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((g) =>
                    <option key={g} value={g}>Grade {g}</option>
                  )}
                </select>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject (optional)"
                  aria-label="Subject"
                  className="input w-auto max-w-[200px] flex-1 py-1.5 text-xs"
                />
                {quota && (
                  <span className="ml-auto text-xs text-ink-soft sm:hidden">{uploadCounterText(quota)}</span>
                )}
              </div>

              {/* Pending file chips */}
              {pendingFiles.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {pendingFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 py-1 pl-2 pr-1 text-xs text-slate-700">
                      {f.type === "application/pdf"
                        ? <FileText className="h-4 w-4 text-red-500" />
                        : <ImageIcon className="h-4 w-4 text-primary-600" />}
                      <span className="max-w-[180px] truncate">{f.name}</span>
                      <span className="text-slate-400">{formatBytes(f.size)}</span>
                      <button
                        onClick={() => removePending(i)}
                        className="rounded p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Remove"
                        aria-label="Remove file"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form
                onSubmit={(e) => { e.preventDefault(); send(); }}
                className="flex items-end gap-2 rounded-xl border border-slate-300 bg-white p-1.5 shadow-sm transition focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-100"
              >
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
                      ? "Your plan doesn't include uploads. Upgrade to Plus or Premium"
                      : !canUpload
                        ? "Upload limit reached for this month"
                        : "Attach images or PDFs"
                  }
                  aria-label="Attach files"
                  className="btn-icon h-10 w-10 shrink-0 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Paperclip className="h-5 w-5" />
                </button>

                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Type your message. Enter to send, Shift+Enter for a new line"
                  rows={1}
                  className="max-h-40 flex-1 resize-none border-0 bg-transparent px-1 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:outline-none focus:ring-0"
                  style={{ minHeight: "44px" }}
                />
                <button
                  type="submit"
                  disabled={sending || (!input.trim() && pendingFiles.length === 0)}
                  className="btn btn-primary h-10 shrink-0 px-4"
                >
                  {sending
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <SendHorizontal className="h-4 w-4" />}
                  <span className="hidden sm:inline">Send</span>
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
    ? "bg-white/15 text-white"
    : "bg-slate-50 border border-slate-200 text-slate-700";

  if (isImage && url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        <img src={url} alt={att.original_name ?? "image"} className="max-h-[260px] max-w-[260px] rounded-lg" />
      </a>
    );
  }

  return (
    <div className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${labelClasses}`}>
      {isImage ? <ImageIcon className="h-4 w-4 shrink-0" /> : <FileText className="h-4 w-4 shrink-0" />}
      <span className="max-w-[220px] truncate">{att.original_name ?? (isImage ? "image" : "document")}</span>
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer"
           className={`ml-1 inline-flex items-center gap-0.5 font-medium underline ${onUserBubble ? "text-white/90" : "text-primary-700"}`}>
          Open <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}

function PlanCard({
  name, price, line1, line2, highlight,
}: { name: string; price: string; line1: string; line2: string; highlight?: boolean }) {
  return (
    <div className={`relative rounded-xl border p-4 ${highlight ? "border-primary-500 bg-primary-50/40 ring-4 ring-primary-100" : "border-slate-200 bg-white"}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">{name}</span>
        {highlight && <span className="badge badge-blue">Popular</span>}
      </div>
      <div className="my-2">
        <span className="font-display text-2xl font-bold text-ink">{price}</span>
        <span className="text-sm text-ink-soft"> per month</span>
      </div>
      <ul className="space-y-1.5 text-sm text-slate-700">
        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent-600" /> {line1}</li>
        <li className="flex items-center gap-2 text-ink-soft"><Check className="h-4 w-4 text-slate-400" /> {line2}</li>
      </ul>
    </div>
  );
}
