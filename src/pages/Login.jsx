import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const isSignup = mode === 'signup'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    if (isSignup) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) alert(error.message)
      else {
        alert('Konto skapat! Du kan nu logga in.')
        setMode('login')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) alert(error.message)
      else navigate('/account')
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 text-3xl mb-3">
            🌿
          </div>
          <h1 className="text-2xl font-bold text-green-800">Food Rescue</h1>
          <p className="text-sm text-gray-600 mt-1">
            {isSignup ? "Skapa ett konto för att börja dela mat." : "Välkommen tillbaka! Logga in för att fortsätta."}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex p-1 bg-gray-100 rounded-full mb-6">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${
                !isSignup ? 'bg-white text-green-800 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Logga in
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${
                isSignup ? 'bg-white text-green-800 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Skapa konto
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">E-post</label>
              <input
                type="email"
                placeholder="namn@exempel.se"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Lösenord</label>
              <input
                type="password"
                placeholder={isSignup ? "Välj ett säkert lösenord" : "Ditt lösenord"}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-full shadow-sm hover:shadow-md transition disabled:bg-gray-300 disabled:shadow-none"
            >
              {loading ? "Vänta..." : isSignup ? "Skapa konto" : "Logga in"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-5">
            {isSignup ? "Har du redan ett konto?" : "Ny här?"}{' '}
            <button
              type="button"
              onClick={() => setMode(isSignup ? 'login' : 'signup')}
              className="text-green-700 font-semibold hover:underline"
            >
              {isSignup ? "Logga in" : "Skapa ett konto"}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
