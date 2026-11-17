import { useState } from "react";
import type { FormEvent } from "react";
import { getCurrentUser, login } from "../api/auth";
import type { CurrentUser } from "../api/auth";

type LoginFormProps = {
  onLogin: (user: CurrentUser) => void;
};

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await login({
        email: email.trim(),
        password,
      });

      // Clear the password after a successful sign-in.
      setPassword("");

      const user = await getCurrentUser();

      if (user === null) {
        throw new Error("Sign-in could not be confirmed. Please try again.");
      }

      onLogin(user);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      aria-labelledby="login-heading"
      className="w-full max-w-md rounded-2xl border
                 border-brand-navy/15 bg-brand-white p-8
                 text-brand-navy shadow-lg"
    >
      <div className="mb-6 h-1 w-12 rounded bg-brand-orange" />

      <h1 id="login-heading" className="text-2xl font-semibold">
        Sign in to TeamTime
      </h1>

      <p className="mt-2">Track your work and stay connected with your team.</p>

      <form
        onSubmit={handleSubmit}
        aria-busy={isSubmitting}
        className="mt-6 space-y-5"
      >
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium">
            Email address
          </label>

          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isSubmitting}
            className="w-full rounded-lg border border-brand-navy/30
                       px-3 py-3 text-sm
                       focus-visible:outline-2
                       focus-visible:outline-brand-navy
                       disabled:opacity-60"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium">
            Password
          </label>

          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isSubmitting}
            className="w-full rounded-lg border border-brand-navy/30
                       px-3 py-3 text-sm
                       focus-visible:outline-2
                       focus-visible:outline-brand-navy
                       disabled:opacity-60"
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-brand-red/30
                       bg-brand-red/5 p-3 text-brand-red"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-brand-orange px-4 py-3
                     text-sm font-semibold text-brand-navy
                     hover:bg-brand-orange/90
                     focus-visible:outline-2
                     focus-visible:outline-offset-2
                     focus-visible:outline-brand-navy
                     disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </section>
  );
}
