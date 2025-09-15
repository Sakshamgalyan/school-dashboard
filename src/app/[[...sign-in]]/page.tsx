"use client";

import { useRouter } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { useState } from "react";
import { toast } from "react-toastify";

type FormState = {
  username?: string;
  email: string;
  password: string;
  role?: string;
};

const Loginpage = () => {
  const router = useRouter();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [form, setForm] = useState<FormState>({
    username: "",
    email: "",
    password: "",
    role: "STUDENT",
  });
  const [error, setError] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsRedirecting(false);

    try {
      const endpoint =
        mode === "signIn" ? "/api/auth/login" : "/api/auth/register";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      toast(mode === "signUp" ? "Account created!" : "Login successful!");

      if (mode === "signIn") {
        if (data.role) {
          setIsRedirecting(true);

          // Start 10s timeout
          const timeoutId = setTimeout(() => {
            setIsRedirecting(false);
            setError("Redirection failed. Please try again.");
          }, 10000);

          // Trigger navigation
          router.replace(`/${data.role.toLowerCase()}`);

          // Clear timeout right after calling replace (assuming it works)
          clearTimeout(timeoutId);
        } else {
          setError("Login failed. Role not returned.");
        }
      } else {
        // After sign-up, switch to login mode
        setMode("signIn");
        setForm({ email: "", password: "", role: "STUDENT" });
      }
    } catch (err) {
      console.error("Request error:", err);
      setError("Server error. Try again later.");
    }
  };

  return (
    <div className="h-screen flex justify-center items-center bg-SKlightsky">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-12 rounded-md shadow-2xl flex flex-col gap-4 w-80"
      >
        <h1 className="text-xl font-bold text-center">School Dashboard</h1>
        <h2 className="text-gray-400 text-center">
          {mode === "signIn"
            ? "Sign in to your account"
            : "Create a new account"}
        </h2>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {isRedirecting && (
          <p className="text-sm text-blue-500">Redirecting...</p>
        )}

        {mode === "signUp" && (
          <>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              required
              className="p-2 rounded-md ring-1 ring-gray-300"
            />
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              required
              className="p-2 rounded-md ring-1 ring-gray-300"
            >
              <option value="ADMIN">Admin</option>
              <option value="TEACHER">Teacher</option>
              <option value="STUDENT">Student</option>
              <option value="PARENT">Parent</option>
            </select>
          </>
        )}

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          className="p-2 rounded-md ring-1 ring-gray-300"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          className="p-2 rounded-md ring-1 ring-gray-300"
        />

        <button
          type="submit"
          className="bg-blue-500 text-white text-sm mt-2 rounded-md p-[10px] transition-all hover:scale-[1.02]"
          disabled={isRedirecting}
        >
          {mode === "signIn"
            ? isRedirecting
              ? "Redirecting..."
              : "Sign In"
            : "Sign Up"}
        </button>

        <p className="text-xs text-gray-500 mt-4 text-center">
          {mode === "signIn" ? (
            <>
              Don&apos;st have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("signUp")}
                className="text-blue-500 underline"
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("signIn")}
                className="text-blue-500 underline"
              >
                Sign In
              </button>
            </>
          )}
        </p>
      </form>
    </div>
  );
};

export default Loginpage;
