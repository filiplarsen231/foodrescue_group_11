import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate, useParams } from 'react-router'
import { supabase } from './lib/supabase'
import Home from './pages/Home'
import About from './pages/About'
import Listings from './pages/Listings'
import Login from './pages/Login'
import Account from './pages/Account'
import InboxPage from './pages/InboxPage'

function MessagesRedirect() {
  const { id } = useParams()
  return <Navigate to={`/inbox/${id}`} replace />
}
import NotificationsBell from './components/NotificationsBell'

export default function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <BrowserRouter>
      <nav className="flex items-center gap-4 p-4 bg-gray-100">
        <Link to="/" className="text-blue-600 hover:underline">Home</Link>
        <Link to="/about" className="text-blue-600 hover:underline">About</Link>
        <Link to="/listings" className="text-blue-600 hover:underline">My listings</Link>
        <Link to="/inbox" className="text-blue-600 hover:underline">Inbox</Link>
        <div className="ml-auto flex items-center gap-4">
          {user && <NotificationsBell user={user} />}
          {!user ? (
            <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
          ) : (
            <button onClick={handleLogout} className="text-blue-600 hover:underline">Logout</button>
          )}
          {user && <Link to="/account" className="text-blue-600 hover:underline">Account</Link>}
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/login" element={<Login />} />
        <Route path="/account" element={<Account />} />
        <Route path="/messages/:id" element={<MessagesRedirect />} />
        <Route path="/inbox" element={<InboxPage />} />
        <Route path="/inbox/:id" element={<InboxPage />} />
      </Routes>
    </BrowserRouter>
  )
}
