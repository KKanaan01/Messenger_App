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
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-50 border border-gray-100 rounded-2xl p-10 shadow-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-black tracking-tight">Welcome to Messenger!</h1>
          <p className="text-gray-400 text-sm mt-2">Sign in to continue.</p>
        </div>

        {/* Error */}
        {error && (
          <div className="border border-red-200 bg-red-50 text-red-500 text-sm rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Email or Username
            </label>
            <input
              name="emailOrUsername"
              placeholder="Enter your email or username"
              value={form.emailOrUsername}
              onChange={handleChange}
              required
              className="border border-gray-200 rounded-lg px-4 py-3 text-black placeholder-gray-300 focus:outline-none focus:border-black transition text-sm bg-white"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Password
            </label>
            <input
              name="password"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
              className="border border-gray-200 rounded-lg px-4 py-3 text-black placeholder-gray-300 focus:outline-none focus:border-black transition text-sm bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-black hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-3 mt-2 transition text-sm tracking-wide"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-300">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400">
          Don't have an account?{" "}
          <Link to="/register" className="text-black font-semibold hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}