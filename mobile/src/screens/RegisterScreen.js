import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { useAuth } from '../context/AuthContext'
import { apiError } from '../api/client'
import { colors } from '../theme'

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth()
  const [form, setForm] = useState({ name: '', mobile: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function submit() {
    setError('')
    if (!form.name.trim()) return setError('Name is required.')
    if (!/^\d{10}$/.test(form.mobile)) return setError('Mobile must be 10 digits.')
    if (form.password.length < 6) return setError('Password must be at least 6 characters.')
    setLoading(true)
    try {
      await register({
        name: form.name.trim(), mobile: form.mobile.trim(),
        email: form.email.trim() || null, password: form.password,
      })
    } catch (e) {
      setError(apiError(e, 'Registration failed.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container}>
        <Text style={s.title}>Create your account</Text>
        {!!error && <Text style={s.error}>{error}</Text>}

        <Text style={s.label}>Full name</Text>
        <TextInput style={s.input} value={form.name} onChangeText={(v) => set('name', v)} placeholder="Your name" />

        <Text style={s.label}>Mobile number</Text>
        <TextInput style={s.input} value={form.mobile} onChangeText={(v) => set('mobile', v)}
          keyboardType="number-pad" maxLength={10} placeholder="10-digit mobile" />

        <Text style={s.label}>Email (optional)</Text>
        <TextInput style={s.input} value={form.email} onChangeText={(v) => set('email', v)}
          keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" />

        <Text style={s.label}>Password</Text>
        <TextInput style={s.input} value={form.password} onChangeText={(v) => set('password', v)}
          secureTextEntry placeholder="At least 6 characters" />

        <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={submit} disabled={loading}>
          <Text style={s.btnText}>{loading ? 'Creating...' : 'Register'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.link}>Already have an account? Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { padding: 20, flexGrow: 1, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 12 },
  label: { color: colors.muted, marginTop: 12, marginBottom: 4 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12 },
  btn: { backgroundColor: colors.brand, padding: 14, borderRadius: 8, marginTop: 20, alignItems: 'center' },
  btnDisabled: { backgroundColor: '#c0c4c9' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { color: colors.brand, textAlign: 'center', marginTop: 18 },
  error: { backgroundColor: '#ffe3e3', color: colors.red, padding: 10, borderRadius: 8 },
})
