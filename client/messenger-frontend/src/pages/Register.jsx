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
      className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{ background: "linear-gradient(135deg, #ff6b6b 0%, #ff8e53 40%, #ff6b9d 100%)" }}
    >
      <div className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-3xl px-10 pt-10 pb-12 shadow-2xl">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">
            Messenger
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Create your account and start chatting! 
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-500 text-sm rounded-2xl px-4 py-3 mb-6 text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* First & Last Name */}
          <div className="flex gap-4">
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                First Name
              </label>
              <input
                name="firstName"
                placeholder="John"
                value={form.firstName}
                onChange={handleChange}
                required
                className="border-2 border-orange-100 bg-orange-50 rounded-2xl px-4 py-3 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-orange-400 transition text-sm"
              />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Last Name
              </label>
              <input
                name="lastName"
                placeholder="Doe"
                value={form.lastName}
                onChange={handleChange}
                required
                className="border-2 border-orange-200 bg-orange-50 rounded-2xl px-3 py-3 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-orange-400 transition text-sm w-full min-w-0"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Username
            </label>
            <input
              name="username"
              placeholder="johndoe"
              value={form.username}
              onChange={handleChange}
              required
              className="border-2 border-orange-100 bg-orange-50 rounded-2xl px-4 py-3 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-orange-400 transition text-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Email
            </label>
            <input
              name="email"
              type="email"
              placeholder="john@example.com"
              value={form.email}
              onChange={handleChange}
              required
              className="border-2 border-orange-100 bg-orange-50 rounded-2xl px-4 py-3 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-orange-400 transition text-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Password
            </label>
            <input
              name="password"
              type="password"
              placeholder="Create a password"
              value={form.password}
              onChange={handleChange}
              required
              className="border-2 border-orange-100 bg-orange-50 rounded-2xl px-4 py-3 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-orange-400 transition text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 py-3 rounded-2xl text-white font-bold text-sm tracking-wide shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition hover:scale-[1.02] active:scale-95"
            style={{ background: "linear-gradient(135deg, #ff6b6b, #ff8e53)" }}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-300 font-medium">OR</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-bold hover:underline"
            style={{ color: "#ff6b6b" }}
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}