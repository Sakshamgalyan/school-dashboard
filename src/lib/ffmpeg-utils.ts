// /lib/ffmpeg-utils.ts
import { spawn, exec } from "child_process";
import path from "path";

function run(cmd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error && !stderr) return reject(error);
      resolve(stdout + stderr);
    });
  });
}

export async function getDevices(): Promise<{ cameras: string[]; microphones: string[] }> {
  const cameras: string[] = [];
  const microphones: string[] = [];

  if (process.platform === "linux") {
    const videoOut = await run('ffmpeg -hide_banner -f v4l2 -list_devices true -i dummy');
    const audioOut = await run('ffmpeg -hide_banner -f alsa -list_devices true -i default');

    videoOut.split(/\r?\n/).forEach(line => {
      const m = line.match(/\/dev\/video[0-9]+/);
      if (m) cameras.push(m[0]);
    });

    audioOut.split(/\r?\n/).forEach(line => {
      const m = line.match(/card \d+:[^,]+, device \d+:[^,]+/);
      if (m) microphones.push(m[0].trim());
    });

    return { cameras, microphones };
  }

  return { cameras: [], microphones: [] };
}

// 🔹 Test if a device works
export async function testDevice(deviceName: string, type: "video" | "audio"): Promise<boolean> {
  return new Promise((resolve) => {
    if (!deviceName) return resolve(false);

    const args =
      type === "video"
        ? ["-f", "dshow", "-i", `video=${deviceName}`, "-t", "2", "-f", "null", "-"]
        : ["-f", "dshow", "-i", `audio=${deviceName}`, "-t", "2", "-f", "null", "-"];

    const proc = spawn("ffmpeg", args);

    let success = false;
    proc.stderr?.on("data", (data: Buffer) => {
      const output = data.toString();
      if (output.includes("frame=") || output.includes("Audio")) {
        success = true;
      }
    });

    proc.on("close", () => resolve(success));
    proc.on("error", () => resolve(false));
  });
}

// 🔹 Spawn an FFmpeg process with arguments
export function spawnFFmpeg(args: string[]) {
  return spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });
}


// 🔹 Build FFmpeg arguments for HLS streaming
export function buildHlsArgs(hlsPath: string) {
  if (process.platform === "linux") {
    // Always use server devices, NOT browser deviceIds
    const videoDevice = "/dev/video0";
    const audioDevice = "default";

    return [
      "-f", "v4l2",
      "-i", videoDevice,
      "-f", "alsa",
      "-i", audioDevice,
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-tune", "zerolatency",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac",
      "-b:a", "128k",
      "-f", "hls",
      "-hls_time", "4",
      "-hls_list_size", "6",
      "-hls_flags", "delete_segments+append_list",
      "-hls_segment_filename", path.join(hlsPath, "segment_%03d.ts"),
      path.join(hlsPath, "stream.m3u8"),
    ];
  }

  // You can add Windows / macOS branches later if needed
  throw new Error(`Unsupported platform: ${process.platform}`);
}
