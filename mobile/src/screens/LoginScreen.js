import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { useAuth } from '../context/AuthContext'
import { apiError } from '../api/client'
import { colors } from '../theme'

export default function LoginScreen({ navigation }) {
  const { login } = useAuth()
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    setError('')
    if (!mobile || !password) { setError('Enter mobile and password.'); return }
    setLoading(true)
    try {
      await login(mobile.trim(), password)
      // Navigation switches automatically when user is set.
    } catch (e) {
      setError(apiError(e, 'Login failed.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container}>
        <Text style={s.title}>Welcome back</Text>
        {!!error && <Text style={s.error}>{error}</Text>}

        <Text style={s.label}>Mobile number</Text>
        <TextInput style={s.input} value={mobile} onChangeText={setMobile}
          keyboardType="number-pad" placeholder="10-digit mobile" maxLength={10} />

        <Text style={s.label}>Password</Text>
        <TextInput style={s.input} value={password} onChangeText={setPassword}
          secureTextEntry placeholder="Your password" />

        <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={submit} disabled={loading}>
          <Text style={s.btnText}>{loading ? 'Logging in...' : 'Login'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={s.link}>New here? Create a customer account</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { padding: 20, flexGrow: 1, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 16 },
  label: { color: colors.muted, marginTop: 12, marginBottom: 4 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12 },
  btn: { backgroundColor: colors.brand, padding: 14, borderRadius: 8, marginTop: 20, alignItems: 'center' },
  btnDisabled: { backgroundColor: '#c0c4c9' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { color: colors.brand, textAlign: 'center', marginTop: 18 },
  error: { backgroundColor: '#ffe3e3', color: colors.red, padding: 10, borderRadius: 8 },
})
