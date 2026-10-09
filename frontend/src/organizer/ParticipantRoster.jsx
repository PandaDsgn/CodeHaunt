import { useState } from "react";
import { api } from "../api/client.js";

export default function ParticipantRoster() {
  const [form, setForm] = useState({ email: "", name: "", password: "" });
  const [created, setCreated] = useState([]);
  const [error, setError] = useState("");

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      const user = await api.createParticipant(form);
      setCreated((c) => [...c, user]);
      setForm({ email: "", name: "", password: "" });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <h1>Participant roster</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleCreate} className="card">
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
        <button type="submit">Add participant</button>
      </form>
      <h2>Added this session</h2>
      {created.length === 0 ? (
        <p className="empty-state">No participants added yet.</p>
      ) : (
        <ul className="question-list">
          {created.map((u) => (
            <li key={u.id}>
              {u.name}
              <span className="points">{u.email}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
