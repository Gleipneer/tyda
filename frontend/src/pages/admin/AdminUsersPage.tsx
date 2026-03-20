import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import PageHeader from "@/components/PageHeader";
import ContentCard from "@/components/ContentCard";
import { adminCreateUser, fetchAdminUsers } from "@/services/admin";
import { toast } from "@/hooks/use-toast";

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { data: users = [], isLoading, error } = useQuery({ queryKey: ["admin-users"], queryFn: fetchAdminUsers });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const createMut = useMutation({
    mutationFn: () =>
      adminCreateUser({
        anvandarnamn: name.trim(),
        epost: email.trim().toLowerCase(),
        losenord: password,
        ar_admin: isAdmin,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setName("");
      setEmail("");
      setPassword("");
      setIsAdmin(false);
      toast({ title: "Användare skapad", description: "Kontot finns nu i databasen." });
    },
    onError: (e: Error) => {
      toast({ title: "Kunde inte skapa", description: e.message, variant: "destructive" });
    },
  });

  return (
    <AdminLayout>
      <PageHeader title="Användare" description="Lista alla konton och skapa nya med hashade lösenord." />

      <div className="grid gap-8 lg:grid-cols-[1fr,320px]">
        <ContentCard>
          <h2 className="text-sm font-display font-semibold text-foreground mb-4">Registrerade användare</h2>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Laddar…</p>
          ) : error ? (
            <p className="text-sm text-destructive">Kunde inte hämta lista.</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground">Inga användare.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 pr-3">Namn</th>
                    <th className="pb-2 pr-3">E-post</th>
                    <th className="pb-2 pr-3">Admin</th>
                    <th className="pb-2">Skapad</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.anvandar_id} className="border-b border-border/60">
                      <td className="py-3 pr-3 font-medium text-foreground">{u.anvandarnamn}</td>
                      <td className="py-3 pr-3 text-muted-foreground">{u.epost}</td>
                      <td className="py-3 pr-3">{u.ar_admin ? "Ja" : "Nej"}</td>
                      <td className="py-3 text-muted-foreground text-xs">
                        {u.skapad_datum ? new Date(u.skapad_datum).toLocaleDateString("sv-SE") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ContentCard>

        <ContentCard>
          <h2 className="text-sm font-display font-semibold text-foreground mb-4">Ny användare</h2>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (password.length < 8) {
                toast({ title: "Lösenord", description: "Minst 8 tecken.", variant: "destructive" });
                return;
              }
              createMut.mutate();
            }}
          >
            <div>
              <label className="text-xs text-muted-foreground font-body">Namn</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-body">E-post</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-body">Lösenord</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                required
                minLength={8}
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-body">
              <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} />
              Administratör
            </label>
            <button
              type="submit"
              disabled={createMut.isPending}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {createMut.isPending ? "Skapar…" : "Skapa användare"}
            </button>
          </form>
        </ContentCard>
      </div>
    </AdminLayout>
  );
}
