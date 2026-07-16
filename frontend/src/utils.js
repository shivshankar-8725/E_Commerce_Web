// Format a number as Indian Rupees.
export function inr(amount) {
  const n = Number(amount || 0)
  return '₹' + n.toFixed(2)
}

// Effective price for the current viewer. Dealers receive wholesalePrice (retail is null);
// customers receive retailPrice (wholesale is null). See P2-DEAL-03.
export function productPrice(p) {
  return p.wholesalePrice != null ? p.wholesalePrice : p.retailPrice
}

// True when the product is being shown at wholesale (i.e. viewer is an approved dealer).
export function isWholesale(p) {
  return p.wholesalePrice != null
}

// Resolve a product image URL (backend returns relative /uploads/.. paths).
export function imgSrc(url) {
  if (!url) return null
  if (url.startsWith('http')) return url
  return url // /uploads/.. is proxied by Vite in dev
}

// Friendly date
export function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// Date only (no time) — used for estimated delivery
export function fmtDateOnly(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
}

// Loads the Razorpay Checkout script once and resolves when window.Razorpay is ready.
let razorpayPromise = null
export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(true)
  if (razorpayPromise) return razorpayPromise
  razorpayPromise = new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => { razorpayPromise = null; resolve(false) }
    document.body.appendChild(script)
  })
  return razorpayPromise
}

// P3-PAY-03: a single, clear payment indicator. Online-paid orders are visually distinct (green).
export function paymentInfo(order) {
  const paid = order.paymentStatus === 'PAID'
  if (order.paymentMode === 'ONLINE') {
    return paid
      ? { label: 'Paid online', bg: '#ebfbee', color: '#2b8a3e' }
      : { label: 'Online · pending', bg: '#fff3bf', color: '#e67700' }
  }
  if (order.paymentMode === 'UPI_QR') {
    return paid
      ? { label: 'UPI · paid', bg: '#ebfbee', color: '#2b8a3e' }
      : { label: 'UPI · pending', bg: '#fff3bf', color: '#e67700' }
  }
  if (paid) return { label: 'COD · paid', bg: '#ebfbee', color: '#2b8a3e' }
  return { label: 'COD', bg: '#f1f3f5', color: '#495057' }
}

export const STATUS_LABELS = {
  PLACED: 'Placed',
  ACCEPTED: 'Accepted',
  PACKED: 'Packed',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
}
