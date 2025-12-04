// /app/api/startStream/route.ts
import { NextRequest, NextResponse } from "next/server";
import { spawnFFmpeg, buildHlsArgs } from "@/lib/ffmpeg-utils";
import path from "path";
import fs from "fs";

let ffmpegProcess: ReturnType<typeof spawnFFmpeg> | null = null;
let currentTitle = "Live Session";

const hlsPath = path.join(process.cwd(), "public", "hls");

// Ensure HLS folder exists
if (!fs.existsSync(hlsPath)) {
  fs.mkdirSync(hlsPath, { recursive: true });
}

function clearHlsFolder() {
  if (fs.existsSync(hlsPath)) {
    fs.readdirSync(hlsPath).forEach((file) => {
      fs.unlinkSync(path.join(hlsPath, file));
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title } = await req.json().catch(() => ({}));
    if (title) currentTitle = title;

    // Kill existing stream if running
    if (ffmpegProcess) {
      ffmpegProcess.kill("SIGINT");
      ffmpegProcess = null;
    }

    // Clean old HLS files
    clearHlsFolder();

    // Build args for this platform (Linux: /dev/video0 + default)
    const args = buildHlsArgs(hlsPath);
    console.log("Starting FFmpeg with args:", args.join(" "));

    ffmpegProcess = spawnFFmpeg(args);

    ffmpegProcess.stderr?.on("data", (data: Buffer) => {
      console.log("FFmpeg:", data.toString());
    });

    ffmpegProcess.on("error", (err) => {
      console.error("FFmpeg spawn error:", err);
    });

    ffmpegProcess.on("close", (code) => {
      console.log("FFmpeg process closed with code", code);
      ffmpegProcess = null;
    });

    return NextResponse.json({
      message: "🎥 Live stream started",
      title: currentTitle,
    });
  } catch (error) {
    console.error("Error starting stream:", error);
    return NextResponse.json(
      { error: "Failed to start stream" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  if (ffmpegProcess) {
    ffmpegProcess.kill("SIGINT");
    ffmpegProcess = null;
    clearHlsFolder();
    return NextResponse.json({ message: "🛑 Stream stopped" });
  }
  return NextResponse.json({ message: "No active stream" });
}
