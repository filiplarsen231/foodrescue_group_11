import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function ChatPanel({ conversationId }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [user, setUser] = useState(null)
  const [chatInfo, setChatInfo] = useState(null)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (!conversationId) return

    const initChat = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return
      setUser(authUser)

      const { data: convData } = await supabase
        .from('conversations')
        .select('*, Listings(title)')
        .eq('id', conversationId)
        .single()
      setChatInfo(convData)

      const { data: oldMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (oldMessages) setMessages(oldMessages)
      setTimeout(scrollToBottom, 50)

      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', authUser.id)
        .eq('conversation_id', conversationId)
        .is('read_at', null)
    }

    initChat()

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
          setTimeout(scrollToBottom, 100)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      setMessages([])
      setChatInfo(null)
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

  if (!conversationId) {
    return (
      <div className="flex-grow flex items-center justify-center bg-gray-50 text-gray-500">
        Välj en chatt för att börja prata
      </div>
    )
  }

  return (
    <div className="flex-grow flex flex-col bg-gray-100 min-h-0">
      <div className="p-4 bg-white shadow-sm border-b">
        <h1 className="text-xl font-bold">
          {chatInfo?.Listings?.title ? `Chatt om: ${chatInfo.Listings.title}` : "Laddar chatt..."}
        </h1>
      </div>

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
