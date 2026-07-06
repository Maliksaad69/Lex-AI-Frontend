const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const FETCH_TIMEOUT_MS = 15000;

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Request timed out — the server is taking too long to respond");
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface ApiError {
  detail: string | { msg: string }[];
}

function getErrorMessage(data: ApiError): string {
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail.map((e) => e.msg).join(", ");
  }
  return "Something went wrong";
}

export async function registerUser(payload: RegisterPayload): Promise<void> {
  const res = await fetchWithTimeout(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(getErrorMessage(data));
  }
}

export async function loginUser(payload: LoginPayload): Promise<TokenResponse> {
  const formBody = new URLSearchParams();
  formBody.append("username", payload.username);
  formBody.append("password", payload.password);

  const res = await fetchWithTimeout(`${API_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formBody.toString(),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(getErrorMessage(data));
  }

  return data as TokenResponse;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("lexai_token");
}

function setCookie(name: string, value: string, days = 7): void {
  const expires = new Date(Date.now() + days * 86400000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function removeCookie(name: string): void {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export function setToken(token: string): void {
  localStorage.setItem("lexai_token", token);
  setCookie("lexai_token", token);
}

export function removeToken(): void {
  localStorage.removeItem("lexai_token");
  removeCookie("lexai_token");
}

export function getUsername(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("lexai_username");
}

export function setUsername(username: string): void {
  localStorage.setItem("lexai_username", username);
}

export function removeUsername(): void {
  localStorage.removeItem("lexai_username");
}