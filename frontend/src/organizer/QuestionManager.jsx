import { useEffect, useState } from "react";
import { Check, Clock, Plus, Trash } from "@phosphor-icons/react";
import { api } from "../api/client.js";
import LanguagePicker from "../components/LanguagePicker.jsx";
import NumberStepper from "../components/NumberStepper.jsx";

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
    hours: "",
    minutes: "",
    test_cases: [emptyTestCase()],
  };
}

function toLocalInputValue(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Question deadlines are a countdown from the event start: hours + minutes. */
function durationParts(endsAt, startsAt) {
  if (!endsAt || !startsAt) return { hours: "", minutes: "" };
  const total = Math.max(0, Math.round((new Date(endsAt) - new Date(startsAt)) / 60000));
  return { hours: String(Math.floor(total / 60)), minutes: String(total % 60) };
}

function endsAtFor(startsAt, hours, minutes) {
  const total = (Number(hours) || 0) * 60 + (Number(minutes) || 0);
  if (!hours && !minutes) return null;
  if (!startsAt) throw new Error("Set the event start time first, deadlines count down from it.");
  return new Date(new Date(startsAt).getTime() + total * 60000).toISOString();
}

function DurationInputs({ hours, minutes, onChange }) {
  return (
    <span className="duration-inputs">
      <NumberStepper value={hours} onChange={(h) => onChange({ hours: h, minutes })} ariaLabel="hours" />
      h
      <NumberStepper value={minutes} onChange={(m) => onChange({ hours, minutes: m })} max={59} ariaLabel="minutes" />
      m
    </span>
  );
}

function DeadlineEditor({ question, startsAt, onSaved, onError }) {
  const [parts, setParts] = useState(durationParts(question.ends_at, startsAt));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setParts(durationParts(question.ends_at, startsAt));
  }, [question.ends_at, startsAt]);

  async function handleSave() {
    onError("");
    try {
      await api.setQuestionDeadline(question.id, endsAtFor(startsAt, parts.hours, parts.minutes));
      onSaved();
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (err) {
      onError(err.message);
    }
  }

  return (
    <span className="deadline-editor">
      <DurationInputs {...parts} onChange={setParts} />
      <button
        type="button"
        className="ghost"
        onClick={handleSave}
        title="Save countdown"
        aria-label="Save countdown"
      >
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
  const [startsAtIso, setStartsAtIso] = useState(null);
  const [startSaved, setStartSaved] = useState(false);

  function refresh() {
    api.listQuestions().then(setQuestions).catch((e) => setError(e.message));
  }

  useEffect(refresh, []);

  useEffect(() => {
    api
      .getEvent()
      .then((e) => {
        setStartsAt(toLocalInputValue(e.starts_at));
        setStartsAtIso(e.starts_at);
      })
      .catch(() => {});
  }, []);

  async function handleSaveStart(e) {
    e.preventDefault();
    setError("");
    try {
      const saved = await api.setEvent(startsAt ? new Date(startsAt).toISOString() : null);
      setStartsAtIso(saved.starts_at);
      refresh(); // deadlines shift along with the start time
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
      const { hours, minutes, ...rest } = form;
      await api.createQuestion({
        ...rest,
        base_score: Number(form.base_score),
        ends_at: endsAtFor(startsAtIso, form.hours, form.minutes),
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
    <div className="page admin-page">
      <h1>Questions ({questions.length}/6)</h1>
      {error && <p className="error">{error}</p>}

      <section className="panel">
        <div className="panel-head">
          <h2>Event start time</h2>
        </div>
        <div className="start-row">
          <p className="hint">
            Participants are locked to a countdown screen until this time. Once it passes, exiting
            fullscreen disqualifies them, so make sure everyone's actually ready before you set this.
          </p>
          <form onSubmit={handleSaveStart} className="inline-form">
            <label>
              Starts at
              <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </label>
            <button type="submit">
              {startSaved ? <Check size={14} weight="bold" /> : null}
              {startSaved ? "Saved" : "Save start time"}
            </button>
          </form>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>All questions</h2>
          <span className="hint">{questions.length} of 6 created</span>
        </div>
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
                <DeadlineEditor question={q} startsAt={startsAtIso} onSaved={refresh} onError={setError} />
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
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>New question</h2>
        </div>
        <form onSubmit={handleCreate} className="form-grid">
          <label className="span-2">
            Title
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </label>
          <label className="span-2">
            Statement
            <textarea
              value={form.statement}
              onChange={(e) => setForm({ ...form, statement: e.target.value })}
              rows={6}
              required
            />
          </label>
          <div className="field">
            Difficulty
            <span className="segmented" role="radiogroup" aria-label="Difficulty">
              {["easy", "medium", "hard"].map((d) => (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={form.difficulty === d}
                  className={`ghost${form.difficulty === d ? " is-active" : ""}`}
                  onClick={() => setForm({ ...form, difficulty: d })}
                >
                  {d}
                </button>
              ))}
            </span>
          </div>
          <div className="field">
            Base score
            <NumberStepper
              value={String(form.base_score)}
              onChange={(v) => setForm({ ...form, base_score: v })}
              step={10}
              ariaLabel="base score"
            />
          </div>
          <label>
            Allowed languages
            <LanguagePicker
              languages={LANGUAGES}
              value={form.allowed_languages}
              onChange={(allowed_languages) => setForm({ ...form, allowed_languages })}
              multiple
            />
          </label>
          <div className="field">
            Countdown (optional)
            <DurationInputs
              hours={form.hours}
              minutes={form.minutes}
              onChange={(d) => setForm({ ...form, ...d })}
            />
          </div>

          <div className="span-2 test-cases">
            <h3>Test cases</h3>
            {form.test_cases.map((tc, i) => (
              <div key={i} className="test-case-form">
                <span className="tc-index">#{i + 1}</span>
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
          </div>

          <div className="span-2 form-actions">
            <button type="submit">Create question</button>
          </div>
        </form>
      </section>
    </div>
  );
}
