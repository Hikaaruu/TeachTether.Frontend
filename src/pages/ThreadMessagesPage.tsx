import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import dayjs from "dayjs";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthProvider";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import { buildConnection } from "../api/signalr";

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

const TAKE = 50;
const fullName = (u: {
  firstName: string;
  middleName?: string;
  lastName: string;
}) => [u.firstName, u.middleName, u.lastName].filter(Boolean).join(" ");

export default function ThreadMessagesPage() {
  const { threadId } = useParams();
  const { user } = useAuth();
  const currentUserId = user?.id;
  const schoolId = user?.schoolId;
  const currentRole = user?.role;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);
  const [hasMore, setHasMore] = useState(true);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [companionName, setCompanionName] = useState("");
  const [companionRole, setCompanionRole] = useState("");

  const [ctx, setCtx] = useState<{
    msgId: number;
    x: number;
    y: number;
  } | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const didInitialScroll = useRef(false);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = listRef.current;
    if (el)
      el.scrollTo({
        top: el.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
  }, []);

  const nearBottom = () => {
    const el = listRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  useEffect(() => {
    if (!threadId) return;
    (async () => {
      try {
        const thread = await api.get<Thread>(`/threads/${threadId}`);
        const id =
          currentRole === "Teacher"
            ? thread.data.guardianId
            : thread.data.teacherId;
        const res =
          currentRole === "Teacher"
            ? await api.get<Guardian>(`/schools/${schoolId}/guardians/${id}`)
            : await api.get<Teacher>(`/schools/${schoolId}/teachers/${id}`);

        setCompanionRole(currentRole === "Teacher" ? "Guardian" : "Teacher");
        setCompanionName(fullName(res.data.user));
      } catch {
        setCompanionName("");
      }
    })();
  }, [threadId, currentRole, schoolId]);

  useEffect(() => {
    if (!threadId) return;

    const connection = buildConnection();

    connection
      .start()
      .then(() => connection.invoke("JoinThread", Number(threadId)))
      .catch(console.error);

    connection.on("ReceiveMessage", (msg: Message) => {
      const shouldStick = msg.senderUserId === currentUserId || nearBottom();

      setMessages((prev) => [...prev, msg]);

      if (msg.senderUserId !== currentUserId) {
        api
          .patch(`/threads/${threadId}/messages/${msg.id}`, {})
          .catch(console.error);
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, isRead: true } : m))
        );
      }

      if (shouldStick) {
        setTimeout(() => scrollToBottom(false), 5);
      }
    });

    connection.on("MessageRead", (id: number) =>
      setMessages((p) =>
        p.map((m) => (m.id === id ? { ...m, isRead: true } : m))
      )
    );

    connection.on("MessageDeleted", (id: number) => {
      const atBottom = nearBottom();
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (atBottom) {
        requestAnimationFrame(() => scrollToBottom(false));
      }
    });

    return () => void connection.stop();
  }, [threadId, currentUserId, scrollToBottom]);

  const fetchBatch = async (beforeId?: number) => {
    const params = new URLSearchParams({ take: TAKE.toString() });
    if (beforeId) params.append("beforeId", beforeId.toString());
    const r = await api.get<Message[]>(
      `/threads/${threadId}/messages?${params}`
    );
    return r.data;
  };

  useEffect(() => {
    if (!threadId) return;

    (async () => {
      setLoading(true);
      try {
        const batch = await fetchBatch();
        const ordered = batch.sort((a, b) => a.id - b.id);
        setMessages(ordered);
        setHasMore(batch.length === TAKE);

        const unread = ordered.filter(
          (m) => !m.isRead && m.senderUserId !== currentUserId
        );
        if (unread.length) {
          await Promise.all(
            unread.map((m) =>
              api.patch(`/threads/${threadId}/messages/${m.id}`, {})
            )
          );
          setMessages((p) =>
            p.map((m) =>
              unread.some((u) => u.id === m.id) ? { ...m, isRead: true } : m
            )
          );
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [threadId, currentUserId]);

  useEffect(() => {
    if (!loading && !didInitialScroll.current) {
      scrollToBottom(false);
      didInitialScroll.current = true;
    }
  }, [loading, scrollToBottom]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const onScroll = async () => {
      if (el.scrollTop > 120 || !hasMore || loadingMoreRef.current) return;

      loadingMoreRef.current = true;
      setLoadingMore(true);

      const beforeId = messages[0]?.id;
      if (!beforeId) return;

      try {
        const batch = await fetchBatch(beforeId);
        if (batch.length < TAKE) setHasMore(false);

        const ordered = batch.sort((a, b) => a.id - b.id);
        const oldHeight = el.scrollHeight;
        const prevScrollTop = el.scrollTop;
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          const unique = ordered.filter((m) => !seen.has(m.id));
          return [...unique, ...prev];
        });

        requestAnimationFrame(() => {
          const delta = el.scrollHeight - oldHeight;
          el.scrollTop = prevScrollTop + delta;
        });
      } finally {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    };

    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [messages, hasMore]);

  const isOwn = (m: Message) => m.senderUserId === currentUserId;

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await api.post(`/threads/${threadId}/messages`, {
        content: input.trim(),
      });
      setInput("");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: number) => {
    const atBottom = nearBottom();
    setMessages((p) => p.filter((m) => m.id !== id));
    if (atBottom) scrollToBottom(false);
    await api.delete(`/threads/${threadId}/messages/${id}`);
  };

  return (
    <div
      className="d-flex flex-column"
      style={{ height: "84vh", overflow: "hidden" }}
      onClick={() => ctx && setCtx(null)}
    >
      {companionName && (
        <div className="text-center py-2 border-bottom">
          <strong>
            {companionRole}: {companionName}
          </strong>
        </div>
      )}

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
          messages.map((m, i) => {
            const newDay =
              i === 0 || !dayjs(m.sentAt).isSame(messages[i - 1].sentAt, "day");
            return (
              <div key={m.id}>
                {newDay && (
                  <div className="text-center text-muted small my-2">
                    {dayjs(m.sentAt).format("DD MMM YYYY")}
                  </div>
                )}

                <div
                  className={`d-flex mb-2 ${
                    isOwn(m) ? "justify-content-end" : ""
                  }`}
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
                    <div
                      className="small"
                      style={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {m.content}
                    </div>
                    <div className="text-end text-muted small d-flex justify-content-between">
                      <span>{dayjs(m.sentAt).format("HH:mm")}</span>
                      {isOwn(m) && m.isRead && (
                        <span className="ms-2 text-primary">✔</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {ctx && (
          <ul
            className="list-group position-fixed shadow"
            style={{ top: ctx.y, left: ctx.x, width: 120, zIndex: 1055 }}
            onClick={(e) => e.stopPropagation()}
          >
            <li
              className="list-group-item list-group-item-action"
              role="button"
              onClick={() => setDeletingId(ctx.msgId)}
            >
              Delete
            </li>
          </ul>
        )}
      </div>

      <div className="border-top p-3 flex-shrink-0">
        <div className="input-group">
          <input
            className="form-control"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            style={{ outline: "none", boxShadow: "none" }}
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

      {deletingId !== null && (
        <ConfirmDeleteModal
          title="Delete Message"
          message="Are you sure you want to delete this message?"
          onCancel={() => setDeletingId(null)}
          onConfirm={() => {
            handleDelete(deletingId);
            setDeletingId(null);
          }}
        />
      )}
    </div>
  );
}
