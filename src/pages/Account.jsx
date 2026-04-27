import GooglePlaces from "react-google-autocomplete";
import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const Autocomplete = GooglePlaces.default || GooglePlaces;

const API_KEY = "AIzaSyCjNsLzUbZz1D522m-rb9DnCSTkcKLuV_M";

export default function Account() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState(null)
  const [fullName, setFullName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')


  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }
      setUser(user)

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, address, phone')
        .eq('id', user.id)
        .single()

      if (data) {
        setFullName(data.full_name ?? '')
        setAddress(data.address ?? '')
        setPhone(data.phone ?? '')
      } else if (error && error.code !== 'PGRST116') {
        // PGRST116 = no row found, expected for new users before first save
        alert(error.message)
      }
      setLoading(false)
    }
    loadProfile()
  }, [navigate])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      full_name: fullName,
      address,
      phone,
      updated_at: new Date().toISOString(),
    })
    if (error) alert(error.message)
    else alert('Profile saved!')
    setSaving(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (loading) return <p className="p-8">Loading...</p>

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        <h1 className="text-2xl font-bold text-center mb-6 text-green-700">My Account</h1>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full p-3 border rounded-lg bg-gray-100 text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-3 border rounded-lg text-black"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
            <Autocomplete
              apiKey={API_KEY}
              onPlaceSelected={(place) => {
          // 1. Spara den snygga adressen som text
                let streetName = "";
                let streetNumber = "";
                let city = "";

                if (place.address_components) {
                  for (const component of place.address_components) {
                    // Hitta gatunamnet
                    if (component.types.includes("route")) {
                      streetName = component.long_name; 
                    }
                    // Hitta husnumret
                    if (component.types.includes("street_number")) {
                      streetNumber = component.long_name; 
                    }
                    // Hitta staden/orten
                    if (component.types.includes("postal_town") || component.types.includes("locality")) {
                      city = component.long_name; 
                    }
                  }
                }

                if (!streetNumber) {
                  alert("Vänligen skriv med ditt husnummer i adressfältet!");
                  return; // Avbryt så att fel adress inte sparas
                }
                
                const perfectAddress = `${streetName} ${streetNumber}, ${city}, Sverige`;

                setAddress(perfectAddress);
              }}
              options={{
                types: ["address"],
                componentRestrictions: { country: "se" }, // Begränsa till Sverige
              }}
              className="w-full p-3 border rounded-lg text-black"
              placeholder="Börja skriva din adress..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-3 border rounded-lg text-black"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-green-600 text-white p-3 rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full border border-red-500 text-red-500 p-3 rounded-lg font-bold hover:bg-red-50"
          >
            Log out
          </button>
        </form>
      </div>
    </div>
  )
}
