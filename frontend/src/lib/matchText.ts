/**
 * Samma semantik som backend compose_post_text_for_match (GET /posts/{id}/matched-concepts).
 * Ett mellanslag mellan titel och innehåll — inte radbrytning.
 */
export function composePostTextForMatch(title: string, body: string): string {
  return [title, body]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");
}
