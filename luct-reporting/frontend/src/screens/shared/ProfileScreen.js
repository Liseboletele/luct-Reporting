import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { Button, Input, ScreenHeader, Card } from '../../components/UI';
import { COLORS, SIZES, ROLE_LABELS } from '../../constants/theme';

const ROLE_COLORS = {
  student: COLORS.info,
  lecturer: COLORS.primary,
  principal_lecturer: COLORS.warning,
  program_leader: COLORS.secondary,
};

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    facultyName: user?.facultyName || '',
    staffId: user?.staffId || '',
    studentId: user?.studentId || '',
    programName: user?.programName || '',
  });

  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSaveProfile = async () => {
    if (!form.fullName.trim()) return Alert.alert('Error', 'Full name is required');
    setSaving(true);
    try {
      await authAPI.updateProfile(form);
      updateUser(form);
      setEditing(false);
      Alert.alert('Success', 'Profile updated');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword) return Alert.alert('Error', 'Fill all password fields');
    if (pwForm.newPassword !== pwForm.confirmPassword) return Alert.alert('Error', 'New passwords do not match');
    if (pwForm.newPassword.length < 6) return Alert.alert('Error', 'New password must be at least 6 characters');
    setSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setChangingPassword(false);
      Alert.alert('Success', 'Password changed successfully');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      logout();
      return;
    }

    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const roleColor = ROLE_COLORS[user?.role] || COLORS.primary;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title="My Profile" onBack={() => navigation.goBack()} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Avatar card */}
        <View style={styles.avatarCard}>
          <View style={[styles.avatarCircle, { backgroundColor: roleColor + '22' }]}>
            <Text style={[styles.avatarLetter, { color: roleColor }]}>
              {user?.fullName?.charAt(0)?.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.profileName}>{user?.fullName}</Text>
          <View style={[styles.rolePill, { backgroundColor: roleColor + '18', borderColor: roleColor + '30' }]}>
            <Text style={[styles.roleText, { color: roleColor }]}>{ROLE_LABELS[user?.role]}</Text>
          </View>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>

        {/* Profile Info */}
        <Card style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Profile Information</Text>
            {!editing && (
              <TouchableOpacity onPress={() => setEditing(true)} style={styles.editBtn}>
                <Text style={styles.editBtnText}>✏️ Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {editing ? (
            <>
              <Input label="Full Name *" value={form.fullName} onChangeText={(v) => setForm(p => ({ ...p, fullName: v }))} />
              <Input label="Faculty / Department" value={form.facultyName} onChangeText={(v) => setForm(p => ({ ...p, facultyName: v }))} />
              {(user?.role === 'lecturer' || user?.role === 'principal_lecturer' || user?.role === 'program_leader') && (
                <Input label="Staff ID" value={form.staffId} onChangeText={(v) => setForm(p => ({ ...p, staffId: v }))} />
              )}
              {user?.role === 'student' && (
                <Input label="Student ID" value={form.studentId} onChangeText={(v) => setForm(p => ({ ...p, studentId: v }))} />
              )}
              {(user?.role === 'program_leader' || user?.role === 'principal_lecturer') && (
                <Input label="Program Name" value={form.programName} onChangeText={(v) => setForm(p => ({ ...p, programName: v }))} />
              )}
              <Button title="Save Changes" onPress={handleSaveProfile} loading={saving} style={{ marginTop: 4 }} />
              <Button title="Cancel" onPress={() => setEditing(false)} variant="outline" style={{ marginTop: 8 }} />
            </>
          ) : (
            <>
              {[
                { label: 'Email', value: user?.email },
                { label: 'Faculty', value: user?.facultyName || '—' },
                { label: 'Staff ID', value: user?.staffId || '—', hide: !user?.staffId && user?.role === 'student' },
                { label: 'Student ID', value: user?.studentId || '—', hide: user?.role !== 'student' },
                { label: 'Program', value: user?.programName || '—', hide: user?.role === 'student' || user?.role === 'lecturer' },
                { label: 'Joined', value: user?.createdAt ? new Date(user?.createdAt).toLocaleDateString() : '—' },
              ].filter(r => !r.hide).map(({ label, value }) => (
                <View key={label} style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{label}</Text>
                  <Text style={styles.infoValue}>{value}</Text>
                </View>
              ))}
            </>
          )}
        </Card>

        {/* Change Password */}
        <Card style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Security</Text>
            {!changingPassword && (
              <TouchableOpacity onPress={() => setChangingPassword(true)} style={styles.editBtn}>
                <Text style={styles.editBtnText}>🔒 Change</Text>
              </TouchableOpacity>
            )}
          </View>

          {changingPassword ? (
            <>
              <Input
                label="Current Password"
                value={pwForm.currentPassword}
                onChangeText={(v) => setPwForm(p => ({ ...p, currentPassword: v }))}
                secureTextEntry
                placeholder="Your current password"
              />
              <Input
                label="New Password"
                value={pwForm.newPassword}
                onChangeText={(v) => setPwForm(p => ({ ...p, newPassword: v }))}
                secureTextEntry
                placeholder="At least 6 characters"
              />
              <Input
                label="Confirm New Password"
                value={pwForm.confirmPassword}
                onChangeText={(v) => setPwForm(p => ({ ...p, confirmPassword: v }))}
                secureTextEntry
                placeholder="Re-enter new password"
              />
              <Button title="Update Password" onPress={handleChangePassword} loading={saving} style={{ marginTop: 4 }} />
              <Button title="Cancel" onPress={() => setChangingPassword(false)} variant="outline" style={{ marginTop: 8 }} />
            </>
          ) : (
            <Text style={styles.passwordHint}>Password last changed on account creation</Text>
          )}
        </Card>

        {/* Sign Out */}
        <View style={styles.section}>
          <Button title="Sign Out" onPress={handleLogout} variant="danger" />
        </View>

        <Text style={styles.version}>LUCT Reporting System v1.0 · BIMP2210</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.offWhite },
  content: { paddingBottom: 40 },

  avatarCard: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  avatarCircle: { width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  avatarLetter: { fontSize: 44, fontWeight: '900' },
  profileName: { fontSize: SIZES.xl, fontWeight: '900', color: COLORS.gray800, marginBottom: 8 },
  rolePill: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, marginBottom: 8 },
  roleText: { fontSize: SIZES.sm, fontWeight: '700' },
  profileEmail: { fontSize: SIZES.sm, color: COLORS.gray500 },

  section: { margin: SIZES.padding, marginBottom: 0 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: SIZES.md, fontWeight: '800', color: COLORS.gray800 },
  editBtn: { backgroundColor: COLORS.primary + '12', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  editBtnText: { fontSize: SIZES.sm, color: COLORS.primary, fontWeight: '600' },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  infoLabel: { fontSize: SIZES.sm, color: COLORS.gray500, fontWeight: '500' },
  infoValue: { fontSize: SIZES.sm, color: COLORS.gray800, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },

  passwordHint: { fontSize: SIZES.sm, color: COLORS.gray500, fontStyle: 'italic' },
  version: { textAlign: 'center', color: COLORS.gray400, fontSize: SIZES.xs, marginTop: 32 },
});
