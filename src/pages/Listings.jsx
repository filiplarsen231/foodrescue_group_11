import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router'

export default function Listings() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [editingListing, setEditingListing] = useState(null)
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    address: '',
    expiry_date: ''
  })
  const navigate = useNavigate()

  useEffect(() => {
    checkUserAndFetchListings()
  }, [])

  const checkUserAndFetchListings = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setLoading(false)
      return
    }

    setUser(user)
    await fetchMyListings(user.id)
  }

  const fetchMyListings = async (userId) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('Listings')
      .select('*')
      .eq('user_id', userId)              //Filter to only get the current user's listings

    if (error) {
      console.log("Error fetching listings:", error.message)
      alert("Failed to load your listings: " + error.message)
    } else {
      setListings(data || [])
    }
    setLoading(false)
  }

  const handleDelete = async (listingId) => {
    if (!confirm("Are you sure you want to delete this listing?")) return

    const { error } = await supabase
      .from('Listings')
      .delete()
      .eq('id', listingId)

    if (error) {
      alert("Failed to delete listing: " + error.message)
    } else {
      setListings(listings.filter(item => item.id !== listingId))
      alert("Listing deleted successfully!")
    }
  }

  const handleEdit = (listing) => {
    setEditingListing(listing)
    setEditFormData({
      title: listing.title,
      description: listing.description,
      address: listing.address || '',
      expiry_date: listing.expiry_date || ''
    })
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    
    const { error } = await supabase
      .from('Listings')
      .update(editFormData)
      .eq('id', editingListing.id)

    if (error) {
      alert("Failed to update listing: " + error.message)
    } else {
      // Update the listing in the local state
      setListings(listings.map(item => 
        item.id === editingListing.id ? { ...item, ...editFormData } : item
      ))
      setEditingListing(null)
      alert("Listing updated successfully!")
    }
  }

  const handleEditInputChange = (e) => {
    const { name, value } = e.target
    setEditFormData(prev => ({ ...prev, [name]: value }))
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Loading your listings...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">My Listings</h1>
        <p className="text-gray-600 mb-6">You need to be logged in to view your listings.</p>
        <button
          onClick={() => navigate('/login')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Go to Login
        </button>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Listings</h1>
          <p className="mt-2 text-gray-600">Manage your food rescue listings</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold"
        >
          + Create New Listing
        </button>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">You haven't created any listings yet.</p>
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:underline"
          >
            Create your first listing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((item) => (
            <div key={item.id} className="p-6 border rounded-xl shadow-sm bg-white hover:shadow-md transition">
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-xl font-semibold">{item.title}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <p className="text-gray-600 mb-3">{item.description}</p>
              
              {item.address && (
                <p className="text-sm text-gray-500 mb-2">
                  📍 {item.address}
                </p>
              )}
              
              {item.expiry_date && (
                <p className="text-xs font-bold text-red-500 uppercase">
                  Expires: {new Date(item.expiry_date).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">Edit Listing</h2>
            
            <form onSubmit={handleEditSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={editFormData.title}
                  onChange={handleEditInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditInputChange}
                  required
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={editFormData.address}
                  onChange={handleEditInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">
                  Expiry Date
                </label>
                <input
                  type="date"
                  name="expiry_date"
                  value={editFormData.expiry_date}
                  onChange={handleEditInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingListing(null)}
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