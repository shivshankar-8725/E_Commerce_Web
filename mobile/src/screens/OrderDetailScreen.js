import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import client, { apiError } from '../api/client'
import { colors, inr, fmtDate, STATUS_LABELS } from '../theme'

const FLOW = ['PLACED', 'ACCEPTED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED']

function Timeline({ status }) {
  const idx = FLOW.indexOf(status)
  return (
    <View style={{ marginTop: 8 }}>
      {FLOW.map((step, i) => {
        const done = i < idx
        const current = i === idx
        return (
          <View key={step} style={s.tlRow}>
            <View style={[s.dot, (done || current) && s.dotOn]} />
            <Text style={[s.tlLabel, (done || current) && s.tlLabelOn]}>{STATUS_LABELS[step]}</Text>
          </View>
        )
      })}
    </View>
  )
}

export default function OrderDetailScreen({ route }) {
  const { id, justPlaced } = route.params
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    client.get(`/api/orders/${id}`)
      .then((r) => setOrder(r.data))
      .catch((e) => setError(apiError(e, 'Order not found.')))
  }, [id])

  if (error) return <View style={s.center}><Text style={s.error}>{error}</Text></View>
  if (!order) return <View style={s.center}><ActivityIndicator color={colors.brand} /></View>

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14 }}>
      {justPlaced && <Text style={s.success}>🎉 Order placed! {order.orderNumber}</Text>}

      <View style={s.card}>
        <Text style={s.num}>{order.orderNumber}</Text>
        <Text style={s.muted}>Placed {fmtDate(order.createdAt)}</Text>
      </View>

      <View style={s.card}>
        <Text style={s.h2}>Track order</Text>
        {order.status === 'REJECTED' ? (
          <Text style={s.rejected}>Order rejected{order.rejectReason ? `: ${order.rejectReason}` : ''}</Text>
        ) : (
          <Timeline status={order.status} />
        )}
      </View>

      <View style={s.card}>
        <Text style={s.h2}>Items</Text>
        {order.items.map((it) => (
          <View key={it.productId} style={s.row}>
            <Text style={{ flex: 1 }}>{it.productName} × {it.quantity}</Text>
            <Text>{inr(it.lineTotal)}</Text>
          </View>
        ))}
        {order.discountAmount > 0 && (
          <View style={s.row}>
            <Text style={{ color: colors.green }}>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</Text>
            <Text style={{ color: colors.green }}>− {inr(order.discountAmount)}</Text>
          </View>
        )}
        <View style={[s.row, { marginTop: 6 }]}>
          <Text style={s.total}>Total</Text><Text style={s.total}>{inr(order.totalAmount)}</Text>
        </View>
        <Text style={s.muted}>Payment: {order.paymentMode} · {order.paymentStatus}</Text>
      </View>

      <View style={s.card}>
        <Text style={s.h2}>Delivery address</Text>
        <Text>{order.address.line1}, {order.address.city} — {order.address.pincode}</Text>
        <Text style={s.muted}>📞 {order.address.phone}</Text>
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  card: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 14 },
  num: { fontWeight: '800', fontSize: 18, color: colors.text },
  muted: { color: colors.muted, fontSize: 13, marginTop: 4 },
  h2: { fontWeight: '700', fontSize: 16, marginBottom: 6, color: colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  total: { fontWeight: '800', fontSize: 16 },
  tlRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: colors.border, backgroundColor: '#fff' },
  dotOn: { backgroundColor: colors.green, borderColor: colors.green },
  tlLabel: { color: colors.muted },
  tlLabelOn: { color: colors.text, fontWeight: '700' },
  rejected: { backgroundColor: '#ffe3e3', color: colors.red, padding: 10, borderRadius: 8 },
  success: { backgroundColor: '#ebfbee', color: colors.green, padding: 10, borderRadius: 8, fontWeight: '700' },
  error: { backgroundColor: '#ffe3e3', color: colors.red, padding: 12, borderRadius: 8, margin: 16 },
})
