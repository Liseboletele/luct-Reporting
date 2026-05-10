import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, StatusBar, TextInput,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SIZES } from '../../constants/theme';

const ROLES = [
  { value: 'student', label: 'Student', initial: 'S' },
  { value: 'lecturer', label: 'Lecturer', initial: 'L' },
  { value: 'principal_lecturer', label: 'PRL', initial: 'PL' },
  { value: 'program_leader', label: 'PL', initial: 'PG' },
];

const NAVY = '#0D1B3E';
const GOLD = '#C9A84C';
const ACCENT = '#F97316';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!selectedRole) return Alert.alert('Error', 'Please select a role');
    if (!email.trim()) return Alert.alert('Error', 'Please enter your email');
    if (!password) return Alert.alert('Error', 'Please enter your password');

    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      Alert.alert('Login Failed', err.message || 'Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar backgroundColor={NAVY} barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo + App Name */}
        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>L</Text>
          </View>
          <Text style={styles.appName}>LUCT Reporting</Text>
          <Text style={styles.appSub}>Faculty Lecture Management System</Text>
        </View>

        {/* White Card */}
        <View style={styles.card}>
          <Text style={styles.welcomeTitle}>Welcome Back</Text>
          <Text style={styles.welcomeSub}>Sign in to your account</Text>

          {/* Role selector */}
          <Text style={styles.fieldLabel}>Role</Text>
          <View style={styles.rolesContainer}>
            {ROLES.map((role) => {
              const isActive = selectedRole === role.value;
              return (
                <TouchableOpacity
                  key={role.value}
                  style={[styles.roleRow, isActive && styles.roleRowActive]}
                  onPress={() => setSelectedRole(role.value)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.roleIconBox, isActive && styles.roleIconBoxActive]}>
                    <Text style={[styles.roleInitial, isActive && { color: NAVY }]}>
                      {role.initial}
                    </Text>
                  </View>
                  <Text style={[styles.roleText, isActive && styles.roleTextActive]}>
                    {role.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Email */}
          <Text style={styles.fieldLabel}>Email Address</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor="#aaa"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password */}
          <Text style={styles.fieldLabel}>Password</Text>
          <View style={[styles.inputBox, styles.inputRow]}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#aaa"
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>

          {/* Sign In button */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.loginBtnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
          </TouchableOpacity>
        </View>

        {/* Register link */}
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
  root: {
    flex: 1,
    backgroundColor: NAVY,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 40,
    backgroundColor: NAVY,
  },

  // Logo
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 18,
    backgroundColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  logoText: { fontSize: 36, fontWeight: '900', color: '#fff' },
  appName: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 4 },
  appSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },

  // Card
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  welcomeTitle: {
    fontSize: 22, fontWeight: '900',
    color: NAVY, marginBottom: 4,
  },
  welcomeSub: {
    fontSize: 13, color: '#888',
    marginBottom: 20,
  },

  fieldLabel: {
    fontSize: 12, fontWeight: '700',
    color: '#555', marginBottom: 8,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },

  // Roles
  rolesContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
    marginBottom: 20,
  },
  roleRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
    backgroundColor: '#fff',
  },
  roleRowActive: {
    backgroundColor: GOLD,
    borderBottomColor: GOLD,
  },
  roleIconBox: {
    width: 28, height: 28, borderRadius: 7,
    backgroundColor: '#f0f0f0',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  roleIconBoxActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  roleInitial: { fontSize: 11, fontWeight: '900', color: '#666' },
  roleText: { fontSize: 14, fontWeight: '600', color: '#333' },
  roleTextActive: { color: '#fff', fontWeight: '800' },

  // Inputs
  inputBox: {
    borderWidth: 1.5, borderColor: '#e8e8e8',
    borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 4,
    marginBottom: 16, backgroundColor: '#fafafa',
  },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: { fontSize: 14, color: '#222' },
  eyeBtn: { padding: 4 },
  eyeText: { fontSize: 12, color: NAVY, fontWeight: '700' },

  // Login button
  loginBtn: {
    backgroundColor: NAVY,
    borderRadius: 30, paddingVertical: 16,
    alignItems: 'center', marginTop: 4,
  },
  loginBtnText: {
    fontSize: 15, fontWeight: '800',
    color: '#fff', letterSpacing: 0.5,
  },

  // Footer
  footer: {
    flexDirection: 'row', justifyContent: 'center',
    marginTop: 24,
  },
  footerText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  footerLink: { color: GOLD, fontSize: 14, fontWeight: '800' },

  version: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 11, marginTop: 20, textAlign: 'center',
  },
});