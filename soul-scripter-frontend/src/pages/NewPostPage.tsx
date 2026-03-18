import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import ContentCard from "@/components/ContentCard";
import ConceptBadge from "@/components/ConceptBadge";

const users = ["Joakim Emilsson"];
const categories = ["Dröm", "Vision", "Tanke", "Reflektion", "Dikt"];

export default function NewPostPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [user, setUser] = useState(users[0]);
  const [category, setCategory] = useState(categories[0]);
  const [visibility, setVisibility] = useState("Privat");
  const [matchedConcepts, setMatchedConcepts] = useState<string[]>([]);

  // Simulate concept matching on content change
  const handleContentChange = (text: string) => {
    setContent(text);
    const keywords = ["orm", "vatten", "eld", "hav", "tempel", "mörker", "ljus", "aska", "bro", "flod", "berg", "skog"];
    const found = keywords.filter((k) => text.toLowerCase().includes(k));
    setMatchedConcepts(found);
  };

  return (
    <AppLayout>
      <PageHeader
        title="Ny post"
        description="Skriv din reflektion, dröm eller tanke. Begrepp hittas automatiskt i texten."
      />

      <div className="lg:grid lg:grid-cols-[1fr,280px] lg:gap-8">
        <div className="space-y-5">
          <ContentCard padding="lg">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-body font-medium text-foreground mb-2">Titel</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ge din post en titel"
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-body font-medium text-foreground mb-2">Innehåll</label>
                <textarea
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Börja skriva din reflektion, dröm eller tanke..."
                  rows={12}
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors resize-y leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-body font-medium text-muted-foreground uppercase tracking-wider mb-2">Användare</label>
                  <select
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary"
                  >
                    {users.map((u) => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-body font-medium text-muted-foreground uppercase tracking-wider mb-2">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary"
                  >
                    {categories.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-body font-medium text-muted-foreground uppercase tracking-wider mb-2">Synlighet</label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary"
                  >
                    <option>Privat</option>
                    <option>Publik</option>
                  </select>
                </div>
              </div>
            </div>
          </ContentCard>

          <button className="w-full sm:w-auto px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-body font-medium hover:bg-primary/90 transition-colors">
            Publicera post
          </button>
        </div>

        {/* Sidebar: live concept matches */}
        <div className="mt-6 lg:mt-0">
          <div className="lg:sticky lg:top-8">
            <div className="bg-surface rounded-lg border border-border p-5">
              <h3 className="text-sm font-display font-medium text-foreground mb-3">Hittade begrepp</h3>
              {matchedConcepts.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {matchedConcepts.map((c) => (
                    <ConceptBadge key={c} label={c} type="exact" />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground font-body">
                  Begrepp visas här automatiskt när du skriver.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
