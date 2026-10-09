import { useEffect, useState } from "react";
import { PaperPlaneTilt } from "@phosphor-icons/react";
import { api } from "../api/client.js";

export default function AiChatPanel({ questionId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.getChat(questionId).then(setMessages).catch((e) => setError(e.message));
  }, [questionId]);

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim()) return;
    setSending(true);
    setError("");
    const userText = input;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: userText, id: `local-${Date.now()}` }]);
    try {
      const reply = await api.sendChat(questionId, userText);
      setMessages((m) => [...m, reply]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="ai-chat">
      <h3>Ask the tutor</h3>
      <p className="hint">It will only nudge you. No code, no pseudocode, no algorithm names.</p>
      {messages.length === 0 ? (
        <p className="empty-state">No messages yet. Ask for a nudge.</p>
      ) : (
        <div className="chat-log">
          {messages.map((m) => (
            <p key={m.id} className={`chat-msg chat-${m.role}`}>
              <strong>{m.role === "user" ? "You" : "Tutor"}</strong>
              {m.content}
            </p>
          ))}
        </div>
      )}
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSend}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask for a nudge..."
          disabled={sending}
        />
        <button type="submit" disabled={sending}>
          <PaperPlaneTilt size={14} weight="bold" />
          Send
        </button>
      </form>
    </div>
  );
}
