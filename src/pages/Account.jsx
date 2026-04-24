import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Account() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState(null)
  const [fullName, setFullName] = useState('')
  const [location, setLocation] = useState('')
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
        .select('full_name, location, phone')
        .eq('id', user.id)
        .single()

      if (data) {
        setFullName(data.full_name ?? '')
        setLocation(data.location ?? '')
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
      location,
      phone,
      updated_at: new Date().toISOString(),
    })
    if (error) alert(error.message)
    else alert('Profil sparad!')
    setSaving(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (loading) return <p className="p-8">Laddar...</p>

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        <h1 className="text-2xl font-bold text-center mb-6 text-green-700">Mitt konto</h1>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">E-post</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full p-3 border rounded-lg bg-gray-100 text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Namn</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-3 border rounded-lg text-black"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Plats</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-3 border rounded-lg text-black"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Telefon</label>
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
            {saving ? 'Sparar...' : 'Spara'}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full border border-red-500 text-red-500 p-3 rounded-lg font-bold hover:bg-red-50"
          >
            Logga ut
          </button>
        </form>
      </div>
    </div>
  )
}
