import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { useCart } from '../context/CartContext'
import { colors, inr } from '../theme'

export default function CartScreen({ navigation }) {
  const { items, updateQuantity, removeItem, total } = useCart()

  if (items.length === 0) {
    return (
      <View style={s.center}>
        <Text style={{ fontSize: 40 }}>🛒</Text>
        <Text style={s.muted}>Your cart is empty.</Text>
        <TouchableOpacity style={s.btn} onPress={() => navigation.navigate('Shop')}>
          <Text style={s.btnText}>Browse snacks</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ padding: 12, gap: 10 }}
        renderItem={({ item }) => (
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{item.name}</Text>
              <Text style={s.muted}>{item.weight} · {inr(item.price)}</Text>
            </View>
            <View style={s.qtyRow}>
              <TouchableOpacity style={s.stepBtn} onPress={() => updateQuantity(item.id, item.quantity - 1)}>
                <Text style={s.stepText}>−</Text>
              </TouchableOpacity>
              <Text style={s.qty}>{item.quantity}</Text>
              <TouchableOpacity style={s.stepBtn} onPress={() => updateQuantity(item.id, item.quantity + 1)}
                disabled={item.quantity >= item.stockQty}>
                <Text style={s.stepText}>+</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => removeItem(item.id)}>
              <Text style={s.remove}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <View style={s.footer}>
        <View style={s.totalRow}>
          <Text style={s.muted}>Total</Text>
          <Text style={s.total}>{inr(total)}</Text>
        </View>
        <TouchableOpacity style={s.btn} onPress={() => navigation.navigate('Checkout')}>
          <Text style={s.btnText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg, gap: 10 },
  row: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { fontWeight: '600', color: colors.text },
  muted: { color: colors.muted, fontSize: 13 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: { borderWidth: 1, borderColor: colors.border, width: 32, height: 32, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 18, color: colors.text },
  qty: { minWidth: 22, textAlign: 'center', fontWeight: '600' },
  remove: { color: colors.red, fontSize: 18, paddingHorizontal: 4 },
  footer: { backgroundColor: '#fff', borderTopWidth: 1, borderColor: colors.border, padding: 16 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  total: { fontSize: 20, fontWeight: '800', color: colors.text },
  btn: { backgroundColor: colors.brand, padding: 14, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
})
