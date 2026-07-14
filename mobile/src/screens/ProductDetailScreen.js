import { useEffect, useState } from 'react'
import {
  View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native'
import client, { apiError } from '../api/client'
import { API_BASE_URL } from '../config'
import { useCart } from '../context/CartContext'
import { colors, inr } from '../theme'

export default function ProductDetailScreen({ route, navigation }) {
  const { id } = route.params
  const { addItem } = useCart()
  const [product, setProduct] = useState(null)
  const [qty, setQty] = useState(1)
  const [error, setError] = useState('')
  const [added, setAdded] = useState(false)

  useEffect(() => {
    client.get(`/api/products/${id}`)
      .then((r) => setProduct(r.data))
      .catch((e) => setError(apiError(e, 'Product not found.')))
  }, [id])

  if (error) return <View style={s.center}><Text style={s.error}>{error}</Text></View>
  if (!product) return <View style={s.center}><ActivityIndicator color={colors.brand} /></View>

  const out = !product.inStock
  const max = product.stockQty
  const uri = product.imageUrl ? (product.imageUrl.startsWith('http') ? product.imageUrl : API_BASE_URL + product.imageUrl) : null
  const price = product.wholesalePrice != null ? product.wholesalePrice : product.retailPrice

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16 }}>
      <View style={s.imgBox}>
        {uri ? <Image source={{ uri }} style={s.img} /> : <Text style={{ fontSize: 60 }}>🥨</Text>}
      </View>
      <Text style={s.name}>{product.name}</Text>
      {!!product.categoryName && <Text style={s.muted}>{product.categoryName}</Text>}
      <Text style={s.weight}>{product.weight}</Text>
      <Text style={s.price}>{inr(price)}</Text>
      <Text style={s.desc}>{product.description || 'No description available.'}</Text>

      {out ? (
        <Text style={s.outBadge}>Out of stock</Text>
      ) : (
        <>
          <Text style={s.muted}>{product.stockQty} in stock</Text>
          <View style={s.qtyRow}>
            <TouchableOpacity style={s.stepBtn} onPress={() => setQty((q) => Math.max(1, q - 1))}>
              <Text style={s.stepText}>−</Text>
            </TouchableOpacity>
            <Text style={s.qty}>{qty}</Text>
            <TouchableOpacity style={s.stepBtn} onPress={() => setQty((q) => Math.min(max, q + 1))}>
              <Text style={s.stepText}>+</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={s.btn} onPress={() => { addItem(product, qty); setAdded(true) }}>
            <Text style={s.btnText}>Add to Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, s.btnSecondary]} onPress={() => { addItem(product, qty); navigation.navigate('Cart') }}>
            <Text style={[s.btnText, { color: colors.text }]}>Buy Now</Text>
          </TouchableOpacity>
          {added && <Text style={s.added}>Added to cart ✓</Text>}
        </>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  imgBox: { height: 220, backgroundColor: '#f1f3f5', borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  img: { width: '100%', height: '100%' },
  name: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 14 },
  muted: { color: colors.muted, marginTop: 4 },
  weight: { color: colors.muted },
  price: { color: colors.brand, fontWeight: '800', fontSize: 22, marginTop: 6 },
  desc: { color: colors.text, marginTop: 10, lineHeight: 20 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 16 },
  stepBtn: { borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff', width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 20, color: colors.text },
  qty: { fontSize: 18, fontWeight: '700', minWidth: 30, textAlign: 'center' },
  btn: { backgroundColor: colors.brand, padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 14 },
  btnSecondary: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  outBadge: { marginTop: 14, color: colors.red, backgroundColor: '#ffe3e3', textAlign: 'center', padding: 12, borderRadius: 8, fontWeight: '700' },
  added: { color: colors.green, textAlign: 'center', marginTop: 10, fontWeight: '600' },
  error: { backgroundColor: '#ffe3e3', color: colors.red, padding: 12, borderRadius: 8, margin: 16 },
})
