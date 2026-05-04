import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function ChoosePicture({ onSelect }) {
  const [preview, setPreview] = useState(null); // sparar en preview så man ser bilden direkt
  const [uploading, setUploading] = useState(false); // håller koll på om bilden laddas upp

  async function handleFileChange(e) {
    const file = e.target.files[0];

    if (!file) return; // om ingen fil valdes, gör inget

    // visar en preview direkt innan upload (snabb feedback till user)
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    // gör ett unikt filnamn så inget skrivs över
    const fileName = `${Date.now()}-${file.name}`;

    setUploading(true); // sätter loading state

    const { data, error } = await supabase.storage
      .from("Gallery") // bucket i supabase
      .upload(fileName, file);

    console.log("UPLOAD RESULT:", data, error);

    if (error) {
      alert("UPLOAD FAILED: " + error.message);
      console.error("FULL ERROR:", error);
      setUploading(false);
      return;
    }

    console.log("UPLOAD SUCCESS:", data);

    // hämtar public URL så bilden kan visas senare
    const { data: urlData } = supabase.storage
      .from("Gallery")
      .getPublicUrl(fileName);

    console.log("PUBLIC URL:", urlData.publicUrl);

    // skickar tillbaka bilden till parent (Home.jsx)
    onSelect(urlData.publicUrl);

    setUploading(false); // klart med upload
  }

  return (
    <div>
      {/* knapp som triggar filval */}
      <label className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer inline-block">
        {uploading ? "Uploading..." : "Choose Picture"} {/* ändrar text när den laddar */}

        <input
          type="file"
          accept="image/*" // bara bilder
          hidden
          onChange={handleFileChange}
        />
      </label>

      {/* visar preview om bild finns */}
      {preview && (
        <div className="mt-3">
          <img
            src={preview}
            alt="preview"
            className="w-24 h-24 object-cover rounded border"
          />
        </div>
      )}
    </div>
  );
}