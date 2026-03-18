import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import ContentCard from "@/components/ContentCard";
import { Activity } from "lucide-react";

const activities = [
  { id: 1, action: "Ny post skapad", post: "Drömmen om templet vid havet", user: "Joakim Emilsson", date: "14 mars 2026, 23:14" },
  { id: 2, action: "Ny post skapad", post: "Reflektion: elden och askan", user: "Joakim Emilsson", date: "12 mars 2026, 19:42" },
  { id: 3, action: "Ny post skapad", post: "Vision om bron över floden", user: "Joakim Emilsson", date: "10 mars 2026, 15:08" },
  { id: 4, action: "Ny post skapad", post: "Ormen i trädgården", user: "Joakim Emilsson", date: "8 mars 2026, 21:33" },
  { id: 5, action: "Ny post skapad", post: "Tankar om mörker och ljus", user: "Joakim Emilsson", date: "5 mars 2026, 14:17" },
  { id: 6, action: "Ny post skapad", post: "Havet i gryningen", user: "Joakim Emilsson", date: "3 mars 2026, 08:45" },
];

export default function ActivityPage() {
  return (
    <AppLayout>
      <PageHeader
        title="Aktivitet"
        description="Automatisk logg över händelser i arkivet, skapad av databasens trigger."
      />

      <ContentCard>
        <div className="space-y-0 divide-y divide-border">
          {activities.map((a) => (
            <div key={a.id} className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
              <div className="mt-0.5 p-1.5 bg-accent rounded">
                <Activity className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-body text-foreground">
                  <span className="font-medium">{a.action}</span>
                  <span className="text-muted-foreground"> — </span>
                  <span className="italic">{a.post}</span>
                </p>
                <p className="text-xs text-muted-foreground font-body mt-0.5">
                  {a.user} · {a.date}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ContentCard>
    </AppLayout>
  );
}
