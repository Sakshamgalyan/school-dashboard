// /lib/ffmpeg-utils.ts
import { spawn, exec } from "child_process";
import path from "path";

// 🔹 Detect devices (cameras & microphones)
export async function getDevices() {
  return new Promise<{ cameras: string[]; microphones: string[] }>((resolve, reject) => {
    exec('ffmpeg -list_devices true -f dshow -i dummy', (error, stdout, stderr) => {
      if (error && !stderr) {
        return reject(error);
      }

      const output = stdout + stderr;
      const cameras: string[] = [];
      const microphones: string[] = [];

      const regex = /"([^"]+)" \((video|audio)\)/g;
      let match;
      while ((match = regex.exec(output)) !== null) {
        if (match[2] === "video") cameras.push(match[1]);
        if (match[2] === "audio") microphones.push(match[1]);
      }

      resolve({ cameras, microphones });
    });
  });
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
export function buildHlsArgs(camera: string, microphone: string, hlsPath: string) {
  return [
    "-f", "dshow",
    "-i", `video=${camera}`,
    "-f", "dshow",
    "-i", `audio=${microphone}`,
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
