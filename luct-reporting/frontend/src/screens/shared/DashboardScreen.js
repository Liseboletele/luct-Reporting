import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Alert, Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Card, SectionHeader } from '../../components/UI';
import { COLORS, SIZES, SHADOWS, ROLE_LABELS } from '../../constants/theme';

const ROLE_COLORS = {
  student: '#3B82F6',
  lecturer: '#8B5CF6',
  principal_lecturer: '#F59E0B',
  program_leader: '#10B981',
};

const quickActions = {
  student: [
    { label: 'My Classes', icon: '▤', screen: 'Monitor', color: '#3B82F6', desc: 'View reports & monitoring' },
    { label: 'Attendance', icon: '✓', screen: 'Attendance', color: '#10B981', desc: 'View your attendance' },
    { label: 'Ratings', icon: '★', screen: 'Ratings', color: '#F59E0B', desc: 'Rate lecturers & classes' },
    { label: 'Profile', icon: '◎', screen: 'Profile', color: '#6B7280', desc: 'Manage your account' },
  ],
  lecturer: [
    { label: 'Submit Report', icon: '✎', screen: 'CreateReport', color: '#8B5CF6', desc: 'Submit lecture report' },
    { label: 'My Classes', icon: '▦', screen: 'Classes', color: '#3B82F6', desc: 'View your classes' },
    { label: 'Attendance', icon: '✓', screen: 'Attendance', color: '#10B981', desc: 'Record student attendance' },
    { label: 'My Reports', icon: '▤', screen: 'Reports', color: '#F59E0B', desc: 'View submitted reports' },
    { label: 'Monitoring', icon: '◉', screen: 'Monitor', color: '#6366F1', desc: 'System overview' },
    { label: 'Ratings', icon: '★', screen: 'Ratings', color: '#6B7280', desc: 'View ratings' },
  ],
  principal_lecturer: [
    { label: 'View Reports', icon: '▤', screen: 'Reports', color: '#8B5CF6', desc: 'View & add feedback' },
    { label: 'My Courses', icon: '▦', screen: 'Classes', color: '#3B82F6', desc: 'Courses under your stream' },
    { label: 'Attendance', icon: '✓', screen: 'Attendance', color: '#10B981', desc: 'View attendance records' },
    { label: 'Monitoring', icon: '◉', screen: 'Monitor', color: '#F59E0B', desc: 'System monitoring' },
    { label: 'Ratings', icon: '★', screen: 'Ratings', color: '#6366F1', desc: 'View & submit ratings' },
    { label: 'Profile', icon: '◎', screen: 'Profile', color: '#6B7280', desc: 'Manage your account' },
  ],
  program_leader: [
    { label: 'All Reports', icon: '▤', screen: 'Reports', color: '#8B5CF6', desc: 'View all reports' },
    { label: 'Manage Classes', icon: '▦', screen: 'Classes', color: '#3B82F6', desc: 'Add & assign modules' },
    { label: 'Lecturers', icon: '◎', screen: 'Users', color: '#10B981', desc: 'Manage lecturers' },
    { label: 'Monitoring', icon: '◉', screen: 'Monitor', color: '#F59E0B', desc: 'Full system overview' },
    { label: 'Ratings', icon: '★', screen: 'Ratings', color: '#6366F1', desc: 'View all ratings' },
    { label: 'Analytics', icon: '▦', screen: 'Reports', color: '#6B7280', desc: 'Export & analytics' },
  ],
};

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') { logout(); return; }
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const roleColor = ROLE_COLORS[user?.role] || COLORS.primary;
  const actions = quickActions[user?.role] || quickActions.student;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.name}>{user?.fullName?.split(' ')[0] || 'User'}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Role pill */}
        <View style={[styles.rolePill, { backgroundColor: roleColor + '25' }]}>
          <View style={[styles.roleDot, { backgroundColor: roleColor }]} />
          <Text style={[styles.roleLabel, { color: roleColor }]}>
            {ROLE_LABELS?.[user?.role] || user?.role || 'User'}
          </Text>
          {user?.facultyName ? (
            <Text style={styles.faculty}> · {user.facultyName}</Text>
          ) : null}
        </View>

        {/* ID badge */}
        {user?.studentId ? (
          <View style={styles.idBadge}>
            <Text style={styles.idText}>ID: {user.studentId}</Text>
          </View>
        ) : null}
        {user?.staffId ? (
          <View style={styles.idBadge}>
            <Text style={styles.idText}>Staff ID: {user.staffId}</Text>
          </View>
        ) : null}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {actions.map((a) => (
            <TouchableOpacity
              key={a.label}
              style={[styles.actionCard, { borderTopColor: a.color }]}
              onPress={() => navigation.navigate(a.screen)}
              activeOpacity={0.82}
            >
              <View style={[styles.actionIcon, { backgroundColor: a.color + '18' }]}>
                <Text style={[styles.actionIconText, { color: a.color }]}>{a.icon}</Text>
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
              <Text style={styles.actionDesc}>{a.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* User Info Card */}
      <View style={styles.section}>
        <Card>
          <Text style={styles.sectionTitle}>My Information</Text>
          {[
            { label: 'Email', value: user?.email },
            { label: 'Faculty', value: user?.facultyName || '—' },
            user?.staffId ? { label: 'Staff ID', value: user.staffId } : null,
            user?.studentId ? { label: 'Student ID', value: user.studentId } : null,
            user?.programName ? { label: 'Program', value: user.programName } : null,
          ].filter(Boolean).map(({ label, value }) => (
            <View key={label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{label}</Text>
              <Text style={styles.infoValue}>{value}</Text>
            </View>
          ))}
          <View style={styles.accountActions}>
            <TouchableOpacity
              style={styles.editProfileBtn}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </View>

      <Text style={styles.version}>LUCT Reporting System v1.0 · BIMP2210</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.offWhite },
  content: { paddingBottom: 40 },

  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding,
    paddingTop: Platform.OS === 'ios' ? 54 : 48,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 14,
  },
  greeting: { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
  name: { fontSize: SIZES.xxl, fontWeight: '900', color: COLORS.white, marginTop: 2 },
  logoutBtn: {
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  logoutText: { fontSize: SIZES.sm, color: COLORS.white, fontWeight: '700' },

  rolePill: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    alignSelf: 'flex-start', marginBottom: 10,
  },
  roleDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  roleLabel: { fontSize: SIZES.sm, fontWeight: '700' },
  faculty: { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.65)' },

  idBadge: {
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 6,
    alignSelf: 'flex-start', marginTop: 4,
  },
  idText: { fontSize: SIZES.sm, color: COLORS.white, fontWeight: '600' },

  section: { paddingHorizontal: SIZES.padding, marginTop: 24 },
  sectionTitle: {
    fontSize: SIZES.md, fontWeight: '800',
    color: COLORS.gray800, marginBottom: 16,
  },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: {
    width: '47%',
    backgroundColor: COLORS.white,
    borderRadius: 16, padding: 16,
    alignItems: 'center',
    borderTopWidth: 3,
    ...SHADOWS.small,
  },
  actionIcon: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  actionIconText: { fontSize: 24, fontWeight: '700' },
  actionLabel: {
    fontSize: SIZES.sm, fontWeight: '700',
    color: COLORS.gray700, textAlign: 'center',
  },
  actionDesc: {
    fontSize: SIZES.xs, color: COLORS.gray400,
    textAlign: 'center', marginTop: 4,
  },

  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.gray100,
  },
  infoLabel: { fontSize: SIZES.sm, color: COLORS.gray500, fontWeight: '500' },
  infoValue: {
    fontSize: SIZES.sm, color: COLORS.gray800,
    fontWeight: '600', maxWidth: '65%', textAlign: 'right',
  },
  accountActions: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16,
  },
  editProfileBtn: {
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: COLORS.primary + '12',
  },
  editProfileText: { color: COLORS.primary, fontSize: SIZES.sm, fontWeight: '700' },
  signOutBtn: {
    backgroundColor: COLORS.danger + '14',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  signOutText: { color: COLORS.danger, fontSize: SIZES.sm, fontWeight: '700' },

  version: {
    textAlign: 'center', color: COLORS.gray400,
    fontSize: SIZES.xs, marginTop: 32,
  },
});