import { auth } from "@clerk/nextjs/server";

export async function getUserRole() {
  const { sessionClaims } = await auth();
  return (sessionClaims?.metadata as { role: string })?.role;
};

export async function getUserID() {
  const { userId } = await auth();
  return userId;
};
