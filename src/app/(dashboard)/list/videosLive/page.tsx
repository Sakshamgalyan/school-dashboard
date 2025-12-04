"use client";

import { useEffect, useRef, useState } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import { motion, AnimatePresence } from "framer-motion";

type VideoJsPlayerType = ReturnType<typeof videojs>;

export default function LivePage() {
  const [role, setRole] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<VideoJsPlayerType | null>(null);

  const [cameras, setCameras] = useState<string[]>([]);
  const [microphones, setMicrophones] = useState<string[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [selectedMicrophone, setSelectedMicrophone] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  // 🔹 Fetch user role
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/getUserDetails", {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok && data.role) setRole(String(data.role).toLowerCase());
      } catch (err) {
        console.error("Fetch failed:", err);
      }
    };
    fetchUser();
  }, []);

  // 🔹 Fetch available devices (only for teacher)
  useEffect(() => {
    if (role !== "teacher") return; // ⬅️ students won't get camera prompt

    const loadDevices = async () => {
      try {
        // Ask permission once so labels/deviceIds are available
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        const audioInputs = devices.filter((d) => d.kind === "audioinput");

        const cameraIds = videoInputs.map((d) => d.deviceId);
        const micIds = audioInputs.map((d) => d.deviceId);

        setCameras(cameraIds);
        setMicrophones(micIds);

        if (cameraIds[0]) setSelectedCamera(cameraIds[0]);
        if (micIds[0]) setSelectedMicrophone(micIds[0]);
      } catch (err) {
        console.error("Failed to get media devices:", err);
        setError("Cannot access camera/microphone. Please check permissions.");
      }
    };

    loadDevices();
  }, [role]);

  // 🎥 Teacher Preview
  useEffect(() => {
    if (role !== "teacher" || !previewRef.current) return;

    const videoEl = previewRef.current;
    let localStream: MediaStream | null = null;

    const startPreview = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 1280,
            height: 720,
            deviceId: selectedCamera || undefined,
          },
          audio: false,
        });
        if (videoEl) {
          videoEl.srcObject = localStream;
          await videoEl.play().catch(() => {});
        }
      } catch (err) {
        console.error("Cannot access camera:", err);
        setError("Cannot access camera. Please check permissions.");
      }
    };

    startPreview();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        localStream = null;
      }
      if (videoEl) {
        videoEl.srcObject = null;
      }
    };
  }, [role, selectedCamera]);

  // 📺 Student video player
  useEffect(() => {
    if (role !== "student" || !videoRef.current) return;

    if (!playerRef.current) {
      playerRef.current = videojs(videoRef.current, {
        autoplay: true,
        controls: true,
        responsive: true,
        fluid: true,
        preload: "auto",
        sources: [
          {
            src: "/hls/stream.m3u8",
            type: "application/x-mpegURL",
          },
        ],
      });
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [role]);

  // 🔴 Start streaming
  const handleGoLive = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/startStream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          camera: selectedCamera,
          microphone: selectedMicrophone,
          title: "Teacher Live Class",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start stream");
      }

      setIsLive(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Stream start failed");
    } finally {
      setIsLoading(false);
    }
  };

  // 🛑 Stop streaming
  const handleStopLive = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/startStream", {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to stop stream");
      }

      setIsLive(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Stream stop failed");
    } finally {
      setIsLoading(false);
    }
  };

  // 🛑 Auto stop stream when tab closes
  useEffect(() => {
    const stopStreamOnUnload = () => {
      if (isLive) {
        try {
          navigator.sendBeacon("/api/startStream/forceStop");
        } catch (err) {
          console.error("Failed to stop stream on unload:", err);
        }
      }
    };

    window.addEventListener("beforeunload", stopStreamOnUnload);
    window.addEventListener("unload", stopStreamOnUnload);

    return () => {
      window.removeEventListener("beforeunload", stopStreamOnUnload);
      window.removeEventListener("unload", stopStreamOnUnload);
    };
  }, [isLive]);

  // ❤️ Heartbeat every 10s
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (isLive && role === "teacher") {
      interval = setInterval(async () => {
        try {
          await fetch("/api/heartbeat", { method: "POST" });
        } catch (err) {
          console.error("Heartbeat failed:", err);
        }
      }, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLive, role]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-6">
      <motion.h1
        className="text-3xl font-bold mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {role === "teacher" ? "Teacher Live Control" : "Student Viewer"}
      </motion.h1>

      {/* Teacher Preview */}
      {role === "teacher" && (
        <motion.div
          className="w-full max-w-3xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative rounded-2xl overflow-hidden shadow-xl border border-gray-700">
            <video
              ref={previewRef}
              className="w-full h-80 object-cover bg-black"
              autoPlay
              muted
              playsInline
            />
            <div className="absolute top-2 left-2 bg-black/70 px-3 py-1 rounded-lg text-sm">
              Preview
            </div>
          </div>

          {/* Device selectors */}
          <div className="mt-4 flex flex-col gap-3">
            <select
              value={selectedCamera || ""}
              onChange={(e) => setSelectedCamera(e.target.value)}
              className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-600"
            >
              {cameras.map((camId, i) => (
                <option key={camId} value={camId}>
                  Camera {i + 1}
                </option>
              ))}
            </select>

            <select
              value={selectedMicrophone || ""}
              onChange={(e) => setSelectedMicrophone(e.target.value)}
              className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-600"
            >
              {microphones.map((micId, i) => (
                <option key={micId} value={micId}>
                  Microphone {i + 1}
                </option>
              ))}
            </select>
          </div>

          {/* Go Live / Stop Live Button */}
          <div className="mt-6 flex items-center gap-4 justify-center">
            {!isLive ? (
              <motion.button
                onClick={handleGoLive}
                disabled={isLoading || !selectedCamera || !selectedMicrophone}
                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
              >
                {isLoading ? "Starting..." : "Go Live"}
              </motion.button>
            ) : (
              <motion.button
                onClick={handleStopLive}
                disabled={isLoading}
                className="px-6 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
              >
                🛑 Stop Live
              </motion.button>
            )}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                className="mt-4 text-red-400 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Student Viewer */}
      {role === "student" && (
        <motion.div
          className="w-full max-w-4xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative rounded-2xl overflow-hidden shadow-xl border border-gray-700">
            <video
              ref={videoRef}
              className="video-js w-full h-[500px]"
              controls
              playsInline
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
