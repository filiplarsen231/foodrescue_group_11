import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const PAGE_SIZE = 15

async function attachSenderNames(rows) {
  const ids = [...new Set(rows.map((r) => r.sender_id).filter(Boolean))]
  if (ids.length === 0) return rows
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', ids)
  const nameById = new Map((profiles || []).map((p) => [p.id, p.full_name]))
  return rows.map((r) => ({
    ...r,
    senderName: nameById.get(r.sender_id) || 'Someone',
  }))
}

function timeAgo(iso) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime())
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} min ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} h ago`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day} d ago`
  return new Date(iso).toLocaleDateString()
}

export default function NotificationsBell({ user }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const wrapperRef = useRef(null)

  const unreadCount = items.filter((n) => !n.read_at).length

  // Fetch existing notifications + subscribe to new ones
  useEffect(() => {
    if (!user) {
      setItems([])
      return
    }

    let cancelled = false

    const load = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id, type, conversation_id, sender_id, read_at, created_at,
          conversation:conversations ( Listings ( title ) )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE)

      if (cancelled) return
      if (error) {
        console.error('Failed to load notifications:', error.message)
        return
      }
      const withSenders = await attachSenderNames(data || [])
      if (!cancelled) setItems(withSenders)
    }

    load()

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          // The realtime payload doesn't include joined fields, so refetch
          // the one row with its joins.
          const { data } = await supabase
            .from('notifications')
            .select(`
              id, type, conversation_id, sender_id, read_at, created_at,
              conversation:conversations ( Listings ( title ) )
            `)
            .eq('id', payload.new.id)
            .single()
          if (!data) return
          const [enriched] = await attachSenderNames([data])
          setItems((prev) => [enriched, ...prev].slice(0, PAGE_SIZE))
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setItems((prev) =>
            prev.map((n) =>
              n.id === payload.new.id ? { ...n, read_at: payload.new.read_at } : n
            )
          )
        }
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [user])

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const handleClickNotification = async (n) => {
    setOpen(false)
    if (n.conversation_id) {
      navigate(`/messages/${n.conversation_id}`)
    }
    // Mark this one read immediately so the badge feels responsive.
    if (!n.read_at) {
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))
      )
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', n.id)
    }
  }

  if (!user) return null

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full hover:bg-gray-200 transition"
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-gray-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b font-semibold text-gray-800">
            Notifications
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">
                You have no notifications yet.
              </div>
            ) : (
              items.map((n) => {
                const senderName = n.senderName || 'Someone'
                const listingTitle =
                  n.conversation?.Listings?.title || 'a listing'
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClickNotification(n)}
                    className={`w-full text-left px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 transition ${
                      !n.read_at ? 'bg-green-50' : ''
                    }`}
                  >
                    <p className="text-sm text-gray-800">
                      <span className="font-semibold">{senderName}</span> sent
                      you a message about{' '}
                      <span className="font-semibold">{listingTitle}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {timeAgo(n.created_at)}
                    </p>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
