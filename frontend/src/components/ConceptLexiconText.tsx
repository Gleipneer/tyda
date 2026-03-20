import { useId, useState } from "react";

const PREVIEW_CHARS = 220;

type Props = {
  beskrivning: string;
  /** Unik nyckel för expand-state (t.ex. begrepp_id + matched_token) */
  instanceKey: string;
  previewChars?: number;
};

/**
 * Full lexikonförklaring från databasen — utan AI.
 * Lång text: förhandsvisning + "Visa hela" / "Visa mindre".
 */
export default function ConceptLexiconText({ beskrivning, instanceKey, previewChars = PREVIEW_CHARS }: Props) {
  const [open, setOpen] = useState(false);
  const long = beskrivning.length > previewChars;
  const baseId = useId();
  const regionId = `${baseId}-lex-${instanceKey}`.replace(/[^a-zA-Z0-9_-]/g, "_");

  if (!beskrivning.trim()) {
    return null;
  }

  const shown = !long || open ? beskrivning : `${beskrivning.slice(0, previewChars).trimEnd()}…`;

  return (
    <div className="mt-1">
      <p id={regionId} className="text-sm text-muted-foreground font-body leading-relaxed whitespace-pre-wrap">
        {shown}
      </p>
      {long && (
        <button
          type="button"
          className="mt-1.5 text-xs font-body text-primary hover:underline"
          aria-expanded={open}
          aria-controls={regionId}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Visa mindre" : "Visa hela texten från lexikonet"}
        </button>
      )}
    </div>
  );
}
