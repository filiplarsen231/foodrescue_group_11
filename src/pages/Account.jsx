import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Account() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState(null)
  const [fullName, setFullName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')

  const addressInputRef = useRef(null)

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
        
        alert(error.message)
      }
      setLoading(false)
    }
    loadProfile()
  }, [navigate])

  useEffect(() => {
    let autocomplete = null;

    const initGooglePlaces = () => {
     
      if (addressInputRef.current && window.google && window.google.maps && window.google.maps.places) {
        
        
        autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
          types: ["address"],
          componentRestrictions: { country: "se" },
        })

        // Lyssna på när användaren väljer en adress i dropdownen
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          
          let streetName = "";
          let streetNumber = "";
          let city = "";

          // Plocka ut gata, nummer och stad
          if (place.address_components) {
            for (const component of place.address_components) {
              if (component.types.includes("route")) streetName = component.long_name;
              if (component.types.includes("street_number")) streetNumber = component.long_name;
              if (component.types.includes("postal_town") || component.types.includes("locality")) city = component.long_name;
            }
          }

          if (!streetNumber) {
            alert("Vänligen skriv med ditt husnummer i adressfältet!");
            return;
          }

          const perfectAddress = `${streetName} ${streetNumber}, ${city}, Sverige`;
          setAddress(perfectAddress);
          
      
          if (addressInputRef.current) {
            addressInputRef.current.value = perfectAddress;
          }
        })
      }
    }

    
    const checkGoogleInterval = setInterval(() => {
      if (window.google) {
        clearInterval(checkGoogleInterval)
        initGooglePlaces()
      }
    }, 500)

    // Städa upp om man byter sida
    return () => clearInterval(checkGoogleInterval)
  }, []) // Körs bara en gång när sidan laddas

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
    else {
      alert('Profile saved!')
      navigate('/')
    }
    setSaving(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (loading) return <p className="p-8 text-gray-500">Loading...</p>

  const initials = (fullName || user?.email || '?')
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const inputClass =
    "w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-br from-green-700 to-green-600 px-6 py-8 text-white flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-xl font-bold border border-white/30">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold">My Account</h1>
            <p className="text-sm text-green-50/90 mt-0.5">{user.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-6 md:p-8 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
              placeholder="Ditt fullständiga namn"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Address</label>
            <input
              ref={addressInputRef}
              type="text"
              defaultValue={address}
              onChange={(e) => setAddress(e.target.value)}
              className={inputClass}
              placeholder="Börja skriva din adress..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
              placeholder="+46 ..."
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-full shadow-sm hover:shadow-md transition disabled:bg-gray-300 disabled:shadow-none"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex-1 border border-red-300 text-red-600 font-semibold py-3 rounded-full hover:bg-red-50 transition"
            >
              Log out
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
