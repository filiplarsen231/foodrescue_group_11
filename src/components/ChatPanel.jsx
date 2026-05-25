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
      <div className="flex-grow flex flex-col items-center justify-center bg-gray-50 text-gray-500 gap-2">
        <span className="text-4xl">🌿</span>
        <p>Välj en chatt för att börja prata</p>
      </div>
    )
  }

  const formatDay = (iso) =>
    new Date(iso).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex-grow flex flex-col bg-gray-50 min-h-0">
      <div className="px-5 py-4 bg-white border-b border-gray-200">
        <p className="text-xs uppercase tracking-wider text-green-700 font-semibold">Chatt om</p>
        <h1 className="text-lg font-bold text-gray-900">
          {chatInfo?.Listings?.title || "Laddar chatt..."}
        </h1>
      </div>

      <div className="flex-grow overflow-y-auto px-6 py-6 space-y-1">
        {messages.map((msg, i) => {
          const isMe = msg.sender_id === user?.id
          const prev = messages[i - 1]
          const next = messages[i + 1]
          const prevSameSender = prev && prev.sender_id === msg.sender_id
          const nextSameSender = next && next.sender_id === msg.sender_id
          const showDay = !prev || formatDay(prev.created_at) !== formatDay(msg.created_at)
          const showTimestamp = !nextSameSender ||
            (next && new Date(next.created_at) - new Date(msg.created_at) > 5 * 60 * 1000)

          return (
            <div key={msg.id}>
              {showDay && (
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-grow h-px bg-gray-200" />
                  <span className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">
                    {formatDay(msg.created_at)}
                  </span>
                  <div className="flex-grow h-px bg-gray-200" />
                </div>
              )}
              <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${prevSameSender ? 'mt-0.5' : 'mt-3'}`}>
                <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${
                  isMe
                    ? 'bg-green-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}>
                  <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
              </div>
              {showTimestamp && (
                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mt-1`}>
                  <span className="text-[10px] text-gray-400 px-1">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
              )}
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-200 flex gap-3">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Skriv ett meddelande..."
          className="flex-grow px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
        />
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold shadow-sm hover:shadow transition"
        >
          Skicka
        </button>
      </form>
    </div>
  )
}
