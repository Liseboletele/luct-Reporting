import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert,
} from 'react-native';
import { usersAPI } from '../../services/api';
import { SearchBar, Card, EmptyState, LoadingSpinner, ScreenHeader, Badge } from '../../components/UI';
import { COLORS, SIZES, ROLE_LABELS } from '../../constants/theme';

const ROLE_COLORS = {
  student: COLORS.info,
  lecturer: COLORS.primary,
  principal_lecturer: COLORS.warning,
  program_leader: COLORS.secondary,
};

const ROLE_FILTERS = ['all', 'student', 'lecturer', 'principal_lecturer', 'program_leader'];

export default function UsersScreen() {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const fetchUsers = async () => {
    try {
      const res = await usersAPI.getAll();
      setUsers(res.data.data);
      setFiltered(res.data.data);
    } catch {
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    let data = users;
    if (roleFilter !== 'all') data = data.filter(u => u.role === roleFilter);
    if (search.trim()) {
      const t = search.toLowerCase();
      data = data.filter(u =>
        u.fullName?.toLowerCase().includes(t) ||
        u.email?.toLowerCase().includes(t) ||
        u.staffId?.toLowerCase().includes(t) ||
        u.studentId?.toLowerCase().includes(t)
      );
    }
    setFiltered(data);
  }, [search, roleFilter, users]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchUsers(); }, []);

  const handleToggleStatus = (user) => {
    Alert.alert(
      user.isActive ? 'Deactivate User' : 'Activate User',
      `${user.isActive ? 'Deactivate' : 'Activate'} ${user.fullName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await usersAPI.toggleStatus(user.uid);
              fetchUsers();
            } catch {
              Alert.alert('Error', 'Failed to update user status');
            }
          },
        },
      ]
    );
  };

  const renderUser = ({ item }) => (
    <Card>
      <View style={styles.userHeader}>
        <View style={[styles.avatar, { backgroundColor: (ROLE_COLORS[item.role] || COLORS.gray400) + '20' }]}>
          <Text style={[styles.avatarText, { color: ROLE_COLORS[item.role] || COLORS.gray400 }]}>
            {item.fullName?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{item.fullName}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        <TouchableOpacity
          style={[styles.statusToggle, { backgroundColor: item.isActive ? COLORS.success + '18' : COLORS.danger + '18' }]}
          onPress={() => handleToggleStatus(item)}
        >
          <Text style={{ fontSize: 16 }}>{item.isActive ? '✅' : '🚫'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.userMeta}>
        <Badge label={ROLE_LABELS[item.role] || item.role} color={ROLE_COLORS[item.role] || COLORS.gray500} />
        {item.staffId && <Text style={styles.metaChip}>👤 {item.staffId}</Text>}
        {item.studentId && <Text style={styles.metaChip}>🎓 {item.studentId}</Text>}
      </View>

      {item.facultyName && <Text style={styles.faculty}>🏛️ {item.facultyName}</Text>}

      <Text style={styles.joined}>
        Joined {new Date(item.createdAt).toLocaleDateString()} ·{' '}
        <Text style={{ color: item.isActive ? COLORS.success : COLORS.danger, fontWeight: '700' }}>
          {item.isActive ? 'Active' : 'Inactive'}
        </Text>
      </Text>
    </Card>
  );

  if (loading) return <LoadingSpinner message="Loading users..." />;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.offWhite }}>
      <ScreenHeader title="Users" subtitle={`${filtered.length} user${filtered.length !== 1 ? 's' : ''}`} />

      <View style={{ flex: 1, paddingHorizontal: SIZES.padding, paddingTop: 16 }}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search users..." />

        {/* Role filter chips */}
        <View style={styles.filterRow}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={ROLE_FILTERS}
            keyExtractor={(i) => i}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.filterChip, roleFilter === item && styles.filterChipActive]}
                onPress={() => setRoleFilter(item)}
              >
                <Text style={[styles.filterChipText, roleFilter === item && { color: COLORS.white }]}>
                  {item === 'all' ? 'All' : ROLE_LABELS[item] || item}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ gap: 8, paddingBottom: 12 }}
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(i) => i.uid}
          renderItem={renderUser}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          ListEmptyComponent={
            <EmptyState title="No users found" subtitle="Try adjusting your search or filter" icon="👥" />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  userHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: SIZES.xl, fontWeight: '900' },
  userName: { fontSize: SIZES.base, fontWeight: '800', color: COLORS.gray800 },
  userEmail: { fontSize: SIZES.xs, color: COLORS.gray500, marginTop: 2 },
  statusToggle: { padding: 8, borderRadius: 10 },

  userMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  metaChip: { fontSize: SIZES.xs, color: COLORS.gray600, backgroundColor: COLORS.gray100, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  faculty: { fontSize: SIZES.sm, color: COLORS.gray600, marginBottom: 6 },
  joined: { fontSize: SIZES.xs, color: COLORS.gray400 },

  filterRow: { marginBottom: 4 },
  filterChip: {
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white,
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: SIZES.xs, color: COLORS.gray700, fontWeight: '600' },
});
