import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import util from "util";
import prisma from "@/lib/prisma";

const execPromise = util.promisify(exec);

export const runtime = "nodejs"; // ensures Node APIs available

export async function POST(req: NextRequest) {
  try {
    // Parse form data
    const formData = await req.formData();
    const file = formData.get("video") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Generate IDs & paths
    const lessonId = uuidv4();
    // __dirname is the current file directory
    const uploadDir = path.join(process.cwd(), "public", "uploads", "lectures", lessonId);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const videoPath = path.join(uploadDir, file.name);
    fs.writeFileSync(videoPath, new Uint8Array(buffer)); // ✅ Fix: cast to Uint8Array

    const hlsPath = path.join(uploadDir, "index.m3u8");
    const thumbnailPath = path.join(uploadDir, "thumbnail.jpg");

    // Run FFmpeg: generate HLS
    const ffmpegCommand = `ffmpeg -i "${videoPath}" -codec:v libx264 -codec:a aac -hls_time 10 -hls_playlist_type vod -hls_segment_filename "${uploadDir}/segment%03d.ts" -start_number 0 "${hlsPath}"`;

    // Run FFmpeg: generate thumbnail at 5s
    const thumbnailCommand = `ffmpeg -i "${videoPath}" -ss 00:00:05 -vframes 1 "${thumbnailPath}"`;

    await execPromise(ffmpegCommand);
    await execPromise(thumbnailCommand);

    // Construct URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const videoUrl = `${baseUrl}/uploads/lectures/${lessonId}/index.m3u8`;
    const thumbnailUrl = `${baseUrl}/uploads/lectures/${lessonId}/thumbnail.jpg`;

    // Save to DB
    const savedVideo = await prisma.video.create({
      data: {
        id: lessonId,
        title: file.name.replace(path.extname(file.name), ""),
        videoUrl,
        thumbnail: thumbnailUrl,
        views: 0,
      },
    });

    return NextResponse.json({
      message: "Video uploaded successfully",
      video: savedVideo,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
