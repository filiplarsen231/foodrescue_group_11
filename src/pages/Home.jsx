import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ChoosePicture from '../components/ChoosePicture'
import { Calc_Distance_Multi } from '../components/Distance_calc'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()
  const [listings, setListings] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loadingDistance, setLoadingDistance] = useState(false)
  const [user, setUser] = useState(null)
  const [profileAddress, setProfileAddress] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    expiry_date: '',
    address: '',
    image_url: '',
  })

  const handleContact = async (listing) => {
    if (!user) {
      alert("Du måste vara inloggad för att skicka meddelanden!")
      return
    }

    if (user.id === listing.user_id) {
      alert("Detta är din egen annons!")
      return
    }

    // Kolla om en konversation redan finns för denna vara mellan dessa personer
    const { data: existingChat, error: fetchError } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', listing.id)
      .eq('seeker_id', user.id)
      .single()

    if (existingChat) {
      // Om chatten finns, gå till den
      navigate(`/messages/${existingChat.id}`)
    } else {
      // Om chatten INTE finns, skapa en ny
      const { data: newChat, error: createError } = await supabase
        .from('conversations')
        .insert([
          {
            listing_id: listing.id,
            owner_id: listing.user_id,
            seeker_id: user.id
          }
        ])
        .select()
        .single()

      if (createError) {
        console.error("Kunde inte skapa chatt:", createError.message)
        alert("Gick inte att starta chatten.")
      } else {
        navigate(`/messages/${newChat.id}`)
      }
    }
  }

  useEffect(() => {
    const initPage = async () => {
      const { data: fetchedListings, error: listError } = await supabase
        .from('Listings')
        .select('*')

      if (listError) {
        console.log('Fel vid hämtning:', listError.message)
        return
      }

      setListings(fetchedListings)

      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) return

      setUser(authUser)

      const { data: profile } = await supabase
        .from('profiles')
        .select('address')
        .eq('id', authUser.id)
        .single()

      if (!profile?.address) return

      const userAd = profile.address
      setProfileAddress(userAd)
      setFormData((prev) => ({ ...prev, address: userAd }))

      if (fetchedListings.length === 0) return

      setLoadingDistance(true)
      try {
        const destinations = fetchedListings.map((l) => l.address || '')
        const distances = await Calc_Distance_Multi(userAd, destinations)

        if (distances) {
          const listWithDist = fetchedListings.map((item, index) => ({
            ...item,
            distanceText:
              distances[index] != null
                ? (distances[index] / 1000).toFixed(1) + ' km'
                : 'N/A',
          }))
          setListings(listWithDist)
        }
      } catch (err) {
        console.log('Distance calc failed:', err)
      } finally {
        setLoadingDistance(false)
      }
    }

    initPage()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => authListener.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!user) {
      alert('You must be logged in to create a listing!')
      return
    }

    if (!formData.image_url) {
      alert('Vänta, bilden har inte laddats upp helt ännu!')
      return
    }

    const payload = {
      title: formData.title,
      description: formData.description,
      expiry_date: formData.expiry_date || null,
      address: formData.address,
      image_url: formData.image_url,
      user_id: user.id,
    }

    const { data, error } = await supabase
      .from('Listings')
      .insert([payload])
      .select()

    if (error) {
      console.log('Error adding listing:', error.message)
      alert('Failed to add listing! Error: ' + error.message)
      return
    }

    setListings((prev) => [...prev, ...data])
    setShowModal(false)
    setFormData({
      title: '',
      description: '',
      expiry_date: '',
      address: profileAddress,
      image_url: '',
    })
    alert('Listing added successfully!')
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Food Feed</h1>
          <p className="mt-2 text-gray-600">Welcome to the Food Rescue app!</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition"
          >
            + Add New Listing
          </button>
          {user && (
            <button
              onClick={handleLogout}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-6 py-3 rounded-lg shadow-md transition"
            >
              Logout
            </button>
          )}
        </div>
      </div>

      {loadingDistance && (
        <p className="text-sm text-gray-500 mb-2">Calculating distances…</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {listings.length > 0 ? (
          listings.map((item) => (
            <div
              key={item.id}
              className="p-4 border rounded-xl shadow-sm bg-white hover:shadow-md transition"
            >
              <h2 className="text-xl font-semibold">{item.title}</h2>
              {item.distanceText && (
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                  {item.distanceText}
                </span>
              )}

              <p className="text-gray-500">{item.description}</p>

              {item.expiry_date && (
                <span className="text-xs font-bold text-red-500 uppercase">
                  Expiration Date: {item.expiry_date}
                  {new Date(item.expiry_date) < new Date() && (
                    <span className="ml-2 text-xs font-bold text-gray-700">Past</span>
                  )}
                </span>
              )}

              <button
                onClick={() => handleContact(item)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition text-sm"
              >
                I'm Interested / Chat
              </button>
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-40 object-cover rounded mt-3"
                />
              )}
            </div>
          ))
        ) : (
          <p>Laddar matvaror... (eller så är listan tom)</p>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">Add New Listing</h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Fresh Vegetables"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the food item, amount and condition..."
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Storgatan 1, Stockholm"
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">
                  Expiry Date
                </label>
                <input
                  type="date"
                  name="expiry_date"
                  value={formData.expiry_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <ChoosePicture
                onSelect={(imageUrl) => {
                  setFormData((prev) => ({ ...prev, image_url: imageUrl }))
                }}
              />

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  Submit
                </button>

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
