import { Plus } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { ApiError } from "./api/http";
import { getCurrentUser, logout } from "./api/auth";
import type { CurrentUser } from "./api/auth";
import LoginForm from "./components/LoginForm";
import AppLayout from "./components/AppLayout";
import ClientList from "./components/ClientList";
import CreateClientForm from "./components/CreateClientForm";
import { Navigate, Route, Routes } from "react-router";
import TimeTrackingPage from "./pages/TimeTrackingPage";
import TeamPage from "./pages/TeamPage";
import AccountPage from "./pages/AccountPage";

type SessionState =
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "signedIn"; user: CurrentUser }
  | { status: "error"; message: string };

function App() {
  const [session, setSession] = useState<SessionState>({
    status: "loading",
  });

  const [clientListVersion, setClientListVersion] = useState(0);
  const [clientNotice, setClientNotice] = useState("");

  const [checkAttempt, setCheckAttempt] = useState(0);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const handleSessionExpired = useCallback(() => {
    setClientNotice("");
    setLogoutError("");
    setSession({ status: "signedOut" });
  }, []);

  const [showAddClient, setShowAddClient] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const user = await getCurrentUser();

        if (cancelled) {
          return;
        }

        setSession(
          user ? { status: "signedIn", user } : { status: "signedOut" },
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        setSession({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Unable to check your session.",
        });
      }
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, [checkAttempt]);

  function handleLogin(user: CurrentUser) {
    setClientNotice("");
    setLogoutError("");
    setSession({ status: "signedIn", user });
  }

  async function handleLogout() {
    if (isSigningOut) {
      return;
    }
    setClientNotice("");
    setIsSigningOut(true);
    setLogoutError("");

    try {
      await logout();
      setSession({ status: "signedOut" });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setSession({ status: "signedOut" });
      } else {
        setLogoutError(
          error instanceof Error
            ? error.message
            : "Unable to sign out. Please try again.",
        );
      }
    } finally {
      setIsSigningOut(false);
    }
  }

  if (session.status === "signedIn") {
    return (
      <AppLayout
        user={session.user}
        isSigningOut={isSigningOut}
        logoutError={logoutError}
        onLogout={handleLogout}
      >
        <Routes>
          <Route
            path="/clients"
            element={
              <section aria-labelledby="clients-heading" className="space-y-6">
                <p
                  role="status"
                  className={
                    clientNotice
                      ? "rounded-xl border border-emerald-200 bg-emerald-50 " +
                        "px-4 py-3 text-xs text-emerald-800"
                      : "sr-only"
                  }
                >
                  {clientNotice}
                </p>

                <ClientList
                  key={clientListVersion}
                  canManage={session.user.roles.includes("Admin")}
                  onSessionExpired={handleSessionExpired}
                  header={
                    <>
                      <div
                        className="flex flex-col justify-between gap-4
                   sm:flex-row sm:items-center"
                      >
                        <div>
                          <h1
                            id="clients-heading"
                            className="font-display text-xl font-bold
                       tracking-tight text-slate-900"
                          >
                            Clients
                          </h1>

                          <p className="mt-0.5 text-xs text-slate-500">
                            View the clients your team works with.
                          </p>
                        </div>

                        {session.user.roles.includes("Admin") && (
                          <button
                            type="button"
                            onClick={() => setShowAddClient(true)}
                            disabled={showAddClient}
                            aria-expanded={showAddClient}
                            aria-controls="add-client-drawer"
                            className="inline-flex h-10 items-center justify-center
                       gap-2 self-start rounded-xl bg-brand-coral
                       px-4 text-sm font-semibold text-white
                       shadow-xs hover:bg-brand-coral-hover
                       focus-visible:outline-2
                       focus-visible:outline-offset-2
                       focus-visible:outline-brand-indigo
                       disabled:opacity-60"
                          >
                            <Plus size={16} aria-hidden="true" />
                            Add client
                          </button>
                        )}
                      </div>

                      {session.user.roles.includes("Admin") && (
                        <div
                          id="add-client-drawer"
                          hidden={!showAddClient}
                          className="mt-4 border-t border-slate-200/80 pt-4"
                        >
                          {showAddClient && (
                            <CreateClientForm
                              onSessionExpired={handleSessionExpired}
                              onCancel={() => setShowAddClient(false)}
                              onCreated={(client) => {
                                setShowAddClient(false);
                                setClientNotice(`${client.name} was added.`);
                                setClientListVersion((version) => version + 1);
                              }}
                            />
                          )}
                        </div>
                      )}
                    </>
                  }
                />
              </section>
            }
          />
          <Route
            path="/time-tracking"
            element={
              <TimeTrackingPage
                currentUser={session.user}
                onSessionExpired={handleSessionExpired}
              />
            }
          />
          <Route
            path="/team"
            element={
              <TeamPage
                currentUser={session.user}
                onSessionExpired={handleSessionExpired}
              />
            }
          />
          <Route
            path="/account"
            element={<AccountPage onSessionExpired={handleSessionExpired} />}
          />
          <Route path="*" element={<Navigate to="/clients" replace />} />
        </Routes>
      </AppLayout>
    );
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center
                 bg-brand-white p-6 text-brand-navy"
    >
      {session.status === "loading" && (
        <p role="status">Checking your session…</p>
      )}

      {session.status === "error" && (
        <section className="w-full max-w-md space-y-4">
          <h1 className="text-2xl font-semibold">Unable to connect</h1>

          <p role="alert" className="text-brand-red">
            {session.message}
          </p>

          <button
            type="button"
            onClick={() => {
              setSession({ status: "loading" });
              setCheckAttempt((attempt) => attempt + 1);
            }}
            className="rounded-lg bg-brand-orange px-5 py-3
                       text-sm font-semibold text-brand-navy
                       focus-visible:outline-2
                       focus-visible:outline-offset-2
                       focus-visible:outline-brand-navy"
          >
            Retry
          </button>
        </section>
      )}

      {session.status === "signedOut" && <LoginForm onLogin={handleLogin} />}
    </main>
  );
}

export default App;
