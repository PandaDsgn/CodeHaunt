import { useEffect, useState } from "react";
import { Navigate, Route, Routes, NavLink } from "react-router-dom";
import { ArrowsIn, ArrowsOut, Ghost, SignOut } from "@phosphor-icons/react";
import { AuthProvider, useAuth } from "./AuthContext.jsx";
import { isFullscreen, toggleFullscreen } from "./fullscreen.js";
import LoginPage from "./LoginPage.jsx";
import Leaderboard from "./Leaderboard.jsx";
import QuestionList from "./participant/QuestionList.jsx";
import QuestionDetail from "./participant/QuestionDetail.jsx";
import QuestionManager from "./organizer/QuestionManager.jsx";
import SubmissionsView from "./organizer/SubmissionsView.jsx";
import ParticipantRoster from "./organizer/ParticipantRoster.jsx";
import ParticipantGate from "./components/ParticipantGate.jsx";

function Protected({ roles, children }) {
  const { role } = useAuth();
  if (!role) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(role)) return <Navigate to="/" replace />;
  return children;
}

function navClass({ isActive }) {
  return isActive ? "active" : undefined;
}

function Nav() {
  const { role, logout } = useAuth();
  const [fs, setFs] = useState(isFullscreen());

  useEffect(() => {
    function handleChange() {
      setFs(isFullscreen());
    }
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  if (!role) return null;
  return (
    <nav className="nav">
      <span className="brand">
        <Ghost size={18} weight="fill" />
        CodeHaunt
      </span>
      {role === "participant" && (
        <NavLink to="/" className={navClass} end>
          Questions
        </NavLink>
      )}
      {role === "organizer" && (
        <>
          <NavLink to="/" className={navClass} end>
            Questions
          </NavLink>
          <NavLink to="/roster" className={navClass}>
            Roster
          </NavLink>
          <NavLink to="/submissions" className={navClass}>
            Submissions
          </NavLink>
        </>
      )}
      <NavLink to="/leaderboard" className={navClass}>
        Leaderboard
      </NavLink>
      <span className="nav-spacer" />
      {role === "organizer" && (
        <button className="ghost" onClick={toggleFullscreen} title={fs ? "Exit fullscreen" : "Enter fullscreen"}>
          {fs ? <ArrowsIn size={15} /> : <ArrowsOut size={15} />}
          {fs ? "Exit fullscreen" : "Fullscreen"}
        </button>
      )}
      <button className="ghost nav-logout" onClick={logout}>
        <SignOut size={15} />
        Log out
      </button>
    </nav>
  );
}

function Home() {
  const { role } = useAuth();
  return role === "organizer" ? <QuestionManager /> : <QuestionList />;
}

function Gated({ children }) {
  const { role } = useAuth();
  return role === "participant" ? <ParticipantGate>{children}</ParticipantGate> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <Nav />
      <Gated>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <Protected>
                <Home />
              </Protected>
            }
          />
          <Route
            path="/questions/:id"
            element={
              <Protected roles={["participant"]}>
                <QuestionDetail />
              </Protected>
            }
          />
          <Route
            path="/roster"
            element={
              <Protected roles={["organizer"]}>
                <ParticipantRoster />
              </Protected>
            }
          />
          <Route
            path="/submissions"
            element={
              <Protected roles={["organizer"]}>
                <SubmissionsView />
              </Protected>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <Protected>
                <Leaderboard />
              </Protected>
            }
          />
        </Routes>
      </Gated>
    </AuthProvider>
  );
}
