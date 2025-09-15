import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// 🔹 GET all videos
export async function GET() {
  try {
    const videos = await prisma.video.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(videos);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 🔹 POST (optional: create new video manually)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, videoUrl, thumbnail } = body;

    if (!title || !videoUrl || !thumbnail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newVideo = await prisma.video.create({
      data: {
        title,
        videoUrl,
        thumbnail,
        views: 0,
      },
    });

    return NextResponse.json(newVideo, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
