import { BrowserRouter, Routes, Route, Link } from 'react-router'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Home from './pages/Home'
import About from './pages/About'
import Listings from './pages/Listings'
import Login from './pages/Login'
import Account from './pages/Account'
import ChatPage from './pages/ChatPage'
import InboxPage from './pages/InboxPage'

export default function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => authListener.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <BrowserRouter>
      <nav className="flex gap-4 p-4 bg-gray-100">
        <Link to="/" className="text-blue-600 hover:underline">Home</Link>
        <Link to="/about" className="text-blue-600 hover:underline">About</Link>
        <Link to="/listings" className="text-blue-600 hover:underline">My listings</Link>
        <Link to="/inbox" className="text-blue-600 hover:underline">Inbox</Link>
        {!user ? (
          <Link to="/login" className="text-blue-600 hover:underline ml-auto">Login</Link>
        ) : (
          <button onClick={handleLogout} className="text-blue-600 hover:underline ml-auto">Logout</button>
        )}
        {user && <Link to="/account" className="text-blue-600 hover:underline">Account</Link>}
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/login" element={<Login />} />
        <Route path="/account" element={<Account />} />
        <Route path="/messages/:id" element={<ChatPage />} />
        <Route path="/inbox" element={<InboxPage />} />
      </Routes>
    </BrowserRouter>
  )
}
