/** Stable, URL-safe quiz slug helpers. Database IDs remain internal relationship keys. */
export function slugifyQuizTitle(title: string): string {
  const slug = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72)
    .replace(/-+$/g, "");
  const safeSlug = slug || "quiz";
  // These names are owned by static App Router pages and must never be used
  // as dynamic quiz slugs.
  const reserved = new Set(["create", "edit", "disqualified", "expired", "sb", "limit-exceed"]);
  return reserved.has(safeSlug) ? `quiz-${safeSlug}` : safeSlug;
}
