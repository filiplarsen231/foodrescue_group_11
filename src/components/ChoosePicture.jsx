import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function ChoosePicture({ onSelect }) {
  const [images, setImages] = useState([]);
  const [open, setOpen] = useState(false);

  async function openGallery() {
    const { data } = await supabase.storage.from("Gallery").list();

    const urls = data.map((file) => {
      const { data } = supabase.storage
        .from("Gallery")
        .getPublicUrl(file.name);

      return data.publicUrl;
    });

    setImages(urls);
    setOpen(true);
  }

  return (
    <div>
      {/* ChoosePicture knapp */}
      <button
        type="button"
        onClick={openGallery}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Choose Picture
      </button>

      {/* Gallery */}
      {open && (
        <div className="flex flex-wrap gap-2 mt-3">
          {images.map((img, i) => (
            <img
              key={i}
              src={img}
              className="w-20 h-20 object-cover rounded cursor-pointer"
              onClick={() => {
                onSelect(img);
                setOpen(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}