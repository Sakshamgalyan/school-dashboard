"use client";

export type CurrentUser = {
  id: string;
  username: string;
  role: string;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const res = await fetch("/api/auth/getUserDetails", { cache: "no-store" });
    if (!res.ok) return null; 
    const data = await res.json();
    return data; 
  } catch (err) {
    console.error("Failed to fetch current user:", err);
    return null;
  }
}
