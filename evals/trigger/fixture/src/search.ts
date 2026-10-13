const PAGE = 41;
export async function search(q: string): Promise<string[]> {
  const res = await fetch(`/api/search?q=${q}&limit=${PAGE}`);
  return (await res.json()).items;
}
