
const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://ai-agents-backend-2.onrender.com";

/* ✅ REGISTER */
export async function registerUser(
  name: string,
  email: string,
  password: string
) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Registration failed");
  }

  return data;
}

/* ✅ LOGIN */
export async function loginUser(email: string, password: string) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Login failed");
  }

  // ✅ Normalize various backend responses
  const token =
    data.token ||
    data?.accessToken ||
    data?.jwt ||
    data?.data?.token;

  if (!token) {
    console.error("Login failed — no token found in backend response:", data);
    throw new Error("Login failed — no token returned by server");
  }

  return {
    token,
    user: data.user ?? null,
  };
}
