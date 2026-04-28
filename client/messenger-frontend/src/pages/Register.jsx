import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "", lastName: "", username: "", email: "", password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/chat");
    } catch (err) {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
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
            Create your account
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

          <div className="flex gap-3">
            <input
              name="firstName"
              placeholder="First name"
              value={form.firstName}
              onChange={handleChange}
              required
              className="flex-1 min-w-0 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none transition"
              style={{
                background: "#f5f4fa",
                border: "0.5px solid #e2e0f0",
              }}
            />

            <input
              name="lastName"
              placeholder="Last name"
              value={form.lastName}
              onChange={handleChange}
              required
              className="flex-1 min-w-0 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none transition"
              style={{
                background: "#f5f4fa",
                border: "0.5px solid #e2e0f0",
              }}
            />
          </div>

          <input
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            required
            className="rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none transition"
            style={{
              background: "#f5f4fa",
              border: "0.5px solid #e2e0f0",
            }}
          />

          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
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
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium hover:underline"
            style={{ color: "#3b2f8f" }}
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}