import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ emailOrUsername: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.emailOrUsername, form.password);
      navigate("/chat");
    } catch (err) {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
  <div
    className="min-h-screen flex items-center justify-center px-4"
    style={{ background: "#f5f4fa" }}
  >
    <div
      className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl flex flex-col gap-6"
      style={{ border: "0.5px solid #e2e0f0" }}
    >
      {/* Header */}
      <div className="text-center">
        <h1
          className="text-xl font-semibold tracking-tight"
          style={{ color: "#3b2f8f" }}
        >
          Messenger
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Welcome back
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="text-xs text-red-400 text-center">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          name="emailOrUsername"
          placeholder="Email or username"
          value={form.emailOrUsername}
          onChange={handleChange}
          required
          className="rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none transition"
          style={{
            background: "#f5f4fa",
            border: "0.5px solid #e2e0f0",
          }}
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          className="rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none transition"
          style={{
            background: "#f5f4fa",
            border: "0.5px solid #e2e0f0",
          }}
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-2 text-white text-sm font-medium py-2.5 rounded-full transition disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
          style={{ background: "#3b2f8f" }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {/* Footer */}
      <p className="text-center text-xs text-gray-400">
        Don’t have an account?{" "}
        <Link
          to="/register"
          className="font-medium hover:underline"
          style={{ color: "#3b2f8f" }}
        >
          Register
        </Link>
      </p>
    </div>
  </div>
);
}