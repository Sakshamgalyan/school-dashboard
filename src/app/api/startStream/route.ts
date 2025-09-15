import { NextRequest, NextResponse } from "next/server";
import {
  spawnFFmpeg,
  testDevice,
  getDevices,
  buildHlsArgs,
} from "@/lib/ffmpeg-utils";
import path from "path";
import fs from "fs";

let ffmpegProcess: ReturnType<typeof spawnFFmpeg> | null = null;
let currentTitle = "Live Session";

const hlsPath = path.join(process.cwd(), "public", "hls");

// Ensure HLS folder exists
if (!fs.existsSync(hlsPath)) {
  fs.mkdirSync(hlsPath, { recursive: true });
}

// Helper: clean HLS folder
function clearHlsFolder() {
  if (fs.existsSync(hlsPath)) {
    fs.readdirSync(hlsPath).forEach((file) => {
      fs.unlinkSync(path.join(hlsPath, file));
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, camera, microphone } = await req.json();
    if (title) currentTitle = title;

    // 🔹 Kill existing stream if running
    if (ffmpegProcess) {
      ffmpegProcess.kill("SIGINT");
      ffmpegProcess = null;
    }

    // 🔹 Clean old HLS files
    clearHlsFolder();

    // 🔹 Get available devices
    const devices = await getDevices();

    const selectedCamera = camera || devices.cameras[0];
    const selectedMic = microphone || devices.microphones[0];

    const [cameraWorks, micWorks] = await Promise.all([
      testDevice(selectedCamera, "video"),
      testDevice(selectedMic, "audio"),
    ]);

    if (!cameraWorks && !micWorks) {
      return NextResponse.json(
        { error: "No working camera or microphone found" },
        { status: 400 }
      );
    }

    // 🔹 Build FFmpeg args & spawn
    const args = buildHlsArgs(
      cameraWorks ? selectedCamera : devices.cameras[0],
      micWorks ? selectedMic : devices.microphones[0],
      hlsPath
    );

    ffmpegProcess = spawnFFmpeg(args);

    ffmpegProcess.stderr?.on("data", (data: Buffer) => {
      console.log("FFmpeg:", data.toString());
    });

    ffmpegProcess.on("close", () => {
      console.log("FFmpeg process closed");
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
