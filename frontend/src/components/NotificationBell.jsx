import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import { fmtDate } from '../utils'

const ICON = { NEW_ORDER: '🧾', ORDER_STATUS: '🚚', DEALER_REQUEST: '🏪' }

export default function NotificationBell() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const ref = useRef(null)

  async function loadCount() {
    try {
      const { data } = await client.get('/api/notifications/unread-count')
      setUnread(data.count)
    } catch { /* ignore */ }
  }

  async function loadList() {
    try {
      const { data } = await client.get('/api/notifications')
      setItems(data)
    } catch { /* ignore */ }
  }

  // Poll the unread count so new notifications appear without a refresh.
  useEffect(() => {
    loadCount()
    const id = setInterval(loadCount, 30000)
    return () => clearInterval(id)
  }, [])

  // Close on outside click.
  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  async function toggle() {
    const next = !open
    setOpen(next)
    if (next) {
      await loadList()
      if (unread > 0) {
        client.post('/api/notifications/read-all').catch(() => {})
        setUnread(0)
      }
    }
  }

  function openItem(n) {
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  return (
    <div className="notif" ref={ref}>
      <button className="notif-btn" onClick={toggle} title="Notifications">
        🔔
        {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="notif-menu">
          <div className="notif-head">Notifications</div>
          {items.length === 0 ? (
            <div className="notif-empty">No notifications yet.</div>
          ) : (
            items.map((n) => (
              <button key={n.id} className={`notif-item ${!n.isRead ? 'unread' : ''}`} onClick={() => openItem(n)}>
                <span className="notif-icon">{ICON[n.type] || '🔔'}</span>
                <span className="notif-body">
                  <span className="notif-title">{n.title}</span>
                  <span className="notif-msg">{n.message}</span>
                  <span className="notif-time">{fmtDate(n.createdAt)}</span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
