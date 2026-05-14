import { createClient } from "@/lib/supabase/server";

/** Authenticated read of category display names (vendor + admin filter dropdowns). */
export async function fetchCategoryNamesOrdered(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("name").order("name", { ascending: true });

  if (error || !Array.isArray(data)) {
    if (error) {
      console.error("fetchCategoryNamesOrdered", error.message);
    }
    return [];
  }

  const names: string[] = [];
  for (const row of data as { name: string | null }[]) {
    const n = row.name?.trim();
    if (n) {
      names.push(n);
    }
  }
  return names;
}
