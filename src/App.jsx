import { BrowserRouter, Routes, Route, Link } from 'react-router'
import Home from './pages/Home'
import About from './pages/About'
import Listings from './pages/Listings'
import Login from './pages/Login'
import Account from './pages/Account'

export default function App() {
  return (
    <BrowserRouter>
      <nav className="flex gap-4 p-4 bg-gray-100">
        <Link to="/" className="text-blue-600 hover:underline">Home</Link>
        <Link to="/about" className="text-blue-600 hover:underline">About</Link>
        <Link to="/listings" className="text-blue-600 hover:underline">My listings</Link>
        <Link to="/login" className="text-blue-600 hover:underline ml-auto">Login</Link>
        <Link to="/account" className="text-blue-600 hover:underline">Account</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/login" element={<Login />} />
        <Route path="/account" element={<Account />} />
      </Routes>
    </BrowserRouter>
  )
}
