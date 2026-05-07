import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, StatusBar,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Button, Input } from '../../components/UI';
import { COLORS, SIZES } from '../../constants/theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email';
    if (!password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>L</Text>
          </View>
          <Text style={styles.appName}>LUCT Reporting</Text>
          <Text style={styles.tagline}>Faculty Lecture Management System</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome Back</Text>
          <Text style={styles.cardSubtitle}>Sign in to your account</Text>

          <Input
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.email}
            containerStyle={{ marginTop: 8 }}
          />

          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry={!showPassword}
            error={errors.password}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            }
          />

          <Button title="Sign In" onPress={handleLogin} loading={loading} style={{ marginTop: 8 }} />
        </View>

        {/* Register Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.footerLink}>Register</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>LUCT Faculty Reporting System v1.0</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  content: { flexGrow: 1, paddingHorizontal: SIZES.padding, paddingTop: 60, paddingBottom: 40 },

  header: { alignItems: 'center', marginBottom: 36 },
  logoBox: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: COLORS.secondary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  logoText: { fontSize: 36, fontWeight: '900', color: COLORS.primary },
  appName: { fontSize: SIZES.xxl, fontWeight: '900', color: COLORS.white, letterSpacing: 0.5 },
  tagline: { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.65)', marginTop: 6, letterSpacing: 0.3 },

  card: {
    backgroundColor: COLORS.white, borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2, shadowRadius: 24, elevation: 12,
  },
  cardTitle: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.gray800, marginBottom: 4 },
  cardSubtitle: { fontSize: SIZES.sm, color: COLORS.gray500, marginBottom: 20 },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: 'rgba(255,255,255,0.7)', fontSize: SIZES.base },
  footerLink: { color: COLORS.secondary, fontSize: SIZES.base, fontWeight: '700' },

  version: { textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: SIZES.xs, marginTop: 32 },
});
