// File: pages/messages/ThreadMessagesPage.tsx
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import dayjs from "dayjs";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthProvider";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";

/* ---------- Types ---------- */
type Message = {
  id: number;
  threadId: number;
  senderUserId: string;
  content: string | null;
  sentAt: string;
  isRead: boolean;
};

type Thread = { id: number; teacherId: number; guardianId: number };
type Teacher = {
  id: number;
  user: { firstName: string; middleName?: string; lastName: string };
};
type Guardian = {
  id: number;
  user: { firstName: string; middleName?: string; lastName: string };
};

/* ---------- Utils ---------- */
const fullName = (u: {
  firstName: string;
  middleName?: string;
  lastName: string;
}) => [u.firstName, u.middleName, u.lastName].filter(Boolean).join(" ");

/* ---------- Page ---------- */
export default function ThreadMessagesPage() {
  const { threadId } = useParams();
  const { user } = useAuth();
  const schoolId = user?.schoolId;
  const currentUserId = user?.id;
  const currentRole = user?.role; // "Teacher" or "Guardian"

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [deletingMsgId, setDeletingMsgId] = useState<number | null>(null);
  const [companionName, setCompanionName] = useState("");
  const [companionRole, setCompanionRole] = useState("");

  const [ctx, setCtx] = useState<{
    msgId: number;
    x: number;
    y: number;
  } | null>(null);

  /* ---------- scrolling helpers ---------- */
  // reference to the scrollable container
  const listRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (smooth = false) => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
  };

  /* ---------- fetch companion ---------- */
  useEffect(() => {
    if (!threadId) return;
    (async () => {
      try {
        const t = await api.get<Thread>(`/threads/${threadId}`);
        const companionId =
          currentRole === "Teacher" ? t.data.guardianId : t.data.teacherId;
        const compRes =
          currentRole === "Teacher"
            ? await api.get<Guardian>(
                `/schools/${schoolId}/guardians/${companionId}`
              )
            : await api.get<Teacher>(
                `/schools/${schoolId}/teachers/${companionId}`
              );

        setCompanionRole(currentRole === "Teacher" ? "Guardian" : "Teacher");
        setCompanionName(fullName(compRes.data.user));
      } catch {
        setCompanionName("");
      }
    })();
  }, [threadId, currentRole, schoolId]);

  /* ---------- fetch messages ---------- */
  useEffect(() => {
    if (!threadId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get<Message[]>(`/threads/${threadId}/messages`);
        const sorted = res.data.sort(
          (a, b) => dayjs(a.sentAt).valueOf() - dayjs(b.sentAt).valueOf()
        );
        setMessages(sorted);

        // mark companion’s unread messages as read
        const unread = sorted.filter(
          (m) => !m.isRead && m.senderUserId !== currentUserId
        );
        await Promise.all(
          unread.map((m) =>
            api.patch(`/threads/${threadId}/messages/${m.id}`, {})
          )
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [threadId, currentUserId]);

  /* ---------- scroll after initial load ---------- */
  useLayoutEffect(() => {
    if (!loading) scrollToBottom(); // jump (no animation) after first render
  }, [loading]);

  /* ---------- scroll when a new message appears ---------- */
  useLayoutEffect(() => {
    if (messages.length) scrollToBottom(true); // smooth for subsequent additions
  }, [messages.length]);

  /* ---------- helpers ---------- */
  const isOwn = (m: Message) => m.senderUserId === currentUserId;

  /* ---------- send ---------- */
  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const res = await api.post<Message>(`/threads/${threadId}/messages`, {
        content: input.trim(),
      });
      setMessages((prev) => [...prev, res.data]); // triggers scroll effect
      setInput("");
    } finally {
      setSending(false);
    }
  };

  /* ---------- delete ---------- */
  const handleDelete = async () => {
    if (deletingMsgId == null) return;
    await api.delete(`/threads/${threadId}/messages/${deletingMsgId}`);
    setMessages((prev) => prev.filter((m) => m.id !== deletingMsgId));
    setDeletingMsgId(null);
    setCtx(null);
  };

  /* ---------- render ---------- */
  return (
    <div
      className="d-flex flex-column"
      style={{ height: "84vh", overflow: "hidden" }}
      onClick={() => ctx && setCtx(null)}
    >
      {/* Companion heading */}
      {companionName && (
        <div className="text-center py-2 border-bottom">
          <strong>
            {companionRole}: {companionName}
          </strong>
        </div>
      )}

      {/* Messages */}
      <div
        ref={listRef}
        className="flex-grow-1 overflow-auto px-3 pt-3 pb-0"
        style={{ minHeight: 0 }}
      >
        {loading ? (
          <p>Loading...</p>
        ) : messages.length === 0 ? (
          <p className="text-muted">No messages yet.</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`d-flex mb-2 ${isOwn(m) ? "justify-content-end" : ""}`}
              onContextMenu={(e) => {
                if (!isOwn(m)) return;
                e.preventDefault();
                setCtx({ msgId: m.id, x: e.clientX, y: e.clientY });
              }}
            >
              <div
                className={`p-2 rounded ${
                  isOwn(m)
                    ? "bg-primary-subtle text-dark"
                    : "bg-light-subtle border text-dark"
                }`}
                style={{ maxWidth: "70%" }}
              >
                <div className="small">{m.content}</div>
                <div className="text-end text-muted small d-flex justify-content-between">
                  <span>{dayjs(m.sentAt).format("HH:mm")}</span>
                  {isOwn(m) && m.isRead && (
                    <span className="ms-2 text-primary">✔</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {/* context menu */}
        {ctx && (
          <ul
            className="list-group position-fixed shadow"
            style={{ top: ctx.y, left: ctx.x, width: 120, zIndex: 1055 }}
            onClick={(e) => e.stopPropagation()}
          >
            <li
              className="list-group-item list-group-item-action"
              role="button"
              onClick={() => setDeletingMsgId(ctx.msgId)}
            >
              Delete
            </li>
          </ul>
        )}
      </div>

      {/* Input */}
      <div className="border-top p-3 flex-shrink-0">
        <div className="input-group">
          <input
            className="form-control"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ outline: "none", boxShadow: "none" }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            className="btn btn-primary"
            disabled={!input.trim() || sending}
            onClick={handleSend}
          >
            Send
          </button>
        </div>
      </div>

      {/* Delete confirm */}
      {deletingMsgId !== null && (
        <ConfirmDeleteModal
          title="Delete Message"
          message="Are you sure you want to delete this message? This action cannot be undone."
          onCancel={() => setDeletingMsgId(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
