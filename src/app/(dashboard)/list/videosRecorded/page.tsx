"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  FolderOpenIcon,
  VideoCameraIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";

type Video = {
  id: string;
  title: string;
  videoUrl: string;
  thumbnail: string;
  views: number;
  createdAt: string;
};

const VideoDashboard = () => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videos, setVideos] = useState<Video[]>([]);
  const [role, setRole] = useState<string | null>(null);

  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedThumbnail, setEditedThumbnail] = useState<File | null>(null);

  // ✅ Fetch user role
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/getUserDetails", {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok) setRole(data.role.toLowerCase());
      } catch (err) {
        console.error("Fetch failed:", err);
      }
    };
    fetchUser();
  }, []);

  // ✅ Fetch videos from DB
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await fetch("/api/videos");
        const data = await res.json();
        if (res.ok) setVideos(data);
      } catch (err) {
        console.error("Failed to fetch videos:", err);
      }
    };
    fetchVideos();
  }, []);

  // Drag & drop handlers
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
  };

  // ✅ Upload to API
  const handleUpload = async () => {
    if (!selectedFile) return;

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setUploadProgress(0);
        setSelectedFile(null);
      }
    }, 200);

    const formData = new FormData();
    formData.append("video", selectedFile);

    try {
      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const newVideo = await response.json();
        setVideos((prev) => [newVideo.video, ...prev]);
      } else {
        console.error("Video upload failed.");
      }
    } catch (error) {
      console.error("Error uploading video:", error);
    }
  };

  // ✅ Edit & save video
  const handleEditClick = (video: Video) => {
    setEditingVideoId(video.id);
    setEditedTitle(video.title);
    setEditedThumbnail(null);
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setEditedThumbnail(e.target.files[0]);
  };

  const handleSaveEdit = async (videoId: string) => {
    const formData = new FormData();
    formData.append("title", editedTitle);
    if (editedThumbnail) formData.append("thumbnail", editedThumbnail);

    try {
      const res = await fetch(`/api/videos/${videoId}`, {
        method: "PUT",
        body: formData,
      });

      if (res.ok) {
        const updatedVideo = await res.json();
        setVideos((prev) => prev.map((v) => (v.id === videoId ? updatedVideo : v)));
        setEditingVideoId(null);
      } else {
        console.error("Update failed");
      }
    } catch (err) {
      console.error("Error updating video:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <main className="max-w-7xl mx-auto space-y-12">
        {/* Upload Section (Admin and Teacher only) */}
        {(role === "admin" || role === "teacher") && (
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload a Video</h2>
            <div
              className={`p-10 border-2 border-dashed rounded-lg text-center transition-colors duration-200 ${
                dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white"
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center space-y-4">
                <FolderOpenIcon className="h-16 w-16 text-gray-400" />
                <p className="text-lg text-gray-600 font-medium">Drag and drop a video here</p>
                <p className="text-sm text-gray-500">or</p>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer bg-blue-600 text-white font-semibold py-3 px-6 rounded-full shadow-md hover:bg-blue-700 transition-colors duration-200"
                >
                  <VideoCameraIcon className="h-5 w-5 inline mr-2 -mt-1" />
                  Select File
                </label>
              </div>
            </div>

            {selectedFile && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700 font-medium">
                  Selected File: <span className="text-blue-600">{selectedFile.name}</span>
                </p>
                <div className="mt-4 bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <button
                  onClick={handleUpload}
                  className="mt-4 w-full bg-green-600 text-white font-semibold py-3 px-6 rounded-full shadow-md hover:bg-green-700 transition-colors duration-200"
                >
                  Publish Video
                </button>
              </div>
            )}
          </div>
        )}

        {/* Video List */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Videos</h2>

          {videos.length === 0 ? (
            <p className="text-gray-600">No videos uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="relative group rounded-lg shadow-md overflow-hidden bg-white"
                >
                  <Image
                    src={
                      editingVideoId === video.id && editedThumbnail
                        ? URL.createObjectURL(editedThumbnail)
                        : video.thumbnail || "/default-thumbnail.png"
                    }
                    alt={video.title}
                    width={400}
                    height={250}
                    className="w-full h-48 object-cover rounded-t-lg"
                    unoptimized
                  />
                  <div className="p-4">
                    {editingVideoId === video.id ? (
                      <>
                        <input
                          type="text"
                          value={editedTitle}
                          onChange={(e) => setEditedTitle(e.target.value)}
                          className="border p-1 w-full rounded mb-2"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleThumbnailChange}
                          className="border p-1 w-full rounded"
                        />
                        <div className="flex space-x-2 mt-2">
                          <button
                            onClick={() => handleSaveEdit(video.id)}
                            className="bg-green-500 text-white px-3 py-1 rounded"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingVideoId(null)}
                            className="bg-gray-300 px-3 py-1 rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <h3
                          className="text-sm font-semibold text-gray-900 truncate"
                          title={video.title}
                        >
                          {video.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {video.views} views • {new Date(video.createdAt).toLocaleDateString()}
                        </p>
                      </>
                    )}
                  </div>

                  {role === "admin" && editingVideoId !== video.id && (
                    <div className="absolute top-2 right-2 flex space-x-2">
                      <button
                        onClick={() => handleEditClick(video)}
                        className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors duration-200">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default VideoDashboard;
