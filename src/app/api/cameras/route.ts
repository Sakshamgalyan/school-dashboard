// /app/api/cameras/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDevices } from "@/lib/ffmpeg-utils";

export async function GET(req: NextRequest) {
  try {
    const devices = await getDevices();
    return NextResponse.json(devices);
  } catch (error) {
    console.error("Error detecting devices:", error);
    return NextResponse.json(
      { error: "Failed to detect devices" },
      { status: 500 }
    );
  }
}
