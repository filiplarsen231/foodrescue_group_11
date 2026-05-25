import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import ChoosePicture from '../components/ChoosePicture'
import Camera from '../components/Camera'
import { Calc_Distance_Multi } from '../components/Distance_calc'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()
  const [listings, setListings] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loadingDistance, setLoadingDistance] = useState(false)
  const [user, setUser] = useState(null)
  const [profileAddress, setProfileAddress] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [selectedListing, setSelectedListing] = useState(null)
  const [ownerName, setOwnerName] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    expiry_date: '',
    address: '',
    image_url: '',
    image_taken_at: '',
  })

  const openListing = async (listing) => {
    setSelectedListing(listing)
    setOwnerName('')
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', listing.user_id)
      .single()
    const firstName = data?.full_name?.trim().split(/\s+/)[0] || 'Someone'
    setOwnerName(firstName)
  }

  const closeListing = () => {
    setSelectedListing(null)
    setOwnerName('')
  }

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
      navigate(`/inbox/${existingChat.id}`)
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
        navigate(`/inbox/${newChat.id}`)
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

  useEffect(() => {
    if (!selectedListing) return
    const onKey = (e) => { if (e.key === 'Escape') closeListing() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [selectedListing])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  const addressInputRef = useRef(null)

  useEffect(() => {
    let checkGoogleInterval = null;
    let autocomplete = null;

    // Vi kör bara detta om modalen är öppen
    if (showModal) {
      const initGooglePlaces = () => {
        if (addressInputRef.current && window.google && window.google.maps && window.google.maps.places) {
          autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
            types: ["address"],
            componentRestrictions: { country: "se" },
          })

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace()
            
            let streetName = "";
            let streetNumber = "";
            let city = "";

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
            
            // Uppdatera formData med den nya adressen
            setFormData(prev => ({ ...prev, address: perfectAddress }));
            
            // Tvinga input-fältet att visa den formaterade adressen direkt
            if (addressInputRef.current) {
              addressInputRef.current.value = perfectAddress;
            }
          })
        }
      }

      // Kolla om Google är laddat, kör isåfall init direkt
      if (window.google && window.google.maps) {
        initGooglePlaces();
      } else {
        // Annars, polla tills det är laddat
        checkGoogleInterval = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(checkGoogleInterval)
            initGooglePlaces()
          }
        }, 500)
      }
    }

    // Cleanup-funktion: Rensar intervallet om modalen stängs innan Google hann laddas
    return () => {
      if (checkGoogleInterval) clearInterval(checkGoogleInterval)
      // För att undvika minnesläckor kan vi också nolla autocomplete-instansen här om vi velat,
      // men Google sköter oftast det bra när input-elementet försvinner.
    }
  }, [showModal])

  const handleImageSelect = (imageUrl, previewUrl, imageTakenAt) => {
    setFormData((prev) => ({
      ...prev,
      image_url: imageUrl,
      image_taken_at: imageTakenAt || Date.now(),
    }))

    setImagePreview(previewUrl || imageUrl)
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
      image_taken_at: formData.image_taken_at || Date.now(),
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
      image_taken_at: '',
    })
    setImagePreview('')
    alert('Listing added successfully!')
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  function daysAgo(timestamp) {
    if (!timestamp) return "Picture taken today"

    const now = Date.now()
    const diffMs = now - Number(timestamp)
    const days = Math.floor(diffMs / 86400000)

    if (days <= 0) return "Picture taken today"
    if (days === 1) return "Picture taken 1 day ago"

    return `Picture taken ${days} days ago`
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Food Feed</h1>
          <p className="mt-2 text-gray-600">Welcome to the Food Rescue app!</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition"
        >
          + Add New Listing
        </button>
      </div>

      {loadingDistance && (
        <p className="text-sm text-gray-500 mb-2">Calculating distances…</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {listings.length > 0 ? (
          listings.map((item) => (
            <div
              key={item.id}
              onClick={() => openListing(item)}
              className="border rounded-xl shadow-sm bg-white hover:shadow-md transition cursor-pointer overflow-hidden"
            >
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                  No image
                </div>
              )}
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-800">{item.title}</h2>
                {item.distanceText && (
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mt-2 inline-block">
                    {item.distanceText}
                  </span>
                )}
                {item.expiry_date && (
                  <p className="text-xs font-bold text-gray-900 uppercase mt-2">
                    Expiration date: {item.expiry_date}
                    {new Date(item.expiry_date) < new Date() && (
                      <span className="ml-2 text-xs font-bold text-gray-700">Past</span>
                    )}
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <p>Laddar matvaror... (eller så är listan tom)</p>
        )}
      </div>

      {selectedListing && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40"
          onClick={(e) => { if (e.target === e.currentTarget) closeListing() }}
        >
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button
              onClick={closeListing}
              aria-label="Close"
              className="absolute top-3 right-3 bg-white/90 hover:bg-gray-100 rounded-full w-9 h-9 flex items-center justify-center shadow text-gray-700 z-10"
            >
              ✕
            </button>

            {selectedListing.image_url && (
              <img
                src={selectedListing.image_url}
                alt={selectedListing.title}
                className="w-full h-64 object-cover rounded-t-2xl"
              />
            )}

            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedListing.title}</h2>
                {selectedListing.distanceText && (
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mt-2 inline-block">
                    {selectedListing.distanceText}
                  </span>
                )}
              </div>

              {selectedListing.description && (
                <p className="text-gray-700 whitespace-pre-wrap">{selectedListing.description}</p>
              )}

              {selectedListing.expiry_date && (
                <div className="text-sm">
                  <span className="font-semibold text-gray-700">Expiration date: </span>
                  <span className="text-gray-900 font-bold">{selectedListing.expiry_date}</span>
                  {new Date(selectedListing.expiry_date) < new Date() && (
                    <span className="ml-2 text-xs font-bold text-gray-700 uppercase">Past</span>
                  )}
                </div>
              )}

              {selectedListing.address && (
                <div className="text-sm">
                  <span className="font-semibold text-gray-700">Address: </span>
                  <span className="text-gray-600">{selectedListing.address}</span>
                </div>
              )}

              {selectedListing.image_url && (
                <p className="text-xs text-gray-500">{daysAgo(selectedListing.image_taken_at)}</p>
              )}

              {ownerName && (
                <p className="text-sm text-gray-600">
                  Listed by <span className="font-semibold">{ownerName}</span>
                </p>
              )}

              <button
                onClick={() => handleContact(selectedListing)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition"
              >
                I'm Interested / Chat
              </button>
            </div>
          </div>
        </div>
      )}

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
                  ref={addressInputRef} // Koppla referensen
                  type="text"
                  name="address"
                  // Vi sätter defaultValue istället för value så att Autocomplete kan sköta fältet smidigare
                  defaultValue={formData.address} 
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    // Förhindra att formuläret skickas om man trycker Enter i adresslistan
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
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

              <div className="mb-6">
                <p className="font-semibold mb-2">Add Picture</p>

                <div className="flex gap-3 items-start">
                  <ChoosePicture onSelect={handleImageSelect} />
                  <Camera onSelect={handleImageSelect} />
                </div>

                {imagePreview && (
                  <div className="mt-3">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded border"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  Submit
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setFormData({
                      title: '',
                      description: '',
                      expiry_date: '',
                      address: profileAddress,
                      image_url: '',
                      image_taken_at: '',
                    })
                    setImagePreview('')
                  }}
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