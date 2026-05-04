import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function InboxPage() {
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const fetchConversations = async () => {
      // 1. Hämta inloggad användare
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        navigate('/login')
        return
      }
      setUser(authUser)

      // 2. Hämta alla chattar där användaren är inblandad
      // Här använder vi .or() för att kolla både owner_id och seeker_id
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          owner_id,
          seeker_id,
          Listings ( title ),
          messages ( id )
        `)
        .or(`owner_id.eq.${authUser.id},seeker_id.eq.${authUser.id}`)

        // LÄGG TILL DESSA TVÅ RADER FÖR ATT FELSÖKA:
        console.log("DEBUG INBOX - Datan vi fick:", data);
        console.log("DEBUG INBOX - Eventuella fel:", error);

      if (error) {
        console.error("Fel vid hämtning av chattar:", error.message)
      } else {
        const activeChats = data.filter(chat => chat.messages && chat.messages.length > 0)
        setConversations(activeChats)
      }
      setLoading(false)
    }

    fetchConversations()
  }, [navigate])

  if (loading) return <div className="p-8 text-center text-gray-500">Laddar din inkorg...</div>

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-green-800 mb-6">Mina Meddelanden</h1>

      {conversations.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl shadow-sm border">
          <p className="text-gray-500">Du har inga aktiva chattar än.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {conversations.map((chat) => {
            // Logik för att se om det är min annons eller någon annans
            const isOwner = chat.owner_id === user?.id
            const roleText = isOwner ? "Din annons" : "Du är intresserad"
            
            return (
              <div
                key={chat.id}
                onClick={() => navigate(`/messages/${chat.id}`)}
                className="p-5 border rounded-xl shadow-sm bg-white hover:shadow-md hover:border-green-500 transition cursor-pointer flex justify-between items-center group"
              >
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 group-hover:text-green-700 transition">
                    {chat.Listings?.title || "Borttagen annons"}
                  </h2>
                  <span className={`text-xs font-bold px-2 py-1 rounded mt-2 inline-block uppercase tracking-wider ${
                    isOwner 
                      ? "bg-blue-100 text-blue-800" 
                      : "bg-green-100 text-green-800"
                  }`}>
                    {roleText}
                  </span>
                </div>
                
                <div className="text-green-600 font-bold opacity-0 group-hover:opacity-100 transition translate-x-2 group-hover:translate-x-0">
                  Öppna chatt →
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}