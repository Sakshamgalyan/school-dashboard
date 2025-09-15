// /app/api/testDevices/route.ts
import { NextRequest, NextResponse } from "next/server";
import { testDevice } from "@/lib/ffmpeg-utils";

export async function POST(req: NextRequest) {
  try {
    const { camera, microphone } = await req.json();

    const [cameraWorks, microphoneWorks] = await Promise.all([
      testDevice(camera, "video"),
      testDevice(microphone, "audio"),
    ]);

    return NextResponse.json({
      cameraWorks,
      microphoneWorks,
      message:
        cameraWorks && microphoneWorks
          ? "✅ Devices are working"
          : `Camera: ${cameraWorks ? "OK" : "FAIL"}, Microphone: ${microphoneWorks ? "OK" : "FAIL"}`,
    });
  } catch (error) {
    console.error("Error testing devices:", error);
    return NextResponse.json(
      { error: "Failed to test devices" },
      { status: 500 }
    );
  }
}
