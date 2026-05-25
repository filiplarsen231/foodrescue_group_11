import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function ChoosePicture({ onSelect }) {
  const [uploading, setUploading] = useState(false); // håller koll på om bilden laddas upp 

  async function handleFileChange(e) {
    const file = e.target.files[0];


    const previewUrl = URL.createObjectURL(file);

    // gör ett unikt filnamn så inget skrivs över
    const fileName = `${Date.now()}-${file.name}`;

    setUploading(true);

    const { error } = await supabase.storage
      .from("Gallery")
      .upload(fileName, file);

    if (error) {
      alert("UPLOAD FAILED: " + error.message);
      setUploading(false);
      return;
    }

    // hämtar public URL så bilden kan visas senare
    const { data: urlData } = supabase.storage
      .from("Gallery")
      .getPublicUrl(fileName);


onSelect(publicUrl, previewUrl, file.lastModified);   
 setUploading(false);
  }

  return (
    <div>
      <label className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded cursor-pointer inline-block font-medium transition">
        {uploading ? "Uploading..." : "Choose Picture"}

        <input
          type="file"
          accept="image/*"
          hidden
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
}