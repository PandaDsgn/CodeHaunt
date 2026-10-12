import { useEffect, useState } from "react";
import { ArrowCounterClockwise, Prohibit } from "@phosphor-icons/react";
import { api } from "../api/client.js";

export default function ParticipantRoster() {
  const [form, setForm] = useState({ email: "", name: "", password: "" });
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState("");

  function refresh() {
    api.listParticipants().then(setParticipants).catch((e) => setError(e.message));
  }

  useEffect(refresh, []);

  async function setDisqualified(user, disqualify) {
    setError("");
    try {
      const updated = disqualify
        ? await api.disqualifyParticipant(user.id)
        : await api.reinstateParticipant(user.id);
      setParticipants((list) => list.map((p) => (p.id === updated.id ? updated : p)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await api.createParticipant(form);
      refresh();
      setForm({ email: "", name: "", password: "" });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page admin-page">
      <h1>Participant roster</h1>
      {error && <p className="error">{error}</p>}
      <div className="admin-split">
        <section className="panel">
          <div className="panel-head">
            <h2>Add participant</h2>
          </div>
          <form onSubmit={handleCreate} className="form-grid one-col">
            <label>
              Name
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </label>
            <div className="form-actions">
              <button type="submit">Add participant</button>
            </div>
          </form>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Participants</h2>
            <span className="hint">{participants.length} total</span>
          </div>
          {participants.length === 0 ? (
            <p className="empty-state">No participants added yet.</p>
          ) : (
            <ul className="question-list">
              {participants.map((u) => (
                <li key={u.id}>
                  <span className="meta">
                    {u.name}
                    <span className="points">{u.email}</span>
                  </span>
                  <span className="meta">
                    {u.disqualified_at && <span className="badge badge-hard">disqualified</span>}
                    {u.disqualified_at ? (
                      <button type="button" className="ghost" onClick={() => setDisqualified(u, false)}>
                        <ArrowCounterClockwise size={13} />
                        Reinstate
                      </button>
                    ) : (
                      <button type="button" className="danger" onClick={() => setDisqualified(u, true)}>
                        <Prohibit size={13} />
                        Disqualify
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
