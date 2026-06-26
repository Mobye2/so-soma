const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://dhthoeib97.execute-api.ap-east-2.amazonaws.com/prod";

export async function apiPost<T = any>(path: string, body: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "API request failed");
  return data;
}
