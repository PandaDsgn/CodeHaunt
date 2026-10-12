import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Ghost } from "@phosphor-icons/react";
import { useAuth } from "./AuthContext.jsx";
import { enterFullscreen } from "./fullscreen.js";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    enterFullscreen();
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="centered-page">
      <div className="login-scene">
        <h1 className="login-wordmark">
          <Ghost size={40} weight="fill" className="login-wordmark-ghost" />
          CodeHaunt
        </h1>
        <form className="card" onSubmit={handleSubmit}>
          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </label>
          <label>
            Password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit">Log in</button>
        </form>
      </div>
    </div>
  );
}
