import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function Listings() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const loadProfileAddress = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('address')
        .eq('id', user.id)
        .single()
      if (profile?.address) setAddress(profile.address)
    }
    loadProfileAddress()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault() // Hindrar sidan från att laddas om
    setLoading(true)

    // Här skickar vi datan till Supabase
    const { error } = await supabase
      .from('Listings') // Se till att detta matchar namnet i din databas exakt
      .insert([
        {
          title: title,
          description: description,
          address: address
          // Här kan du senare lägga till lat, lng och expiry_date
        }
      ])

    if (error) {
      alert("Något gick fel: " + error.message)
    } else {
      alert("Varan har lagts upp!")
      navigate('/') // Skicka användaren tillbaka till startsidan
    }
    setLoading(false)
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Lägg upp mat</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Vad vill du ge bort?</label>
          <input 
            type="text" 
            required
            className="mt-1 block w-full border rounded-md p-2"
            placeholder="t.ex. En påse äpplen"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Beskrivning (skick, bäst före etc.)</label>
          <textarea 
            className="mt-1 block w-full border rounded-md p-2"
            placeholder="t.ex. Plockade idag, jättefina!"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Adress</label>
          <input
            type="text"
            className="mt-1 block w-full border rounded-md p-2"
            placeholder="t.ex. Storgatan 1, Stockholm"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700"
        >
          {loading ? 'Sparar...' : 'Publicera annons'}
        </button>
      </form>
    </div>
  )
}