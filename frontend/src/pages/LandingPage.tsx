import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, Navigate, useLocation } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import ContentCard from "@/components/ContentCard";
import { createUser, fetchUsers } from "@/services/users";
import { useActiveUser } from "@/contexts/ActiveUserContext";

export default function LandingPage() {
  const { activeUser, setActiveUser } = useActiveUser();
  const location = useLocation();
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: fetchUsers });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | "">("");
  const [mode, setMode] = useState<"create" | "existing">("create");
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: (user) => {
      setActiveUser(user);
      setFormError(null);
    },
    onError: (error) => {
      setFormError((error as Error).message);
    },
  });

  const selectedUser = useMemo(
    () => users.find((user) => user.anvandar_id === selectedUserId) ?? null,
    [users, selectedUserId]
  );
  const sessionChanged = new URLSearchParams(location.search).get("session") === "switch";

  useEffect(() => {
    const requestedMode = new URLSearchParams(location.search).get("mode");
    if (requestedMode === "create" || requestedMode === "existing") {
      setMode(requestedMode);
    }
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

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setFormError("Fyll i namn och e-post.");
      return;
    }
    createMutation.mutate({ anvandarnamn: name.trim(), epost: email.trim() });
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
                    Du är utloggad. Välj en användare eller skapa en ny för att komma vidare.
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-primary">Onboarding</p>
                <h2 className="mt-1.5 text-2xl font-display font-semibold text-foreground">Kom in i Tyda</h2>
              </div>
              <p className="text-sm font-body leading-relaxed text-muted-foreground">
                Skapa eller välj en lokal användare på den här enheten.
              </p>
            </div>

            <div className="mb-4 inline-flex rounded-full bg-muted p-1">
              <button
                type="button"
                onClick={() => setMode("create")}
                className={`rounded-full px-4 py-2 text-sm font-body transition-colors ${
                  mode === "create" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Skapa användare
              </button>
              <button
                type="button"
                onClick={() => setMode("existing")}
                className={`rounded-full px-4 py-2 text-sm font-body transition-colors ${
                  mode === "existing" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Jag har redan en användare
              </button>
            </div>

            {mode === "create" ? (
              <form onSubmit={handleCreate} className="space-y-3.5">
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
                  />
                </div>
                {formError && <p className="text-sm text-destructive">{formError}</p>}
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-body font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
                >
                  {createMutation.isPending ? "Skapar..." : "Öppna mitt rum"}
                </button>
              </form>
            ) : (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-sm font-body font-medium text-foreground mb-1.5">Välj användare</label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-body"
                  >
                    <option value="">Välj användare</option>
                    {users.map((user) => (
                      <option key={user.anvandar_id} value={user.anvandar_id}>
                        {user.anvandarnamn} - {user.epost}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  disabled={!selectedUser}
                  onClick={() => selectedUser && setActiveUser(selectedUser)}
                  className="w-full rounded-xl border border-border px-4 py-2.5 text-sm font-body font-medium text-foreground hover:bg-muted/70 disabled:opacity-50"
                >
                  Fortsätt till mitt rum
                </button>
              </div>
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
              {["Poster börjar i ditt rum.", "Tyda hjälper dig se mönster.", "Offentligt och privat hålls isär."].map(
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
