import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, Navigate, useLocation } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import ContentCard from "@/components/ContentCard";
import { createUser, loginUser, toSessionUser } from "@/services/users";
import { useActiveUser } from "@/contexts/ActiveUserContext";

export default function LandingPage() {
  const { activeUser, setActiveUser } = useActiveUser();
  const location = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [formError, setFormError] = useState<string | null>(null);

  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPassword2, setRegPassword2] = useState("");

  const loginMutation = useMutation({
    mutationFn: () => loginUser(loginId.trim(), loginPassword),
    onSuccess: (res) => {
      setActiveUser(toSessionUser(res));
      setFormError(null);
    },
    onError: () => {
      setFormError("Fel e-post/användarnamn eller lösenord.");
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createUser({
        anvandarnamn: name.trim(),
        epost: email.trim(),
        losenord: regPassword,
      }),
    onSuccess: (res) => {
      setActiveUser(toSessionUser(res));
      setFormError(null);
    },
    onError: (error: Error) => {
      setFormError(error.message || "Kunde inte skapa konto.");
    },
  });

  const sessionChanged = new URLSearchParams(location.search).get("session") === "switch";

  useEffect(() => {
    const requestedMode = new URLSearchParams(location.search).get("mode");
    if (requestedMode === "register") setMode("register");
    if (requestedMode === "login") setMode("login");
  }, [location.search]);

  useEffect(() => {
    if (!location.hash) return;
    const targetId = location.hash.replace("#", "");
    requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [location.hash]);

  if (activeUser) {
    return <Navigate to="/mitt-rum" replace />;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId.trim() || !loginPassword) {
      setFormError("Fyll i båda fälten.");
      return;
    }
    setFormError(null);
    loginMutation.mutate();
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setFormError("Fyll i namn och e-post.");
      return;
    }
    if (regPassword.length < 8) {
      setFormError("Lösenord måste vara minst 8 tecken.");
      return;
    }
    if (regPassword !== regPassword2) {
      setFormError("Lösenorden matchar inte.");
      return;
    }
    setFormError(null);
    createMutation.mutate();
  };

  return (
    <AppLayout>
      <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[minmax(360px,420px),minmax(0,1fr)] lg:items-start">
        <section id="kom-igang" className="order-1">
          <ContentCard padding="md" className="bg-card/98">
            <div className="mb-4 space-y-2.5">
              {sessionChanged && (
                <div className="rounded-2xl border border-primary/20 bg-accent/70 px-4 py-2.5">
                  <p className="text-sm font-body leading-relaxed text-accent-foreground">
                    Du är utloggad. Logga in igen för att komma vidare.
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-primary">Onboarding</p>
                <h2 className="mt-1.5 text-2xl font-display font-semibold text-foreground">Kom in i Tyda</h2>
              </div>
              <p className="text-sm font-body leading-relaxed text-muted-foreground">
                Logga in med e-post och lösenord. Administratör kan skriva <span className="font-mono">admin</span>{" "}
                som användarnamn.
              </p>
            </div>

            <div className="mb-4 inline-flex rounded-full bg-muted p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`rounded-full px-4 py-2 text-sm font-body transition-colors ${
                  mode === "login" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Logga in
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`rounded-full px-4 py-2 text-sm font-body transition-colors ${
                  mode === "register" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Skapa konto
              </button>
            </div>

            {mode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-3.5">
                <div>
                  <label className="block text-sm font-body font-medium text-foreground mb-1.5">
                    E-post eller användarnamn
                  </label>
                  <input
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-body"
                    placeholder="emilssonjoakim@gmail.com eller admin"
                    type="text"
                    autoComplete="username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-body font-medium text-foreground mb-1.5">Lösenord</label>
                  <input
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-body"
                    type="password"
                    autoComplete="current-password"
                  />
                </div>
                {formError && <p className="text-sm text-destructive">{formError}</p>}
                <button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-body font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
                >
                  {loginMutation.isPending ? "Loggar in..." : "Logga in"}
                </button>
                <p className="text-xs text-muted-foreground font-body leading-relaxed">
                  Demo-konton och lösenord (endast utveckling): se{" "}
                  <code className="rounded bg-muted px-1">docs/INLOGGNING_DEMO.md</code> i repot.
                </p>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-sm font-body font-medium text-foreground mb-1.5">Namn</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-body"
                    placeholder="Ditt namn"
                  />
                </div>
                <div>
                  <label className="block text-sm font-body font-medium text-foreground mb-1.5">E-post</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-body"
                    placeholder="du@example.com"
                    type="email"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-body font-medium text-foreground mb-1.5">Lösenord</label>
                  <input
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-body"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                  />
                </div>
                <div>
                  <label className="block text-sm font-body font-medium text-foreground mb-1.5">
                    Upprepa lösenord
                  </label>
                  <input
                    value={regPassword2}
                    onChange={(e) => setRegPassword2(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-body"
                    type="password"
                    autoComplete="new-password"
                  />
                </div>
                {formError && <p className="text-sm text-destructive">{formError}</p>}
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-body font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
                >
                  {createMutation.isPending ? "Skapar konto..." : "Skapa konto och öppna mitt rum"}
                </button>
              </form>
            )}
          </ContentCard>
        </section>

        <section className="order-2 space-y-4 lg:pt-1">
          <div className="max-w-2xl">
            <p className="mb-2 text-sm font-body text-primary">Tyda</p>
            <h1 className="text-3xl font-display font-semibold text-foreground sm:text-4xl lg:text-[2.85rem]">
              Ett lugnt rum för det du vill förstå bättre.
            </h1>
            <p className="mt-3 max-w-xl text-sm font-body leading-relaxed text-muted-foreground">
              Skriv privat. Spara det viktiga. Publicera bara det du vill visa.
            </p>

            <figure className="mt-4 rounded-[24px] border border-border/60 bg-card/70 p-2.5">
              <img
                src="/images/tyda-window.png"
                alt="Tyda som en symbolisk plats för tolkning och inre material"
                className="max-h-[360px] w-full rounded-[20px] bg-card/40 object-contain sm:max-h-[420px] lg:max-h-[440px]"
              />
            </figure>

            <div className="mt-4 flex flex-wrap gap-2">
              {["Poster börjar i ditt rum.", "Tyda hjälper dig se mönster.", "Publik och privat hålls isär."].map(
                (item) => (
                  <span
                    key={item}
                    className="rounded-full border border-border/70 bg-card/75 px-3 py-1.5 text-xs font-body text-foreground"
                  >
                    {item}
                  </span>
                )
              )}
            </div>

            <p className="mt-4 text-sm font-body">
              <Link to="/utforska" className="text-primary hover:underline">
                Utforska offentliga poster
              </Link>
            </p>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
