import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem('cart')
      if (raw) setItems(JSON.parse(raw))
      setReady(true)
    })()
  }, [])

  useEffect(() => {
    if (ready) AsyncStorage.setItem('cart', JSON.stringify(items))
  }, [items, ready])

  function addItem(product, quantity = 1) {
    setItems((prev) => {
      const stock = product.stockQty ?? 9999
      const existing = prev.find((i) => i.id === product.id)
      if (existing) {
        const qty = Math.min(existing.quantity + quantity, stock)
        return prev.map((i) => (i.id === product.id ? { ...i, quantity: qty } : i))
      }
      const price = Number(product.wholesalePrice != null ? product.wholesalePrice : product.retailPrice)
      return [...prev, {
        id: product.id, name: product.name, price, weight: product.weight,
        stockQty: stock, quantity: Math.min(quantity, stock),
      }]
    })
  }

  function updateQuantity(id, quantity) {
    setItems((prev) => prev
      .map((i) => (i.id === id ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stockQty)) } : i))
      .filter((i) => i.quantity > 0))
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  function clearCart() { setItems([]) }

  const total = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items])
  const count = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items])

  return (
    <CartContext.Provider value={{ items, addItem, updateQuantity, removeItem, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
