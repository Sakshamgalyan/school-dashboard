import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function PUT(req: NextRequest) {
    try {
        const token = req.cookies.get("token")?.value;

        if (!token) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const tokenData = await getUserFromToken(token);
        if (!tokenData) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        // Get full user from database
        const user = await prisma.user.findUnique({
            where: { id: tokenData.id },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const formData = await req.formData();
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const username = formData.get("username") as string;
        const image = formData.get("image") as File | null;

        // Check if username is taken by another user
        if (username && username !== user.username) {
            const existingUser = await prisma.user.findUnique({
                where: { username },
            });
            if (existingUser && existingUser.id !== user.id) {
                return NextResponse.json(
                    { error: "Username already taken" },
                    { status: 400 }
                );
            }
        }

        // Check if email is taken by another user
        if (email && email !== user.email) {
            const existingEmail = await prisma.user.findUnique({
                where: { email },
            });
            if (existingEmail && existingEmail.id !== user.id) {
                return NextResponse.json(
                    { error: "Email already taken" },
                    { status: 400 }
                );
            }
        }

        let imagePath: string | null = null;

        // Handle image upload
        if (image && image.size > 0) {
            const bytes = await image.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const ext = image.name.split(".").pop();
            const filename = `profile_${user.id}_${Date.now()}.${ext}`;

            const uploadDir = path.join(process.cwd(), "public", "uploads", "profiles");
            await mkdir(uploadDir, { recursive: true });

            const filePath = path.join(uploadDir, filename);

            // FIX: Convert buffer -> Uint8Array
            await writeFile(filePath, new Uint8Array(buffer));

            imagePath = `/uploads/profiles/${filename}`;
        }


        // Update user in database
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                name: name || undefined,
                email: email || undefined,
                username: username || undefined,
            },
        });

        // Also update the role-specific table (Teacher, Student, Parent)
        const role = tokenData.role?.toUpperCase();

        if (role === "TEACHER") {
            await prisma.teacher.update({
                where: { userId: user.id },
                data: {
                    name: name || undefined,
                    email: email || undefined,
                    img: imagePath || undefined,
                },
            });
        } else if (role === "STUDENT") {
            await prisma.student.update({
                where: { userId: user.id },
                data: {
                    name: name || undefined,
                    email: email || undefined,
                    img: imagePath || undefined,
                },
            });
        } else if (role === "PARENT") {
            await prisma.parent.update({
                where: { userId: user.id },
                data: {
                    name: name || undefined,
                    email: email || undefined,
                },
            });
        }

        return NextResponse.json({
            message: "Profile updated successfully",
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                username: updatedUser.username,
                img: imagePath,
            },
        });
    } catch (err) {
        console.error("Profile update error:", err);
        return NextResponse.json(
            { error: "Failed to update profile" },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get("token")?.value;

        if (!token) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const tokenData = await getUserFromToken(token);
        if (!tokenData) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        // Get full user from database
        const user = await prisma.user.findUnique({
            where: { id: tokenData.id },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get profile image from role-specific table
        let img = null;
        const role = tokenData.role?.toUpperCase();

        if (role === "TEACHER") {
            const teacher = await prisma.teacher.findUnique({
                where: { userId: user.id },
                select: { img: true },
            });
            img = teacher?.img;
        } else if (role === "STUDENT") {
            const student = await prisma.student.findUnique({
                where: { userId: user.id },
                select: { img: true },
            });
            img = student?.img;
        }

        return NextResponse.json({
            id: user.id,
            name: user.name,
            email: user.email,
            username: user.username,
            role: tokenData.role,
            img,
        });
    } catch (err) {
        console.error("Get profile error:", err);
        return NextResponse.json(
            { error: "Failed to get profile" },
            { status: 500 }
        );
    }
}
