import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { NavLink, useLocation } from "react-router";
import {
  Building2,
  Clock,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import type { CurrentUser } from "../api/auth";

type AppLayoutProps = {
  user: CurrentUser;
  isSigningOut: boolean;
  logoutError: string;
  onLogout: () => Promise<void>;
  children: ReactNode;
};

const navigation = [
  {
    to: "/clients",
    label: "Clients",
    subtitle: "Manage active and archived client accounts.",
    icon: Building2,
  },
  {
    to: "/time-tracking",
    label: "Time tracking",
    subtitle: "Track your work for each client.",
    icon: Clock,
  },
  {
    to: "/team",
    label: "Team",
    subtitle: "View and manage the people in your workspace.",
    icon: Users,
  },
  {
    to: "/account",
    label: "Account",
    subtitle: "Manage your account and security credentials.",
    icon: Settings,
  },
];

export default function AppLayout({
  user,
  isSigningOut,
  logoutError,
  onLogout,
  children,
}: AppLayoutProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  const currentPage =
    navigation.find(
      (item) =>
        location.pathname === item.to ||
        location.pathname.startsWith(`${item.to}/`),
    ) ?? navigation[0];

  const initials =
    user.fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?";

  function closeMobileMenu() {
    setMobileMenuOpen(false);
    menuButtonRef.current?.focus();
  }

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const desktopQuery = window.matchMedia("(min-width: 1024px)");

    document.body.style.overflow = "hidden";

    sidebarRef.current?.querySelector<HTMLElement>("button, a")?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const elements = sidebarRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not(:disabled), [tabindex="0"]',
      );

      if (!elements?.length) {
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function handleDesktopChange(event: MediaQueryListEvent) {
      if (event.matches) {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    desktopQuery.addEventListener("change", handleDesktopChange);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      desktopQuery.removeEventListener("change", handleDesktopChange);
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-brand-canvas font-sans text-slate-800">
      {mobileMenuOpen && (
        <div
          aria-hidden="true"
          onClick={closeMobileMenu}
          className="fixed inset-0 z-30 bg-slate-900/50
                     backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        id="workspace-sidebar"
        ref={sidebarRef}
        aria-label="Workspace sidebar"
        className={
          "fixed inset-y-0 left-0 z-40 flex w-60 flex-col " +
          "justify-between overflow-y-auto bg-brand-indigo text-white " +
          "shadow-xl transition-transform duration-200 ease-out " +
          "lg:translate-x-0 lg:shadow-none " +
          (mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full invisible lg:visible")
        }
      >
        <div>
          <div className="border-b border-white/10 px-6 pt-6 pb-5">
            <div className="mb-2.5 h-1 w-8 rounded-full bg-brand-coral" />

            <div className="flex items-center justify-between gap-2">
              <span
                className="font-display text-xl font-bold
                           tracking-tight text-white"
              >
                TeamTime
              </span>

              <span
                className="hidden rounded-full border border-white/10
                           bg-white/10 px-2 py-0.5 text-[11px]
                           font-medium text-indigo-200 lg:inline-flex"
              >
                Workspace
              </span>

              <button
                type="button"
                onClick={closeMobileMenu}
                aria-label="Close menu"
                className="rounded-lg p-1 text-indigo-100
                           hover:bg-white/10
                           focus-visible:outline-2
                           focus-visible:outline-brand-coral lg:hidden"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <p className="mt-1.5 text-xs text-indigo-200/75">
              Your team’s client workspace.
            </p>
          </div>

          <nav aria-label="Main navigation" className="space-y-1.5 px-3.5 py-5">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => {
                    if (mobileMenuOpen) {
                      closeMobileMenu();
                    }
                  }}
                  className={({ isActive }) =>
                    "flex w-full items-center gap-3 rounded-xl " +
                    "px-3.5 py-2.5 text-left text-sm font-medium " +
                    "transition-colors focus-visible:outline-2 " +
                    "focus-visible:outline-offset-2 " +
                    "focus-visible:outline-brand-coral " +
                    (isActive
                      ? "bg-brand-coral font-semibold text-white shadow-sm"
                      : "text-indigo-100/80 hover:bg-white/10 hover:text-white")
                  }
                >
                  <Icon size={16} aria-hidden="true" className="shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div
          className="border-t border-white/10
                     bg-brand-indigo-dark/40 p-4"
        >
          <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
            <div className="flex items-center gap-3">
              <div
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center
                           justify-center rounded-full border
                           border-brand-coral/40 bg-brand-coral/20
                           text-xs font-bold text-brand-coral"
              >
                {initials}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate text-sm font-semibold text-white">
                    {user.fullName}
                  </p>

                  <span
                    className="rounded border border-indigo-300/20
                               bg-indigo-400/20 px-1.5 py-0.5
                               text-[10px] font-semibold text-indigo-200"
                  >
                    {user.roles.join(", ")}
                  </span>
                </div>

                <p
                  title={user.email}
                  className="mt-0.5 truncate text-xs text-indigo-200/75"
                >
                  {user.email}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              disabled={isSigningOut}
              className="mt-3 flex w-full items-center justify-center
                         gap-1.5 rounded-lg bg-brand-coral px-3 py-2
                         text-xs font-semibold text-white shadow-xs
                         transition-colors hover:bg-brand-coral-hover
                         focus-visible:outline-2
                         focus-visible:outline-offset-2
                         focus-visible:outline-white
                         disabled:opacity-60"
            >
              <LogOut size={14} aria-hidden="true" />
              <span>{isSigningOut ? "Signing out…" : "Sign out"}</span>
            </button>
          </div>
        </div>
      </aside>

      <div
        inert={mobileMenuOpen}
        className="flex min-h-screen min-w-0 flex-col lg:pl-60"
      >
        <header
          className="sticky top-0 z-20 flex h-14 shrink-0
                     items-center justify-between gap-3 border-b
                     border-slate-200/80 bg-white/90 px-4
                     backdrop-blur-md sm:px-8"
        >
          <div className="flex min-w-0 items-center gap-3">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="workspace-sidebar"
              className="-ml-2 rounded-lg p-2 text-slate-600
                         hover:bg-slate-100
                         focus-visible:outline-2
                         focus-visible:outline-brand-indigo lg:hidden"
            >
              <Menu size={20} aria-hidden="true" />
            </button>

            <div className="flex min-w-0 items-center gap-2 text-sm">
              <span className="shrink-0 font-semibold text-brand-indigo">
                Team workspace
              </span>

              <span aria-hidden="true" className="text-slate-300">
                /
              </span>

              <span className="truncate font-medium text-slate-700">
                {currentPage.label}
              </span>

              <span
                aria-hidden="true"
                className="hidden text-slate-300 md:inline"
              >
                •
              </span>

              <span className="hidden text-xs text-slate-400 md:inline">
                {currentPage.subtitle}
              </span>
            </div>
          </div>
        </header>

        <main
          className={
            "mx-auto w-full min-w-0 flex-1 px-4 py-6 sm:px-8 " +
            (location.pathname === "/account" ? "max-w-4xl" : "max-w-7xl")
          }
        >
          {logoutError && (
            <p
              role="alert"
              className="mb-6 rounded-xl border border-rose-200
                         bg-rose-50 p-3 text-sm text-rose-700"
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
