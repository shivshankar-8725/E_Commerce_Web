import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'
import ConfirmDialog from './ConfirmDialog'

export default function ProfileMenu() {
  const { user, isAdmin, isDealer, logout } = useAuth()
  const roleLabel = isAdmin ? 'Admin' : isDealer ? 'Dealer' : 'Customer'
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [addresses, setAddresses] = useState([])
  const ref = useRef(null)

  // Close when clicking outside the menu.
  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  // Load saved addresses when the menu is opened (customers/dealers only — admins have none).
  useEffect(() => {
    if (open && !isAdmin) {
      client.get('/api/addresses').then((r) => setAddresses(r.data)).catch(() => {})
    }
  }, [open, isAdmin])

  function askLogout() {
    setOpen(false)
    setConfirm(true)
  }

  function doLogout() {
    setConfirm(false)
    logout()
    navigate('/login')
  }

  return (
    <>
    <div className="profile" ref={ref}>
      <button className="profile-btn" onClick={() => setOpen((o) => !o)}>
        👤 {user.name.split(' ')[0]} <span style={{ fontSize: '0.7rem' }}>▾</span>
      </button>

      {open && (
        <div className="profile-menu">
          <div className="profile-head">
            <div className="profile-name">
              {user.name}
              <span className="role-tag">{roleLabel}</span>
            </div>
          </div>

          <div className="profile-row">
            <span className="profile-label">Mobile</span>
            <span>{user.mobile}</span>
          </div>

          {!isAdmin && (
            <div className="profile-section">
              <div className="profile-label">Address</div>
              {addresses.length === 0 ? (
                <div className="muted" style={{ fontSize: '0.85rem', marginTop: 4 }}>
                  No saved address yet. Add one at checkout.
                </div>
              ) : (
                addresses.map((a) => (
                  <div key={a.id} className="profile-addr">
                    {a.line1}, {a.city} — {a.pincode}<br />📞 {a.phone}
                  </div>
                ))
              )}
              <button className="profile-manage" onClick={() => { setOpen(false); navigate('/addresses') }}>
                Manage addresses
              </button>
            </div>
          )}

          <button className="profile-logout" onClick={askLogout}>Logout</button>
        </div>
      )}
    </div>

    {confirm && (
      <ConfirmDialog
        title="Logout?"
        message="Are you sure you want to log out of your E-Mart account?"
        confirmLabel="Logout"
        danger
        onConfirm={doLogout}
        onCancel={() => setConfirm(false)}
      />
    )}
    </>
  )
}
