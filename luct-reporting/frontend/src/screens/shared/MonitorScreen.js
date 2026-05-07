import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, ScrollView, TouchableOpacity,
} from 'react-native';
import { reportsAPI, attendanceAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { SearchBar, Card, EmptyState, LoadingSpinner, ScreenHeader, StatCard, Badge } from '../../components/UI';
import { COLORS, SIZES } from '../../constants/theme';

export default function MonitorScreen() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('reports');

  const STATUS_COLORS = { pending: COLORS.warning, reviewed: COLORS.success };

  const fetchData = async () => {
    try {
      const [rRes, aRes] = await Promise.all([reportsAPI.getAll(), attendanceAPI.getAll()]);
      setReports(rRes.data.data);
      setAttendance(aRes.data.data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchData(); }, []);

  const filteredReports = search.trim()
    ? reports.filter(r =>
        r.courseName?.toLowerCase().includes(search.toLowerCase()) ||
        r.lecturerName?.toLowerCase().includes(search.toLowerCase()) ||
        r.className?.toLowerCase().includes(search.toLowerCase())
      )
    : reports;

  const filteredAttendance = search.trim()
    ? attendance.filter(a =>
        a.classId?.toLowerCase().includes(search.toLowerCase()) ||
        a.lecturerName?.toLowerCase().includes(search.toLowerCase()) ||
        a.date?.includes(search)
      )
    : attendance;

  // Stats
  const totalReports = reports.length;
  const pendingReports = reports.filter(r => r.status === 'pending').length;
  const avgAttendance = attendance.length > 0
    ? (attendance.reduce((s, a) => s + Number(a.attendancePercentage || 0), 0) / attendance.length).toFixed(1)
    : 0;

  const renderReportItem = ({ item }) => (
    <Card>
      <View style={styles.itemRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle}>{item.courseName}</Text>
          <Text style={styles.itemSub}>{item.lecturerName} · {item.className}</Text>
          <Text style={styles.itemDate}>Week {item.weekOfReporting} · {item.dateOfLecture}</Text>
        </View>
        <Badge label={item.status?.toUpperCase()} color={STATUS_COLORS[item.status] || COLORS.gray400} />
      </View>
      <View style={styles.attendRow}>
        <Text style={styles.attendText}>
          👥 {item.actualStudentsPresent}/{item.totalRegisteredStudents} students
          ({item.totalRegisteredStudents > 0 ? ((item.actualStudentsPresent / item.totalRegisteredStudents) * 100).toFixed(0) : 0}%)
        </Text>
      </View>
    </Card>
  );

  const renderAttendItem = ({ item }) => {
    const pct = Number(item.attendancePercentage);
    const color = pct >= 75 ? COLORS.success : pct >= 50 ? COLORS.warning : COLORS.danger;
    return (
      <Card>
        <View style={styles.itemRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{item.classId}</Text>
            <Text style={styles.itemSub}>👨‍🏫 {item.lecturerName}</Text>
            <Text style={styles.itemDate}>📅 {item.date}</Text>
          </View>
          <View style={[styles.pctPill, { backgroundColor: color + '18' }]}>
            <Text style={[styles.pctNum, { color }]}>{pct}%</Text>
          </View>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: color }]} />
        </View>
      </Card>
    );
  };

  if (loading) return <LoadingSpinner message="Loading monitoring data..." />;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.offWhite }}>
      <ScreenHeader title="Monitoring" subtitle="System overview" />

      <ScrollView style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard label="Total Reports" value={totalReports} icon="📄" color={COLORS.primary} style={{ flex: 1 }} />
          <StatCard label="Pending" value={pendingReports} icon="⏳" color={COLORS.warning} style={{ flex: 1 }} />
          <StatCard label="Avg Attend." value={`${avgAttendance}%`} icon="👥" color={COLORS.success} style={{ flex: 1 }} />
        </View>

        <View style={{ paddingHorizontal: SIZES.padding }}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search..." />

          {/* Tabs */}
          <View style={styles.tabs}>
            {['reports', 'attendance'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === 'reports' ? `📋 Reports (${filteredReports.length})` : `✅ Attendance (${filteredAttendance.length})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FlatList
            data={activeTab === 'reports' ? filteredReports : filteredAttendance}
            keyExtractor={(i) => i.id}
            renderItem={activeTab === 'reports' ? renderReportItem : renderAttendItem}
            scrollEnabled={false}
            ListEmptyComponent={
              <EmptyState
                title={`No ${activeTab} found`}
                subtitle="Try adjusting your search"
                icon={activeTab === 'reports' ? '📋' : '✅'}
              />
            }
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: 8, padding: SIZES.padding, paddingBottom: 0 },

  itemRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  itemTitle: { fontSize: SIZES.base, fontWeight: '800', color: COLORS.gray800, flex: 1 },
  itemSub: { fontSize: SIZES.sm, color: COLORS.gray600, marginTop: 3 },
  itemDate: { fontSize: SIZES.xs, color: COLORS.gray400, marginTop: 2 },
  attendRow: { borderTopWidth: 1, borderTopColor: COLORS.gray100, paddingTop: 8 },
  attendText: { fontSize: SIZES.sm, color: COLORS.gray600 },

  pctPill: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' },
  pctNum: { fontSize: SIZES.lg, fontWeight: '900' },

  progressBg: { height: 5, backgroundColor: COLORS.gray100, borderRadius: 3, overflow: 'hidden', marginTop: 4 },
  progressFill: { height: 5, borderRadius: 3 },

  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center',
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: SIZES.sm, color: COLORS.gray600, fontWeight: '600' },
  tabTextActive: { color: COLORS.white },
});
