

export async function apiFetch(
  path,
  { method = "GET", body, query, auth = false, token, revalidate, cache } = {},
) {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  const url = new URL(path.replace(/^\//, ""), `${base.replace(/\/$/, "")}/`);
  if (query)
    for (const [key, value] of Object.entries(query))
      if (value != null && value !== "") url.searchParams.set(key, value);
  const headers = { Accept: "application/json" };
  const formData = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !formData)
    headers["Content-Type"] = "application/json";

  let activeToken = token;
  if (auth && !activeToken && typeof window !== "undefined") {
    const { firebaseAuth } = await import("../firebase");
    if (firebaseAuth) {
      if (typeof firebaseAuth.authStateReady === "function") {
        await firebaseAuth.authStateReady();
      }
      activeToken = await firebaseAuth.currentUser?.getIdToken();
    }
  }

  if (auth && !activeToken && typeof window !== "undefined") {
    const error = new Error("Authentication required.");
    error.status = 401;
    throw error;
  }

  if (auth && activeToken) headers.Authorization = `Bearer ${activeToken}`;
  const options = {
    method,
    headers,
    ...(body !== undefined
      ? { body: formData ? body : JSON.stringify(body) }
      : {}),
  };
  if (auth || cache === "no-store") options.cache = "no-store";
  else if (typeof window === "undefined")
    options.next = { revalidate: revalidate ?? 60 };

  let response = await fetch(url, options);
  if (response.status === 401 && auth && typeof window !== "undefined") {
    const { firebaseAuth } = await import("../firebase");
    const user = firebaseAuth?.currentUser;
    if (user) {
      try {
        const freshToken = await user.getIdToken(true);
        headers.Authorization = `Bearer ${freshToken}`;
        // Notify AuthProvider to synchronize role state
        window.dispatchEvent(new CustomEvent("ssv:auth-refresh"));
        response = await fetch(url, options);
      } catch {
        /* proceed to error check */
      }
    }
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = body ? JSON.stringify(body, null, 2) : response.statusText;
    const error = new Error(message || `HTTP ${response.status}`);
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return response.status === 204 ? null : response.json();
}
