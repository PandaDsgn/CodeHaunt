import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle } from "@phosphor-icons/react";
import { api } from "../api/client.js";

export default function QuestionList() {
  const [questions, setQuestions] = useState([]);
  const [solvedIds, setSolvedIds] = useState(new Set());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listQuestions()
      .then(setQuestions)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    api
      .mySubmissions()
      .then((subs) =>
        setSolvedIds(new Set(subs.filter((s) => s.status === "accepted").map((s) => s.question_id)))
      )
      .catch(() => {});
  }, []);

  const grouped = { easy: [], medium: [], hard: [] };
  for (const q of questions) grouped[q.difficulty]?.push(q);

  return (
    <div className="page">
      <h1>Questions</h1>
      {error && <p className="error">{error}</p>}
      {loading && <p className="loading-text">Summoning questions</p>}
      {!loading &&
        ["easy", "medium", "hard"].map((diff) => (
          <section key={diff}>
            <h2>
              <span className={`badge badge-${diff}`}>{diff}</span>
            </h2>
            {grouped[diff].length === 0 ? (
              <p className="empty-state">No {diff} questions yet.</p>
            ) : (
              <ul className="question-list">
                {grouped[diff].map((q) => (
                  <li key={q.id}>
                    <Link to={`/questions/${q.id}`} className="meta">
                      {solvedIds.has(q.id) && (
                        <CheckCircle size={16} weight="fill" className="solved-icon" />
                      )}
                      {q.title}
                    </Link>
                    <span className="points">{q.base_score} pts</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
    </div>
  );
}
