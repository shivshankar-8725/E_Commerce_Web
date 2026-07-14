import { useEffect, useState } from 'react'
import client, { apiError } from '../../api/client'
import { fmtDate } from '../../utils'

const STATUS_BADGE = {
  PENDING: { cls: 'status PACKED', label: 'Pending' },
  APPROVED: { cls: 'status DELIVERED', label: 'Approved' },
  REJECTED: { cls: 'status REJECTED', label: 'Rejected' },
}

export default function AdminDealers() {
  const [dealers, setDealers] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [rejecting, setRejecting] = useState(null) // dealer being rejected
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { load() }, [filter])

  function load() {
    const params = filter === 'ALL' ? {} : { status: filter }
    client.get('/api/admin/dealers', { params })
      .then((r) => setDealers(r.data))
      .catch((e) => setError(apiError(e)))
  }

  async function approve(d) {
    setError(''); setMsg(''); setBusy(true)
    try {
      await client.patch(`/api/admin/dealers/${d.id}/approve`)
      setMsg(`${d.shopName} approved. They can now log in and see wholesale prices.`)
      load()
    } catch (e) { setError(apiError(e)) } finally { setBusy(false) }
  }

  async function reject() {
    if (!reason.trim()) { setError('Please enter a rejection reason.'); return }
    setError(''); setMsg(''); setBusy(true)
    try {
      await client.patch(`/api/admin/dealers/${rejecting.id}/reject`, { reason: reason.trim() })
      setMsg(`${rejecting.shopName} rejected. The reason will be shown to them at login.`)
      setRejecting(null); setReason('')
      load()
    } catch (e) { setError(apiError(e)) } finally { setBusy(false) }
  }

  return (
    <div className="container">
      <div className="between">
        <h1>Dealers</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="ALL">All</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>
      {error && <div className="alert error">{error}</div>}
      {msg && <div className="alert success">{msg}</div>}

      <div className="card table-wrap mt">
        <table>
          <thead>
            <tr><th>Shop</th><th>Contact</th><th>GST</th><th>Registered</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {dealers.map((d) => {
              const badge = STATUS_BADGE[d.approvalStatus] || { cls: 'status', label: d.approvalStatus }
              return (
                <tr key={d.id}>
                  <td>
                    <strong>{d.shopName}</strong>
                    <div className="muted" style={{ fontSize: '0.8rem' }}>{d.name}</div>
                  </td>
                  <td>{d.mobile}<br /><span className="muted" style={{ fontSize: '0.8rem' }}>{d.email || '—'}</span></td>
                  <td>{d.gstNumber || '—'}</td>
                  <td className="muted">{fmtDate(d.createdAt)}</td>
                  <td>
                    <span className={badge.cls}>{badge.label}</span>
                    {d.approvalStatus === 'REJECTED' && d.rejectionReason && (
                      <div className="muted" style={{ fontSize: '0.78rem' }}>{d.rejectionReason}</div>
                    )}
                  </td>
                  <td>
                    <div className="row">
                      {d.approvalStatus !== 'APPROVED' && (
                        <button className="small" onClick={() => approve(d)} disabled={busy}>Approve</button>
                      )}
                      {d.approvalStatus !== 'REJECTED' && (
                        <button className="danger small" onClick={() => { setRejecting(d); setReason('') }} disabled={busy}>Reject</button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {dealers.length === 0 && <tr><td colSpan={6} className="empty">No dealers in this view.</td></tr>}
          </tbody>
        </table>
      </div>

      {rejecting && (
        <div className="modal-overlay" onClick={() => setRejecting(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Reject {rejecting.shopName}</h2>
            <label>Reason (shown to the dealer)</label>
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g. Could not verify GST / shop details" />
            <div className="row mt">
              <button className="danger" onClick={reject} disabled={busy}>Confirm reject</button>
              <button className="secondary" onClick={() => setRejecting(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
