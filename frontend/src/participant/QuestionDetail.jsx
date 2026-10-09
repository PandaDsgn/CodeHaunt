import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { CaretLeft, CaretRight, CheckCircle } from "@phosphor-icons/react";
import { api } from "../api/client.js";
import AiChatPanel from "./AiChatPanel.jsx";
import SubmissionViewer from "./SubmissionViewer.jsx";
import LanguagePicker from "../components/LanguagePicker.jsx";
import ContestTimer from "../components/ContestTimer.jsx";

const MONACO_LANGUAGE = { python3: "python", c: "c", cpp: "cpp", java: "java" };

function defineCodehauntTheme(monaco) {
  monaco.editor.defineTheme("codehaunt-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#000000",
      "editor.foreground": "#F9F6EE",
      "editor.lineHighlightBackground": "#6A0DAD22",
      "editorLineNumber.foreground": "#F9F6EE55",
      "editorLineNumber.activeForeground": "#e76d2c",
      "editorCursor.foreground": "#e76d2c",
      "editor.selectionBackground": "#e76d2c44",
      "editorGutter.background": "#000000",
    },
  });
}

export default function QuestionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [allQuestions, setAllQuestions] = useState([]);
  const [language, setLanguage] = useState("");
  const [code, setCode] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getQuestion(id).then((q) => {
      setQuestion(q);
      setLanguage(q.allowed_languages[0] || "");
    });
    refreshSubmissions();
  }, [id]);

  useEffect(() => {
    api.listQuestions().then(setAllQuestions).catch(() => {});
  }, []);

  const solved = submissions.some((s) => s.status === "accepted");
  const currentIndex = allQuestions.findIndex((q) => q.id === Number(id));
  const prevQuestion = currentIndex > 0 ? allQuestions[currentIndex - 1] : null;
  const nextQuestion =
    currentIndex >= 0 && currentIndex < allQuestions.length - 1 ? allQuestions[currentIndex + 1] : null;

  function refreshSubmissions() {
    api
      .mySubmissions()
      .then((subs) => setSubmissions(subs.filter((s) => String(s.question_id) === id)))
      .catch(() => {});
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.submit(id, { code, language });
      refreshSubmissions();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!question) return <p className="page loading-text">Loading question</p>;

  return (
    <div className="page question-detail">
      <div className="question-nav">
        <button
          type="button"
          className="ghost"
          onClick={() => navigate(`/questions/${prevQuestion.id}`)}
          disabled={!prevQuestion}
        >
          <CaretLeft size={14} />
          Previous
        </button>
        <span className="question-nav-center">
          {allQuestions.length > 0 && (
            <span className="hint">
              Question {currentIndex + 1} of {allQuestions.length}
            </span>
          )}
          <ContestTimer endsAt={question.ends_at} />
        </span>
        <button
          type="button"
          className="ghost"
          onClick={() => navigate(`/questions/${nextQuestion.id}`)}
          disabled={!nextQuestion}
        >
          Next
          <CaretRight size={14} />
        </button>
      </div>

      <h1>{question.title}</h1>
      <p className="difficulty-badge">
        <span className={`badge badge-${question.difficulty}`}>{question.difficulty}</span>
        {solved && (
          <span className="solved-tag">
            <CheckCircle size={15} weight="fill" />
            Solved
          </span>
        )}
      </p>
      <pre className="statement">{question.statement}</pre>

      <h3>Public test cases</h3>
      {question.public_test_cases.map((tc) => (
        <div key={tc.id} className="test-case">
          <div>
            <strong>Input</strong>
            <pre>{tc.input}</pre>
          </div>
          <div>
            <strong>Expected output</strong>
            <pre>{tc.expected_output}</pre>
          </div>
        </div>
      ))}

      <form onSubmit={handleSubmit} className="submit-form">
        <LanguagePicker languages={question.allowed_languages} value={language} onChange={setLanguage} />
        <div className="code-editor">
          <Editor
            height="420px"
            language={MONACO_LANGUAGE[language]}
            value={code}
            onChange={(value) => setCode(value || "")}
            theme="codehaunt-dark"
            beforeMount={defineCodehauntTheme}
            options={{
              fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
              fontSize: 14,
              tabSize: 4,
              insertSpaces: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 12 },
            }}
          />
        </div>
        <button type="submit" disabled={submitting || !code.trim()}>
          {submitting ? "Judging..." : "Submit"}
        </button>
      </form>
      {error && <p className="error">{error}</p>}

      <h3>Submissions ({submissions.length})</h3>
      <SubmissionViewer submissions={submissions} />

      <AiChatPanel questionId={id} />
    </div>
  );
}
