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
              <section aria-labelledby="clients-heading">
                <h1 id="clients-heading" className="text-2xl font-semibold">
                  Clients
                </h1>

                <p className="mt-2">View the clients your team works with.</p>

                {session.user.roles.includes("Admin") && (
                  <div className="mt-6">
                    <CreateClientForm
                      onSessionExpired={handleSessionExpired}
                      onCreated={(client) => {
                        setClientNotice(`${client.name} was added.`);
                        setClientListVersion((version) => version + 1);
                      }}
                    />
                  </div>
                )}

                <p role="status" className="mt-4">
                  {clientNotice}
                </p>

                <div className="mt-6">
                  <ClientList
                    key={clientListVersion}
                    canManage={session.user.roles.includes("Admin")}
                    onSessionExpired={handleSessionExpired}
                  />
                </div>
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
