import { supabase } from '../lib/supabase' // Importera klienten du nyss skapade
import { useEffect, useState } from 'react'

export default function Home() {

  const [listings, setListings] = useState([])

  useEffect(() => {
    const fetchListings = async () => {
      // OBS: Se till att 'Listings' är stavat exakt som i din databas (oftast 'listings')
      const { data, error } = await supabase.from('Listings').select('*')
      
      if (error) {
        console.log("Fel vid hämtning:", error.message)
      } else {
        setListings(data) // 3. Spara datan i vårt state
      }
    }
    
    fetchListings()
  }, [])
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Food D</h1>
      <p className="mt-2 text-gray-600">Welcome to the Food Rescue app!</p>
      <div className="grid gap-4">
        {listings.length > 0 ? (
          listings.map((item) => (
            <div key={item.id} className="p-4 border rounded-xl shadow-sm bg-white hover:shadow-md transition">
              <h2 className="text-xl font-semibold">{item.title}</h2>
              <p className="text-gray-500">{item.description}</p>
              {/* Om du har ett datumfält kan du visa det också: */}
              {item.expiry_date && (
                <span className="text-xs font-bold text-red-500 uppercase">
                  Går ut: {item.expiry_date}
                </span>
              )}
            </div>
          ))
        ) : (
          <p>Laddar matvaror... (eller så är listan tom)</p>
        )}
      </div>
    </div>
  )
}
