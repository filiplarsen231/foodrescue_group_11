import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate, useParams } from 'react-router'
import { supabase } from './lib/supabase'
import Home from './pages/Home'
import About from './pages/About'
import Listings from './pages/Listings'
import Login from './pages/Login'
import Account from './pages/Account'
import InboxPage from './pages/InboxPage'
import NotificationsBell from './components/NotificationsBell'

function MessagesRedirect() {
  const { id } = useParams()
  return <Navigate to={`/inbox/${id}`} replace />
}

const navLinkClass = ({ isActive }) =>
  `px-3 py-2 rounded-md text-sm font-medium transition ${
    isActive
      ? 'bg-green-50 text-green-800'
      : 'text-gray-700 hover:bg-green-50 hover:text-green-800'
  }`

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
      <div className="min-h-screen bg-gray-50 text-gray-800">
        <nav className="flex items-center gap-2 px-6 py-3 bg-white border-b border-gray-200 sticky top-0 z-30">
          <NavLink to="/" className="flex items-center gap-2 mr-4">
            <span className="text-2xl">🌿</span>
            <span className="text-lg font-bold text-green-700 tracking-tight">Food Rescue</span>
          </NavLink>
          <NavLink to="/" end className={navLinkClass}>Home</NavLink>
          <NavLink to="/about" className={navLinkClass}>About</NavLink>
          <NavLink to="/listings" className={navLinkClass}>My listings</NavLink>
          <NavLink to="/inbox" className={navLinkClass}>Inbox</NavLink>
          <div className="ml-auto flex items-center gap-2">
            {user && <NotificationsBell user={user} />}
            {!user ? (
              <NavLink to="/login" className="px-4 py-2 rounded-md text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition">
                Login
              </NavLink>
            ) : (
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-800 transition"
              >
                Logout
              </button>
            )}
            {user && (
              <NavLink to="/account" className={navLinkClass}>Account</NavLink>
            )}
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
      </div>
    </BrowserRouter>
  )
}
