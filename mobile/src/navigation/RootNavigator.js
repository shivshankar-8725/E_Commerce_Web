import { ActivityIndicator, View } from 'react-native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuth } from '../context/AuthContext'
import { colors } from '../theme'

import LoginScreen from '../screens/LoginScreen'
import RegisterScreen from '../screens/RegisterScreen'
import ShopScreen from '../screens/ShopScreen'
import ProductDetailScreen from '../screens/ProductDetailScreen'
import CartScreen from '../screens/CartScreen'
import CheckoutScreen from '../screens/CheckoutScreen'
import OrdersScreen from '../screens/OrdersScreen'
import OrderDetailScreen from '../screens/OrderDetailScreen'

const Stack = createNativeStackNavigator()

const headerStyle = {
  headerStyle: { backgroundColor: colors.brand },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '700' },
}

export default function RootNavigator() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    )
  }

  return (
    <Stack.Navigator screenOptions={headerStyle}>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'ChipKart · Login' }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create account' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Shop" component={ShopScreen} options={{ title: '🥔 ChipKart' }} />
          <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Product' }} />
          <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Your Cart' }} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
          <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: 'My Orders' }} />
          <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Order' }} />
        </>
      )}
    </Stack.Navigator>
  )
}
