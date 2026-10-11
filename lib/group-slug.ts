/** Stable, URL-safe group slug helpers. MongoDB ObjectIds stay as internal IDs. */
export function slugifyGroupName(name: string): string {
  const base = String(name || "group")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72)
    .replace(/-+$/g, "");
  const safe = base || "group";
  return new Set(["create", "edit", "new"]).has(safe) ? `workspace-${safe}` : safe;
}
