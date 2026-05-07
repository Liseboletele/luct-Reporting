import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { usersAPI } from '../../services/api';
import { StatCard, Card, SectionHeader, EmptyState, LoadingSpinner, Badge } from '../../components/UI';
import { COLORS, SIZES, SHADOWS, ROLE_LABELS } from '../../constants/theme';

const ROLE_COLORS = {
  student: COLORS.info,
  lecturer: COLORS.primary,
  principal_lecturer: COLORS.warning,
  program_leader: COLORS.secondary,
};

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(false);
      const res = await usersAPI.getDashboardStats();
      setStats(res.data.data);
    } catch (e) {
      console.log('Stats error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchStats(); }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const quickActions = {
    lecturer: [
      { label: 'Submit Report', icon: '📝', screen: 'CreateReport', color: COLORS.primary },
      { label: 'My Classes', icon: '🏫', screen: 'Classes', color: COLORS.info },
      { label: 'Attendance', icon: '✅', screen: 'Attendance', color: COLORS.success },
      { label: 'My Reports', icon: '📊', screen: 'Reports', color: COLORS.warning },
    ],
    student: [
      { label: 'Monitor Classes', icon: '👁️', screen: 'Monitor', color: COLORS.info },
      { label: 'Attendance', icon: '✅', screen: 'Attendance', color: COLORS.success },
      { label: 'Ratings', icon: '⭐', screen: 'Ratings', color: COLORS.secondary },
      { label: 'Profile', icon: '👤', screen: 'Profile', color: COLORS.gray500 },
    ],
    principal_lecturer: [
      { label: 'View Reports', icon: '📋', screen: 'Reports', color: COLORS.primary },
      { label: 'My Courses', icon: '📚', screen: 'Classes', color: COLORS.info },
      { label: 'Add Feedback', icon: '💬', screen: 'Reports', color: COLORS.success },
      { label: 'Monitoring', icon: '📡', screen: 'Monitor', color: COLORS.warning },
    ],
    program_leader: [
      { label: 'All Reports', icon: '📋', screen: 'Reports', color: COLORS.primary },
      { label: 'Manage Classes', icon: '🏫', screen: 'Classes', color: COLORS.info },
      { label: 'Lecturers', icon: '👨‍🏫', screen: 'Users', color: COLORS.success },
      { label: 'Analytics', icon: '📊', screen: 'Reports', color: COLORS.secondary },
    ],
  };

  const actions = quickActions[user?.role] || [];

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      logout();
      return;
    }

    Alert.alert('Sign Out', 'Sign out and return to login/register?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.name}>{user?.fullName?.split(' ')[0]}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.rolePill}>
          <View style={[styles.roleDot, { backgroundColor: ROLE_COLORS[user?.role] }]} />
          <Text style={styles.roleLabel}>{ROLE_LABELS[user?.role]}</Text>
          {user?.facultyName && <Text style={styles.faculty}> • {user?.facultyName}</Text>}
        </View>
      </View>

      {/* Stats */}
      {stats && (
        <View style={styles.section}>
          <SectionHeader title="Overview" />
          <View style={styles.statsGrid}>
            <StatCard label="Total Reports" value={stats.totalReports} icon="📄" color={COLORS.primary} style={{ flex: 1 }} />
            <StatCard label="Pending" value={stats.pendingReports} icon="⏳" color={COLORS.warning} style={{ flex: 1 }} />
          </View>
          <View style={styles.statsGrid}>
            <StatCard label="Reviewed" value={stats.reviewedReports} icon="✅" color={COLORS.success} style={{ flex: 1 }} />
            <StatCard label="Avg Attendance" value={`${stats.averageAttendance}%`} icon="👥" color={COLORS.info} style={{ flex: 1 }} />
          </View>
          {(user?.role === 'program_leader') && (
            <View style={styles.statsGrid}>
              <StatCard label="Total Classes" value={stats.totalClasses} icon="🏫" color={COLORS.secondary} style={{ flex: 1 }} />
              <StatCard label="Total Users" value={stats.totalUsers} icon="👤" color={COLORS.gray600} style={{ flex: 1 }} />
            </View>
          )}
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <SectionHeader title="Quick Actions" />
        <View style={styles.actionsGrid}>
          {actions.map((a) => (
            <TouchableOpacity
              key={a.label}
              style={[styles.actionCard, { borderTopColor: a.color }]}
              onPress={() => navigation.navigate(a.screen)}
              activeOpacity={0.82}
            >
              <View style={[styles.actionIcon, { backgroundColor: a.color + '18' }]}>
                <Text style={{ fontSize: 26 }}>{a.icon}</Text>
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* User Info Card */}
      <View style={styles.section}>
        <Card>
          <SectionHeader title="My Information" />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
          {user?.staffId && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Staff ID</Text>
              <Text style={styles.infoValue}>{user?.staffId}</Text>
            </View>
          )}
          {user?.studentId && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Student ID</Text>
              <Text style={styles.infoValue}>{user?.studentId}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Faculty</Text>
            <Text style={styles.infoValue}>{user?.facultyName || '—'}</Text>
          </View>
          <View style={styles.accountActions}>
            <TouchableOpacity style={styles.editProfileBtn} onPress={() => navigation.navigate('Profile')}>
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.offWhite },
  content: { paddingBottom: 32 },

  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding,
    paddingTop: 54,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  greeting: { fontSize: SIZES.base, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
  name: { fontSize: SIZES.xxl, fontWeight: '900', color: COLORS.white, marginTop: 2 },
  logoutBtn: {
    minHeight: 40, borderRadius: 12, paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoutText: { fontSize: SIZES.sm, color: COLORS.white, fontWeight: '700' },
  rolePill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  roleDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  roleLabel: { fontSize: SIZES.sm, color: COLORS.white, fontWeight: '600' },
  faculty: { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.65)' },

  section: { paddingHorizontal: SIZES.padding, marginTop: 24 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: {
    flex: 1, minWidth: '44%', backgroundColor: COLORS.white,
    borderRadius: 16, padding: 16, alignItems: 'center',
    borderTopWidth: 3, ...SHADOWS.small,
  },
  actionIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  actionLabel: { fontSize: SIZES.sm, fontWeight: '700', color: COLORS.gray700, textAlign: 'center' },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  infoLabel: { fontSize: SIZES.sm, color: COLORS.gray500, fontWeight: '500' },
  infoValue: { fontSize: SIZES.sm, color: COLORS.gray800, fontWeight: '600', maxWidth: '65%', textAlign: 'right' },
  accountActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  editProfileBtn: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: COLORS.primary + '12' },
  editProfileText: { color: COLORS.primary, fontSize: SIZES.sm, fontWeight: '700' },
  signOutBtn: { backgroundColor: COLORS.danger + '14', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  signOutText: { color: COLORS.danger, fontSize: SIZES.sm, fontWeight: '700' },
});
