import { useEffect, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native'
import client, { apiError } from '../api/client'
import { useCart } from '../context/CartContext'
import { colors, inr } from '../theme'

const EMPTY = { line1: '', city: '', pincode: '', phone: '' }

export default function CheckoutScreen({ navigation }) {
  const { items, total, clearCart } = useCart()
  const [addresses, setAddresses] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [pincodeMsg, setPincodeMsg] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  useEffect(() => { loadAddresses() }, [])

  function loadAddresses() {
    client.get('/api/addresses')
      .then((r) => {
        setAddresses(r.data)
        if (r.data.length > 0) { setSelectedId(r.data[0].id); setShowNew(false) }
        else setShowNew(true)
      })
      .catch((e) => setError(apiError(e)))
      .finally(() => setLoading(false))
  }

  function checkPincode(pin) {
    if (!/^\d{6}$/.test(pin)) { setPincodeMsg(null); return }
    client.get(`/api/pincodes/check/${pin}`)
      .then((r) => setPincodeMsg({ ok: r.data.allowed, text: r.data.message }))
      .catch(() => setPincodeMsg(null))
  }

  async function saveAddress() {
    setError('')
    try {
      const { data } = await client.post('/api/addresses', form)
      setForm(EMPTY); setShowNew(false)
      setAddresses((p) => [data, ...p]); setSelectedId(data.id)
    } catch (e) {
      const fe = e?.response?.data?.errors
      setError(fe ? Object.values(fe).join(' ') : apiError(e))
    }
  }

  async function placeOrder() {
    setError('')
    if (!selectedId) { setError('Please select or add a delivery address.'); return }
    setPlacing(true)
    try {
      const { data } = await client.post('/api/orders', {
        addressId: selectedId, paymentMode: 'COD',
        items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
      })
      clearCart()
      navigation.replace('OrderDetail', { id: data.id, justPlaced: true })
    } catch (e) {
      setError(apiError(e, 'Could not place order.'))
    } finally {
      setPlacing(false)
    }
  }

  if (loading) return <View style={s.center}><ActivityIndicator color={colors.brand} /></View>

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14 }}>
      {!!error && <Text style={s.error}>{error}</Text>}

      <View style={s.card}>
        <Text style={s.h2}>Delivery address</Text>
        {!showNew && addresses.map((a) => (
          <TouchableOpacity key={a.id} style={s.addrRow} onPress={() => setSelectedId(a.id)}>
            <View style={[s.radio, selectedId === a.id && s.radioOn]} />
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{a.line1}, {a.city} — {a.pincode}</Text>
              <Text style={s.muted}>📞 {a.phone}</Text>
            </View>
          </TouchableOpacity>
        ))}
        {!showNew && (
          <TouchableOpacity onPress={() => setShowNew(true)}><Text style={s.link}>+ Add new address</Text></TouchableOpacity>
        )}

        {showNew && (
          <View>
            <TextInput style={s.input} placeholder="Address line" value={form.line1} onChangeText={(v) => set('line1', v)} />
            <TextInput style={s.input} placeholder="City" value={form.city} onChangeText={(v) => set('city', v)} />
            <TextInput style={s.input} placeholder="6-digit pincode" keyboardType="number-pad" maxLength={6}
              value={form.pincode} onChangeText={(v) => { set('pincode', v); checkPincode(v) }} />
            {pincodeMsg && (
              <Text style={[s.pin, { color: pincodeMsg.ok ? colors.green : colors.red }]}>{pincodeMsg.text}</Text>
            )}
            <TextInput style={s.input} placeholder="10-digit phone" keyboardType="number-pad" maxLength={10}
              value={form.phone} onChangeText={(v) => set('phone', v)} />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <TouchableOpacity style={s.btn} onPress={saveAddress}><Text style={s.btnText}>Save address</Text></TouchableOpacity>
              {addresses.length > 0 && (
                <TouchableOpacity style={[s.btn, s.btnSecondary]} onPress={() => setShowNew(false)}>
                  <Text style={[s.btnText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>

      <View style={s.card}>
        <Text style={s.h2}>Order summary</Text>
        {items.map((i) => (
          <View key={i.id} style={s.sumRow}>
            <Text style={{ flex: 1 }}>{i.name} × {i.quantity}</Text>
            <Text>{inr(i.price * i.quantity)}</Text>
          </View>
        ))}
        <View style={[s.sumRow, { marginTop: 8 }]}>
          <Text style={s.total}>Total</Text><Text style={s.total}>{inr(total)}</Text>
        </View>
        <Text style={s.codNote}>Payment: Cash on Delivery (COD)</Text>
        <TouchableOpacity style={[s.btn, placing && s.btnDisabled]} onPress={placeOrder} disabled={placing}>
          <Text style={s.btnText}>{placing ? 'Placing...' : `Place Order · ${inr(total)}`}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  card: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 14 },
  h2: { fontWeight: '700', fontSize: 16, marginBottom: 8, color: colors.text },
  addrRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border },
  radioOn: { borderColor: colors.brand, backgroundColor: colors.brand },
  name: { color: colors.text },
  muted: { color: colors.muted, fontSize: 13 },
  link: { color: colors.brand, marginTop: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, marginTop: 8 },
  pin: { marginTop: 6 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  total: { fontWeight: '800', fontSize: 16 },
  codNote: { backgroundColor: '#e7f5ff', color: '#1971c2', padding: 8, borderRadius: 8, marginTop: 10, textAlign: 'center' },
  btn: { backgroundColor: colors.brand, padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 10, flexGrow: 1 },
  btnSecondary: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border },
  btnDisabled: { backgroundColor: '#c0c4c9' },
  btnText: { color: '#fff', fontWeight: '700' },
  error: { backgroundColor: '#ffe3e3', color: colors.red, padding: 10, borderRadius: 8 },
})
