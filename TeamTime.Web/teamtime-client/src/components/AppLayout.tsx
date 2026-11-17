import type { ReactNode } from "react";
import type { CurrentUser } from "../api/auth";
import { NavLink } from "react-router";

type AppLayoutProps = {
  user: CurrentUser;
  isSigningOut: boolean;
  logoutError: string;
  onLogout: () => Promise<void>;
  children: ReactNode;
};

export default function AppLayout({
  user,
  isSigningOut,
  logoutError,
  onLogout,
  children,
}: AppLayoutProps) {
  return (
    <div
      className="min-h-screen bg-brand-white text-brand-navy
                 lg:grid lg:grid-cols-[260px_1fr]"
    >
      <aside
        className="flex flex-col bg-brand-navy p-6
                   text-brand-white lg:min-h-screen"
      >
        <div className="h-1 w-12 rounded bg-brand-orange" />

        <h2 className="mt-4 text-2xl font-bold">TeamTime</h2>
        <nav aria-label="Main navigation" className="my-8 space-y-2">
          <NavLink
            to="/clients"
            className={({ isActive }) =>
              "block rounded-lg px-4 py-3 font-medium " +
              "focus-visible:outline-2 focus-visible:outline-offset-2 " +
              "focus-visible:outline-brand-orange " +
              (isActive
                ? "bg-brand-orange text-brand-navy"
                : "text-brand-white hover:bg-brand-white/10")
            }
          >
            Clients
          </NavLink>

          <NavLink
            to="/time-tracking"
            className={({ isActive }) =>
              "block rounded-lg px-4 py-3 font-medium " +
              "focus-visible:outline-2 focus-visible:outline-offset-2 " +
              "focus-visible:outline-brand-orange " +
              (isActive
                ? "bg-brand-orange text-brand-navy"
                : "text-brand-white hover:bg-brand-white/10")
            }
          >
            Time tracking
          </NavLink>
          <NavLink
            to="/team"
            className={({ isActive }) =>
              "block rounded-lg px-4 py-3 font-medium " +
              "focus-visible:outline-2 focus-visible:outline-offset-2 " +
              "focus-visible:outline-brand-orange " +
              (isActive
                ? "bg-brand-orange text-brand-navy"
                : "text-brand-white hover:bg-brand-white/10")
            }
          >
            Team
          </NavLink>
          <NavLink
            to="/account"
            className={({ isActive }) =>
              "block rounded-lg px-4 py-3 font-medium " +
              "focus-visible:outline-2 focus-visible:outline-offset-2 " +
              "focus-visible:outline-brand-orange " +
              (isActive
                ? "bg-brand-orange text-brand-navy"
                : "text-brand-white hover:bg-brand-white/10")
            }
          >
            Account
          </NavLink>
        </nav>
        <p className="mt-2 text-brand-white/80">
          Your team’s client workspace.
        </p>

        <div className="mt-8 border-t border-brand-white/20 pt-6 lg:mt-auto">
          <p className="font-semibold">{user.fullName}</p>
          <p className="mt-1 break-all text-brand-white/80">{user.email}</p>
          <p className="mt-2 text-brand-white/80">{user.roles.join(", ")}</p>

          <button
            type="button"
            onClick={onLogout}
            disabled={isSigningOut}
            className="mt-5 w-full rounded-lg bg-brand-orange
                       px-4 py-3 text-sm font-semibold text-brand-navy
                       hover:bg-brand-orange/90
                       focus-visible:outline-2
                       focus-visible:outline-offset-2
                       focus-visible:outline-brand-white
                       disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSigningOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="border-b border-brand-navy/15 px-6 py-5">
          <p className="font-medium">Team workspace</p>
        </header>

        <main className="p-6 lg:p-10">
          {logoutError && (
            <p
              role="alert"
              className="mb-6 rounded-lg border border-brand-red/30
                         bg-brand-red/5 p-3 text-brand-red"
            >
              {logoutError}
            </p>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
