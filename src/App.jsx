import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'
import Listings from './pages/Listings'

export default function App() {
  return (
    <BrowserRouter>
      <nav className="flex gap-4 p-4 bg-gray-100">
        <Link to="/" className="text-blue-600 hover:underline">Home</Link>
        <Link to="/about" className="text-blue-600 hover:underline">About</Link>
        <Link to="/listings" className="text-blue-600 hover:underline">Listings</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/listings" element={<Listings />} />
      </Routes>
    </BrowserRouter>
  )
}
