import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ChatPage() {
  const { id: conversationId } = useParams() // Hämtar ID från URL:en
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [user, setUser] = useState(null)
  const [chatInfo, setChatInfo] = useState(null)
  const messagesEndRef = useRef(null) // För att scrolla till botten

  // Scrolla till botten när nya meddelanden kommer
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    const initChat = async () => {
      // 1. Kolla användare
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        navigate('/login')
        return
      }
      setUser(authUser)

      // 2. Hämta info om konversationen (vad pratar vi om?)
      const { data: convData } = await supabase
        .from('conversations')
        .select('*, Listings(title)')
        .eq('id', conversationId)
        .single()
      
      setChatInfo(convData)

      // 3. Hämta gamla meddelanden
      const { data: oldMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
      
      if (oldMessages) setMessages(oldMessages)
      scrollToBottom()
    }

    initChat()

    // 4. REALTIME: Lyssna på nya meddelanden
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new])
          setTimeout(scrollToBottom, 100) // Scrolla ner efter rendering
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const { error } = await supabase
      .from('messages')
      .insert([
        {
          conversation_id: conversationId,
          content: newMessage,
          sender_id: user.id
        }
      ])

    if (error) {
      alert("Kunde inte skicka meddelande")
    } else {
      setNewMessage('')
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="p-4 bg-white shadow-md flex items-center">
        <button onClick={() => navigate(-1)} className="mr-4 text-blue-600 font-bold">← Bakåt</button>
        <h1 className="text-xl font-bold">
          {chatInfo?.Listings?.title ? `Chatt om: ${chatInfo.Listings.title}` : "Laddar chatt..."}
        </h1>
      </div>

      {/* Meddelande-lista */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] p-3 rounded-2xl shadow-sm ${
                isMe ? 'bg-green-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'
              }`}>
                <p>{msg.content}</p>
                <span className="text-[10px] opacity-70 block mt-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input-fält */}
      <form onSubmit={sendMessage} className="p-4 bg-white border-t flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Skriv ett meddelande..."
          className="flex-grow p-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-full font-bold hover:bg-green-700 transition">
          Skicka
        </button>
      </form>
    </div>
  )
}