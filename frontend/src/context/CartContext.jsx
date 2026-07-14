import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)

// Cart lives in the browser (localStorage). Items: { id, name, price, weight, imageUrl, stockQty, quantity }
export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    const raw = localStorage.getItem('cart')
    return raw ? JSON.parse(raw) : []
  })

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  function addItem(product, quantity = 1) {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id)
      const stock = product.stockQty ?? 9999
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, stock)
        return prev.map((i) => (i.id === product.id ? { ...i, quantity: newQty } : i))
      }
      // Effective price: wholesale for dealers, retail for customers (P2-DEAL-03).
      const price = Number(product.wholesalePrice != null ? product.wholesalePrice : product.retailPrice)
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price,
          weight: product.weight,
          imageUrl: product.imageUrl,
          stockQty: stock,
          quantity: Math.min(quantity, stock),
        },
      ]
    })
  }

  function updateQuantity(id, quantity) {
    setItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stockQty)) } : i))
        .filter((i) => i.quantity > 0)
    )
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  function clearCart() {
    setItems([])
  }

  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  )
  const count = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items])

  const value = { items, addItem, updateQuantity, removeItem, clearCart, total, count }
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  return useContext(CartContext)
}
