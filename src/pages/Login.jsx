import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function Login() {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const navigate = useNavigate()

    const handleSignUp = async (e) => {
        e.preventDefault()
        setLoading(true)
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) alert(error.message)
        else alert('Konto skapat! Du kan nu logga in.')
        setLoading(false)
    }

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) alert(error.message)
        else navigate('/account') // Skicka till kontosidan när det lyckas
        setLoading(false)
    }

    return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        <h1 className="text-2xl font-bold text-center mb-6 text-green-700">Food Rescue Login</h1>
        
        <form className="space-y-4">
          <input
            type="email"
            placeholder="Din e-post"
            className="w-full p-3 border rounded-lg text-black"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Lösenord"
            className="w-full p-3 border rounded-lg text-black"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          
          <div className="flex gap-2">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="flex-1 bg-green-600 text-white p-3 rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-400"
            >
              Logga in
            </button>
            <button
              onClick={handleSignUp}
              disabled={loading}
              className="flex-1 border border-green-600 text-green-600 p-3 rounded-lg font-bold hover:bg-green-50"
            >
              Skapa konto
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}