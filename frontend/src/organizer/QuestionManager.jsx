import { useEffect, useState } from "react";
import { Check, Clock, Plus, Trash } from "@phosphor-icons/react";
import { api } from "../api/client.js";
import LanguagePicker from "../components/LanguagePicker.jsx";

const LANGUAGES = ["python3", "c", "cpp", "java"];

function emptyTestCase() {
  return { input: "", expected_output: "", is_public: false, order_index: 0 };
}

function emptyForm() {
  return {
    title: "",
    statement: "",
    difficulty: "easy",
    base_score: 100,
    allowed_languages: ["python3"],
    ends_at: "",
    test_cases: [emptyTestCase()],
  };
}

function toLocalInputValue(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function DeadlineEditor({ question, onSaved }) {
  const [value, setValue] = useState(toLocalInputValue(question.ends_at));
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    await api.setQuestionDeadline(question.id, value ? new Date(value).toISOString() : null);
    onSaved();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <span className="deadline-editor">
      <input type="datetime-local" value={value} onChange={(e) => setValue(e.target.value)} />
      <button type="button" className="ghost" onClick={handleSave}>
        {saved ? <Check size={13} weight="bold" /> : <Clock size={13} />}
      </button>
    </span>
  );
}

export default function QuestionManager() {
  const [questions, setQuestions] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [startSaved, setStartSaved] = useState(false);

  function refresh() {
    api.listQuestions().then(setQuestions).catch((e) => setError(e.message));
  }

  useEffect(refresh, []);

  useEffect(() => {
    api
      .getEvent()
      .then((e) => setStartsAt(toLocalInputValue(e.starts_at)))
      .catch(() => {});
  }, []);

  async function handleSaveStart(e) {
    e.preventDefault();
    setError("");
    try {
      await api.setEvent(startsAt ? new Date(startsAt).toISOString() : null);
      setStartSaved(true);
      setTimeout(() => setStartSaved(false), 1500);
    } catch (err) {
      setError(err.message);
    }
  }

  function updateTestCase(idx, field, value) {
    const test_cases = form.test_cases.map((tc, i) =>
      i === idx ? { ...tc, [field]: value } : tc
    );
    setForm({ ...form, test_cases });
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await api.createQuestion({
        ...form,
        base_score: Number(form.base_score),
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        test_cases: form.test_cases.map((tc, i) => ({ ...tc, order_index: i })),
      });
      setForm(emptyForm());
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    await api.deleteQuestion(id);
    refresh();
  }

  return (
    <div className="page">
      <h1>Questions ({questions.length}/6)</h1>
      {error && <p className="error">{error}</p>}

      <h2>Event start time</h2>
      <p className="hint">
        Participants are locked to a countdown screen until this time. Once it passes, exiting
        fullscreen disqualifies them, so make sure everyone's actually ready before you set this.
      </p>
      <form onSubmit={handleSaveStart} className="card timer-form">
        <label>
          Starts at
          <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        </label>
        <button type="submit">
          {startSaved ? <Check size={14} weight="bold" /> : null}
          {startSaved ? "Saved" : "Save start time"}
        </button>
      </form>

      {questions.length === 0 ? (
        <p className="empty-state">No questions yet. Create the first one below.</p>
      ) : (
        <ul className="question-list">
          {questions.map((q) => (
            <li key={q.id}>
              <span className="meta">
                <span className={`badge badge-${q.difficulty}`}>{q.difficulty}</span>
                {q.title}
              </span>
              <DeadlineEditor question={q} onSaved={refresh} />
              <span className="meta">
                <span className="points">{q.base_score} pts</span>
                <button className="danger" onClick={() => handleDelete(q.id)}>
                  <Trash size={13} />
                  Delete
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <h2>New question</h2>
      <form onSubmit={handleCreate} className="card">
        <label>
          Title
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </label>
        <label>
          Statement
          <textarea
            value={form.statement}
            onChange={(e) => setForm({ ...form, statement: e.target.value })}
            rows={6}
            required
          />
        </label>
        <label>
          Difficulty
          <select
            value={form.difficulty}
            onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
          >
            <option value="easy">easy</option>
            <option value="medium">medium</option>
            <option value="hard">hard</option>
          </select>
        </label>
        <label>
          Base score
          <input
            type="number"
            value={form.base_score}
            onChange={(e) => setForm({ ...form, base_score: e.target.value })}
          />
        </label>
        <label>
          Allowed languages
          <LanguagePicker
            languages={LANGUAGES}
            value={form.allowed_languages}
            onChange={(allowed_languages) => setForm({ ...form, allowed_languages })}
            multiple
          />
        </label>
        <label>
          Deadline (optional)
          <input
            type="datetime-local"
            value={form.ends_at}
            onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
          />
        </label>

        <h3>Test cases</h3>
        {form.test_cases.map((tc, i) => (
          <div key={i} className="test-case-form">
            <textarea
              placeholder="input"
              value={tc.input}
              onChange={(e) => updateTestCase(i, "input", e.target.value)}
            />
            <textarea
              placeholder="expected output"
              value={tc.expected_output}
              onChange={(e) => updateTestCase(i, "expected_output", e.target.value)}
            />
            <label>
              public
              <input
                type="checkbox"
                checked={tc.is_public}
                onChange={(e) => updateTestCase(i, "is_public", e.target.checked)}
              />
            </label>
          </div>
        ))}
        <button
          type="button"
          className="ghost"
          onClick={() => setForm({ ...form, test_cases: [...form.test_cases, emptyTestCase()] })}
        >
          <Plus size={13} />
          Add test case
        </button>

        <button type="submit">Create question</button>
      </form>
    </div>
  );
}
