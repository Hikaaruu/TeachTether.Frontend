import { useParams } from "react-router-dom";
import dayjs from "dayjs";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import useThreadMessages from "../hooks/useThreadMessages";

export default function ThreadMessagesPage() {
  const { threadId } = useParams();

  const {
    messages,
    loading,
    input,
    setInput,
    sending,
    deletingId,
    setDeletingId,
    companionName,
    companionRole,
    ctx,
    setCtx,
    listRef,
    isOwn,
    isNewDay,
    handleSend,
    handleDelete,
  } = useThreadMessages(threadId);

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
          messages.map((m, i) => (
            <div key={m.id}>
              {isNewDay(m, i) && (
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
          ))
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
