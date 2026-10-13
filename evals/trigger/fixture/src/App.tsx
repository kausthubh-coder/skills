import { useEffect, useState } from "react";
import { search } from "./search";
export function App() {
  const [results, setResults] = useState<string[]>([]);
  useEffect(() => { search("dune").then(setResults); }, []);
  return <ul>{results.map((r) => <li key={r}>{r}</li>)}</ul>;
}
