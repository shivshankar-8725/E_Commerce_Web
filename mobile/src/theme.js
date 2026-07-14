export const colors = {
  brand: '#e8590c',
  brandDark: '#d9480f',
  bg: '#f6f7f9',
  card: '#ffffff',
  text: '#1f2933',
  muted: '#66737f',
  border: '#e3e8ee',
  green: '#2b8a3e',
  red: '#c92a2a',
  yellow: '#e67700',
}

export function inr(amount) {
  return '₹' + Number(amount || 0).toFixed(2)
}

export const STATUS_LABELS = {
  PLACED: 'Placed',
  ACCEPTED: 'Accepted',
  PACKED: 'Packed',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  REJECTED: 'Rejected',
}

export function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString()
}
