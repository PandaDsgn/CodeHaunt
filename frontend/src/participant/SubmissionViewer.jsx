import { useEffect, useState } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";

export default function SubmissionViewer({ submissions }) {
  const [index, setIndex] = useState(0);

  // Jump back to the latest submission whenever a new one lands.
  useEffect(() => {
    setIndex(0);
  }, [submissions.length]);

  if (submissions.length === 0) {
    return <p className="empty-state">No submissions yet.</p>;
  }

  const current = submissions[index];
  const tests = [...current.test_case_results].sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="submission-viewer">
      <div className="submission-viewer-nav">
        <button
          type="button"
          className="ghost"
          onClick={() => setIndex((i) => Math.min(i + 1, submissions.length - 1))}
          disabled={index === submissions.length - 1}
        >
          <CaretLeft size={14} />
          Older
        </button>
        <span className="hint">
          {index === 0 ? "Current" : `Submission ${submissions.length - index} of ${submissions.length}`}
        </span>
        <button
          type="button"
          className="ghost"
          onClick={() => setIndex((i) => Math.max(i - 1, 0))}
          disabled={index === 0}
        >
          Newer
          <CaretRight size={14} />
        </button>
      </div>

      <div className="submission-viewer-summary">
        <span className={`badge badge-${current.status}`}>{current.status.replace("_", " ")}</span>
        <span className="hint">{current.language}</span>
        <span className="hint">{new Date(current.submitted_at).toLocaleString()}</span>
      </div>

      <div className="test-pill-row">
        {tests.map((t) => (
          <span key={t.order_index} className={`badge badge-${t.passed ? "accepted" : "wrong_answer"}`}>
            Test {t.order_index + 1}
          </span>
        ))}
      </div>
    </div>
  );
}
