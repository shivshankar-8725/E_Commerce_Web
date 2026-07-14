import { useEffect, useLayoutEffect, useState } from 'react'
import {
  View, Text, TextInput, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native'
import client, { apiError } from '../api/client'
import { API_BASE_URL } from '../config'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { colors, inr } from '../theme'

function imageUri(url) {
  if (!url) return null
  return url.startsWith('http') ? url : API_BASE_URL + url
}

export default function ShopScreen({ navigation }) {
  const { addItem, count } = useCart()
  const { logout } = useAuth()
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.navigate('Orders')} style={{ marginRight: 14 }}>
            <Text style={s.headerBtn}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={{ marginRight: 14 }}>
            <Text style={s.headerBtn}>🛒 {count}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={logout}>
            <Text style={s.headerBtn}>Exit</Text>
          </TouchableOpacity>
        </View>
      ),
    })
  }, [navigation, count, logout])

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true)
      const params = {}
      if (search.trim()) params.search = search.trim()
      client.get('/api/products', { params })
        .then((r) => setProducts(r.data))
        .catch((e) => setError(apiError(e)))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  function renderItem({ item }) {
    const out = !item.inStock
    const uri = imageUri(item.imageUrl)
    return (
      <TouchableOpacity style={s.card} onPress={() => navigation.navigate('ProductDetail', { id: item.id })}>
        <View style={s.imgBox}>
          {uri ? <Image source={{ uri }} style={s.img} /> : <Text style={{ fontSize: 34 }}>🥨</Text>}
        </View>
        <Text style={s.name} numberOfLines={1}>{item.name}</Text>
        <Text style={s.weight}>{item.weight}</Text>
        <Text style={s.price}>{inr(item.wholesalePrice != null ? item.wholesalePrice : item.retailPrice)}</Text>
        {out ? (
          <Text style={s.outBadge}>Out of stock</Text>
        ) : (
          <TouchableOpacity style={s.addBtn} onPress={() => addItem(item, 1)}>
            <Text style={s.addBtnText}>Add to Cart</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={s.searchWrap}>
        <TextInput style={s.search} placeholder="🔍 Search snacks..." value={search} onChangeText={setSearch} />
      </View>
      {!!error && <Text style={s.error}>{error}</Text>}
      {loading ? (
        <ActivityIndicator size="large" color={colors.brand} style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(i) => String(i.id)}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={{ gap: 10, paddingHorizontal: 10 }}
          contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
          ListEmptyComponent={<Text style={s.empty}>No products found.</Text>}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  headerBtn: { color: '#fff', fontWeight: '600' },
  searchWrap: { padding: 10 },
  search: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10 },
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 10 },
  imgBox: { height: 110, backgroundColor: '#f1f3f5', borderRadius: 8, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 8 },
  img: { width: '100%', height: '100%' },
  name: { fontWeight: '600', color: colors.text },
  weight: { color: colors.muted, fontSize: 12 },
  price: { color: colors.brand, fontWeight: '700', marginTop: 2 },
  addBtn: { backgroundColor: colors.brand, borderRadius: 8, paddingVertical: 8, alignItems: 'center', marginTop: 8 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  outBadge: { marginTop: 8, color: colors.red, backgroundColor: '#ffe3e3', textAlign: 'center', paddingVertical: 6, borderRadius: 8, fontSize: 12, fontWeight: '600' },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
  error: { backgroundColor: '#ffe3e3', color: colors.red, padding: 10, margin: 10, borderRadius: 8 },
})
