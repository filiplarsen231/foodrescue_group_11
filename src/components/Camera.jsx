import { useRef, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Camera({ onSelect }) {

  // refs används för att komma åt video, canvas och kamerastream direkt
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // håller koll på om kameran är öppen
  const [open, setOpen] = useState(false);

 
  const [uploading, setUploading] = useState(false);

  // öppnar användarens kamera
  async function openCamera() {
    try {
      setOpen(true);

      // ber om tillgång till kameran
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      streamRef.current = stream;

      // kopplar kamerastreamen till video-elementet
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 0);

    } catch (error) {

      // om användaren nekar kameratillgång
      alert("Could not open camera: " + error.message);
      setOpen(false);
    }
  }

  function closeCamera() {

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    streamRef.current = null;
    setOpen(false);
  }

  // tar en bild från videon
  async function takePhoto() {

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    // gör canvas samma storlek som videon
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // ritar videobilden på canvasen
    const ctx = canvas.getContext("2d");

    ctx.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob(async (blob) => {

      if (!blob) return;

      // lokal preview så användaren ser bilden direkt
      const previewUrl = URL.createObjectURL(blob);

      // unikt filnamn så inga bilder skrivs över
      const fileName = `${Date.now()}-camera-image.png`;

      setUploading(true);

      // laddar upp bilden till Supabase storage bucket
      const { error } = await supabase.storage
        .from("Gallery")
        .upload(fileName, blob);

      if (error) {
        alert("Camera upload failed: " + error.message);
        setUploading(false);
        return;
      }

      // hämtar publik URL för den uppladdade bilden
      const { data: urlData } = supabase.storage
        .from("Gallery")
        .getPublicUrl(fileName);

        const publicUrl = urlData.publicUrl;

        // skickar tillbaka både riktig URL + preview till Home.jsx
        onSelect(publicUrl, previewUrl, new Date().getTime());
      setUploading(false);

      closeCamera();

    }, "image/png");
  }

  return (
    <>
      {/* knapp för att öppna kameran */}
      <button
        type="button"
        onClick={openCamera}
        className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer inline-block"
      >
        Take Picture
      </button>

      {/* overlay/modal för kameran */}
      {open && (

        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

          <div className="bg-white rounded-lg p-4 w-[90%] max-w-md relative">

            {/* stäng knapp */}
            <button
              type="button"
              onClick={closeCamera}
              className="absolute top-2 right-3 text-2xl font-bold"
            >
              ×
            </button>

            <h3 className="text-lg font-semibold mb-3">
              Take Picture
            </h3>

            {/* live video från kameran */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-64 object-cover rounded bg-black"
            />

            {/* capture knapp */}
            <button
              type="button"
              onClick={takePhoto}
              disabled={uploading}
              className="w-full mt-4 bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
            >
              {uploading ? "Uploading..." : "Capture"}
            </button>

            {/* hidden canvas används för att spara bilden */}
            <canvas
              ref={canvasRef}
              className="hidden"
            />

          </div>
        </div>
      )}
    </>
  );
}