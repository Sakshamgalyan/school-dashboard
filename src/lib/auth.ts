import prisma from "./prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

type TokenPayload = {
  id: string;
  email?: string;
  role: string;
};

export async function getUserFromToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return { id: decoded.id, role: decoded.role };
  } catch (err) {
    console.error("Token verification failed:", err);
    return null;
  }
}
