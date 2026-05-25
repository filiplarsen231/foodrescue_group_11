import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ChatPanel from '../components/ChatPanel'

export default function InboxPage() {
  const navigate = useNavigate()
  const { id: selectedId } = useParams()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const fetchConversations = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        navigate('/login')
        return
      }
      setUser(authUser)

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
    <div className="flex h-[calc(100vh-64px)] bg-white">
      {/* Sidebar */}
      <aside className="w-80 border-r flex flex-col bg-white">
        <div className="p-4 border-b">
          <h1 className="text-2xl font-bold text-green-800">Mina Meddelanden</h1>
        </div>

        <div className="flex-grow overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="p-6 text-center text-gray-500">Du har inga aktiva chattar än.</p>
          ) : (
            conversations.map((chat) => {
              const isOwner = chat.owner_id === user?.id
              const roleText = isOwner ? "Din annons" : "Du är intresserad"
              const isSelected = selectedId === chat.id

              return (
                <button
                  key={chat.id}
                  onClick={() => navigate(`/inbox/${chat.id}`)}
                  className={`w-full text-left p-4 border-b transition ${
                    isSelected
                      ? "bg-green-50 border-l-4 border-l-green-600"
                      : "hover:bg-gray-50 border-l-4 border-l-transparent"
                  }`}
                >
                  <h2 className="font-semibold text-gray-800 truncate">
                    {chat.Listings?.title || "Borttagen annons"}
                  </h2>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded mt-1 inline-block uppercase tracking-wider ${
                    isOwner
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}>
                    {roleText}
                  </span>
                </button>
              )
            })
          )}
        </div>
      </aside>

      {/* Chat panel */}
      <ChatPanel conversationId={selectedId} />
    </div>
  )
}
