import { useCallback, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import client, { apiError } from '../api/client'
import { colors, inr, fmtDate, STATUS_LABELS } from '../theme'

const STATUS_COLOR = {
  PLACED: '#1971c2', ACCEPTED: '#0c8599', PACKED: '#e67700',
  OUT_FOR_DELIVERY: '#c2255c', DELIVERED: colors.green, REJECTED: colors.red,
}

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Reload each time the screen gains focus (so a new order shows up).
  useFocusEffect(useCallback(() => {
    setLoading(true)
    client.get('/api/orders')
      .then((r) => setOrders(r.data))
      .catch((e) => setError(apiError(e)))
      .finally(() => setLoading(false))
  }, []))

  if (loading) return <View style={s.center}><ActivityIndicator color={colors.brand} /></View>

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {!!error && <Text style={s.error}>{error}</Text>}
      <FlatList
        data={orders}
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={{ padding: 12, gap: 10 }}
        ListEmptyComponent={<Text style={s.empty}>No orders yet.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => navigation.navigate('OrderDetail', { id: item.id })}>
            <View style={s.row}>
              <Text style={s.num}>{item.orderNumber}</Text>
              <Text style={[s.status, { color: STATUS_COLOR[item.status] }]}>{STATUS_LABELS[item.status]}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.muted}>{fmtDate(item.createdAt)}</Text>
              <Text style={s.amount}>{inr(item.totalAmount)}</Text>
            </View>
            <Text style={s.muted}>{item.items.length} item(s) · {item.paymentMode}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  card: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  num: { fontWeight: '700', color: colors.text },
  status: { fontWeight: '700', fontSize: 13 },
  muted: { color: colors.muted, fontSize: 13 },
  amount: { fontWeight: '700' },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
  error: { backgroundColor: '#ffe3e3', color: colors.red, padding: 10, margin: 10, borderRadius: 8 },
})
