import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'
import { Calc_Distance_Multi } from '../components/Distance_calc'

export default function Home() {

  const [listings, setListings] = useState([])
  const [laodingDistance, setLoadingDistance] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    expiry_date: '',
    address: ''
  })

  const [user, setUser] = useState(null)
  const [profileAddress, setProfileAddress] = useState('')

  useEffect(() => {
    const initPage = async () => {
      const { data: fetchedListings, error: listError } = await supabase
        .from('Listings')
        .select('*');

      if (listError) {
        console.log("Fel vid hämtning:", listError.message);
        return;
      }

      
      setListings(fetchedListings);

      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        setUser(authUser);
        const { data: profile } = await supabase
          .from('profiles')
          .select('address')
          .eq('id', authUser.id)
          .single();

        if (profile?.address) {
          const userAd = profile.address;
          setProfileAddress(userAd);
          setFormData(prev => ({ ...prev, address: userAd }));

          if (fetchedListings.length > 0) {
            setLoadingDistance(true);

            const destinations = fetchedListings.map(l => l.address || '');
            console.log("addres", destinations)
            
            const distances = await Calc_Distance_Multi(userAd, destinations);
            console.log("distnace test", distances)

            if (distances) {
              const listWithDist = fetchedListings.map((item, index) => ({
                ...item,
                distanceText: distances[index] 
                  ? (distances[index] / 1000).toFixed(1) + " km" 
                  : "N/A"
              }));
              setListings(listWithDist);
            }
            setLoadingDistance(false);
          }
        }
      }
    };

    initPage();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });
    
    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload() // Enkel refresh för att rensa states
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!user) {
      alert("You must be logged in to create a listing!")
      return
    }
    
    // Include user_id in the listing data
    const listingData = {
      ...formData,
      user_id: user.id
    }
    
    const { data, error } = await supabase
      .from('Listings')
      .insert([listingData])
      .select()
    
    if (error) {
      console.log("Error adding listing:", error.message)
      alert("Failed to add listing! Error: " + error.message) // Show actual error
    } else {
      console.log("Successfully added:", data)
      setListings([...listings, ...data]) // Add new listing to the list
      setShowModal(false) 
      setFormData({ title: '', description: '', expiry_date: '', address: profileAddress })
      alert("Listing added successfully!")
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {listings.length > 0 ? (
          listings.map((item) => (
            <div key={item.id} className="p-4 border rounded-xl shadow-sm bg-white hover:shadow-md transition">
              <h2 className="text-xl font-semibold">{item.title}</h2>
              {item.distanceText &&(
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                  {item.distanceText}
                </span>)}

              <p className="text-gray-500">{item.description}</p>
              {/* Om du har ett datumfält kan du visa det också: */}
              {item.expiry_date && (
                <span className="text-xs font-bold text-red-500 uppercase">
                  Expiration Date: {item.expiry_date}
                </span>
              )}
            </div>
          ))
        ) : (
          <p>Laddar matvaror... (eller så är listan tom)</p>
        )}
      </div>

      {/* Modal Popup */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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

              <div className="flex gap-3">
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