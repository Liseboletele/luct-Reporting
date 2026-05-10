import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, StatusBar,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Button, Input } from '../../components/UI';
import { COLORS, SIZES } from '../../constants/theme';

const ROLES = [
  { value: 'student', label: ' Student', desc: 'Monitor classes & attendance' },
  { value: 'lecturer', label: 'Lecturer', desc: 'Submit lecture reports' },
  { value: 'principal_lecturer', label: ' Principal Lecturer', desc: 'Review faculty reports' },
  { value: 'program_leader', label: ' Program Leader', desc: 'Manage all programs' },
];

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    role: '', facultyName: '', staffId: '', studentId: '', programName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);

  const update = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name required';
    if (!form.email.trim()) errs.email = 'Email required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Valid email required';
    if (!form.password) errs.password = 'Password required';
    else if (form.password.length < 6) errs.password = 'At least 6 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!form.facultyName.trim()) errs.facultyName = 'Faculty name required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      
      await register(form);

      Alert.alert(
        'Account Created! 🎉',
        'Your account has been created successfully. Please sign in to continue.',
        [
          {
            text: 'Sign In',
            onPress: () => navigation.navigate('Login'),
          },
        ],
        { cancelable: false }
      );
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.request
          ? 'Cannot reach the backend server at http://10.150.234.158:5000. Make sure the backend is running and your phone is on the same Wi-Fi.'
          : err.message) ||
        'Please try again.';
      Alert.alert('Registration Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />

      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => (step === 2 ? setStep(1) : navigation.goBack())}
          style={styles.backBtn}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === 1 ? 'Select Role' : 'Create Account'}
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 1 — Role Selection */}
        {step === 1 ? (
          <View>
            <Text style={styles.stepTitle}>I am a...</Text>
            <Text style={styles.stepSub}>Choose your role to get started</Text>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[
                  styles.roleCard,
                  form.role === r.value && styles.roleCardActive,
                ]}
                onPress={() => {
                  update('role', r.value);
                  setStep(2);
                }}
              >
                <Text style={styles.roleIcon}>{r.label}</Text>
                <Text style={styles.roleDesc}>{r.desc}</Text>
                {form.role === r.value && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          /* Step 2 — Details Form */
          <View style={styles.card}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>
                {ROLES.find((r) => r.value === form.role)?.label}
              </Text>
            </View>

            <Input
              label="Full Name *"
              value={form.fullName}
              onChangeText={(v) => update('fullName', v)}
              placeholder="Lisebo Letele"
              error={errors.fullName}
              autoCapitalize="words"
            />

            <Input
              label="Email Address *"
              value={form.email}
              onChangeText={(v) => update('email', v)}
              placeholder="lisebo.letele@luct.edu.ls"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <Input
              label="Faculty / Department *"
              value={form.facultyName}
              onChangeText={(v) => update('facultyName', v)}
              placeholder="e.g. Faculty of ICT"
              error={errors.facultyName}
            />

            {form.role === 'student' && (
              <Input
                label="Student ID"
                value={form.studentId}
                onChangeText={(v) => update('studentId', v)}
                placeholder="e.g. STU2024001"
              />
            )}

            {(form.role === 'lecturer' ||
              form.role === 'principal_lecturer' ||
              form.role === 'program_leader') && (
              <Input
                label="Staff ID"
                value={form.staffId}
                onChangeText={(v) => update('staffId', v)}
                placeholder="e.g. STAFF001"
              />
            )}

            {(form.role === 'program_leader' ||
              form.role === 'principal_lecturer') && (
              <Input
                label="Program Name"
                value={form.programName}
                onChangeText={(v) => update('programName', v)}
                placeholder="e.g. BSc Software Engineering"
              />
            )}

            <Input
              label="Password *"
              value={form.password}
              onChangeText={(v) => update('password', v)}
              placeholder="Min 6 characters"
              secureTextEntry={!showPassword}
              error={errors.password}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text style={{ fontSize: 18 }}>
                    {showPassword ? '' : ''}
                  </Text>
                </TouchableOpacity>
              }
            />

            <Input
              label="Confirm Password *"
              value={form.confirmPassword}
              onChangeText={(v) => update('confirmPassword', v)}
              placeholder="Re-enter password"
              secureTextEntry
              error={errors.confirmPassword}
            />

            <Button
              title={loading ? 'Creating account...' : 'Create Account'}
              onPress={handleRegister}
              loading={false}
              disabled={loading}
              style={{ marginTop: 8 }}
            />
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: Platform.OS === 'ios' ? 54 : 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 20, color: COLORS.white, fontWeight: '700' },
  headerTitle: { fontSize: SIZES.lg, fontWeight: '800', color: COLORS.white },

  container: { flex: 1, backgroundColor: COLORS.offWhite },
  content: { padding: SIZES.padding, paddingBottom: 40 },

  stepTitle: {
    fontSize: SIZES.xxl,
    fontWeight: '900',
    color: COLORS.gray800,
    marginBottom: 6,
    marginTop: 16,
  },
  stepSub: { fontSize: SIZES.base, color: COLORS.gray500, marginBottom: 24 },

  roleCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '08',
  },
  roleIcon: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.gray800, flex: 1 },
  roleDesc: { fontSize: SIZES.sm, color: COLORS.gray500 },
  checkmark: { fontSize: SIZES.lg, color: COLORS.primary, fontWeight: '900' },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginTop: 8,
  },
  roleBadge: {
    backgroundColor: COLORS.primary + '12',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  roleBadgeText: {
    color: COLORS.primary,
    fontSize: SIZES.sm,
    fontWeight: '700',
  },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: COLORS.gray500, fontSize: SIZES.base },
  footerLink: { color: COLORS.primary, fontSize: SIZES.base, fontWeight: '700' },
});