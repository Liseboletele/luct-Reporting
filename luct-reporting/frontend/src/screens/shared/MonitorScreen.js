import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  ScrollView, TouchableOpacity,
} from 'react-native';
import {
  collection, query, where, getDocs, orderBy,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import {
  SearchBar, Card, EmptyState, LoadingSpinner, ScreenHeader, StatCard, Badge,
} from '../../components/UI';
import { COLORS, SIZES } from '../../constants/theme';

const STATUS_COLORS = {
  pending: COLORS.warning,
  reviewed: COLORS.success,
  rejected: COLORS.danger,
};

export default function MonitorScreen({ navigation }) {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';

  const [reports, setReports] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('reports');

  const fetchData = async () => {
    try {
      let reportsData = [];
      let attendanceData = [];

      if (isStudent) {
        // Students ONLY see reports they submitted (by their uid)
        const rQuery = query(
          collection(db, 'reports'),
          where('lecturerId', '==', user.uid)
        );
        const rSnap = await getDocs(rQuery);
        reportsData = rSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Students see attendance records linked to their class or studentId
        const aQuery = query(
          collection(db, 'attendance'),
          where('studentId', '==', user.uid)
        );
        const aSnap = await getDocs(aQuery);
        attendanceData = aSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // If no attendance by studentId, try by classId
        if (attendanceData.length === 0 && user.classId) {
          const aQuery2 = query(
            collection(db, 'attendance'),
            where('classId', '==', user.classId)
          );
          const aSnap2 = await getDocs(aQuery2);
          attendanceData = aSnap2.docs.map(d => ({ id: d.id, ...d.data() }));
        }
      } else {
        // Non-students see ALL reports and attendance
        const rSnap = await getDocs(collection(db, 'reports'));
        reportsData = rSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const aSnap = await getDocs(collection(db, 'attendance'));
        attendanceData = aSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      }

      setReports(reportsData);
      setAttendance(attendanceData);
    } catch (e) {
      console.warn('Fetch error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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

  const avgAttendance = attendance.length > 0
    ? (attendance.reduce((s, a) => s + Number(a.attendancePercentage || 0), 0) / attendance.length).toFixed(1)
    : 0;

  const getAttendanceColor = (pct) => {
    if (pct >= 75) return COLORS.success;
    if (pct >= 50) return COLORS.warning;
    return COLORS.danger;
  };

  const renderReportItem = ({ item }) => (
    <Card onPress={() => navigation.navigate('ReportDetail', { reportId: item.id })}>
      <View style={styles.itemRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle}>{item.courseName || 'Untitled Report'}</Text>
          <Text style={styles.itemSub}>
            {item.lecturerName} · {item.className}
          </Text>
          <Text style={styles.itemDate}>
            Week {item.weekOfReporting} · {item.dateOfLecture}
          </Text>
        </View>
        <Badge
          label={item.status?.toUpperCase()}
          color={STATUS_COLORS[item.status] || COLORS.gray400}
        />
      </View>
      <View style={styles.attendRow}>
        <Text style={styles.attendText}>
          {item.actualStudentsPresent}/{item.totalRegisteredStudents} students
          ({item.totalRegisteredStudents > 0
            ? ((item.actualStudentsPresent / item.totalRegisteredStudents) * 100).toFixed(0)
            : 0}%)
        </Text>
      </View>
      {item.topicTaught ? (
        <Text style={styles.topicText} numberOfLines={2}>{item.topicTaught}</Text>
      ) : null}
    </Card>
  );

  const renderAttendItem = ({ item }) => {
    const pct = Number(item.attendancePercentage || 0);
    const color = getAttendanceColor(pct);
    return (
      <Card>
        <View style={styles.itemRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{item.classId || item.className}</Text>
            <Text style={styles.itemSub}>{item.lecturerName}</Text>
            <Text style={styles.itemDate}>{item.date}</Text>
          </View>
          <View style={[styles.pctPill, { backgroundColor: color + '18' }]}>
            <Text style={[styles.pctNum, { color }]}>{pct}%</Text>
          </View>
        </View>
        <View style={styles.countsRow}>
          <View style={styles.countItem}>
            <Text style={[styles.countNum, { color: COLORS.success }]}>
              {item.presentStudents}
            </Text>
            <Text style={styles.countLabel}>Present</Text>
          </View>
          <View style={styles.countItem}>
            <Text style={[styles.countNum, { color: COLORS.danger }]}>
              {item.absentStudents}
            </Text>
            <Text style={styles.countLabel}>Absent</Text>
          </View>
          <View style={styles.countItem}>
            <Text style={[styles.countNum, { color: COLORS.primary }]}>
              {item.totalRegistered}
            </Text>
            <Text style={styles.countLabel}>Total</Text>
          </View>
        </View>
        <View style={styles.progressBg}>
          <View style={[
            styles.progressFill,
            { width: `${Math.min(pct, 100)}%`, backgroundColor: color }
          ]} />
        </View>
      </Card>
    );
  };

  if (loading) return <LoadingSpinner message="Loading data..." />;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.offWhite }}>
      <ScreenHeader
        title={isStudent ? 'My Classes' : 'Monitoring'}
        subtitle={isStudent ? 'Your reports & attendance' : 'System overview'}
      />

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard
            label={isStudent ? 'My Reports' : 'Total Reports'}
            value={reports.length}
            icon="📄"
            color={COLORS.primary}
            style={{ flex: 1 }}
          />
          <StatCard
            label="Avg Attend."
            value={`${avgAttendance}%`}
            icon="👥"
            color={COLORS.success}
            style={{ flex: 1 }}
          />
        </View>

        {/* Student privacy notice */}
        {isStudent && (
          <View style={styles.privacyNote}>
            <Text style={styles.privacyText}>
              You are viewing your own reports and attendance only.
            </Text>
          </View>
        )}

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
                  {tab === 'reports'
                    ? `Reports (${filteredReports.length})`
                    : `Attendance (${filteredAttendance.length})`}
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
                title={
                  activeTab === 'reports'
                    ? isStudent ? 'No reports found' : 'No reports yet'
                    : isStudent ? 'No attendance records' : 'No attendance data'
                }
                subtitle={
                  isStudent
                    ? `You have not submitted any ${activeTab} yet`
                    : `No ${activeTab} records available`
                }
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
  statsRow: {
    flexDirection: 'row', gap: 8,
    padding: SIZES.padding, paddingBottom: 0,
  },

  privacyNote: {
    marginHorizontal: SIZES.padding,
    marginTop: 12,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  privacyText: {
    fontSize: SIZES.xs,
    color: COLORS.primary,
    fontWeight: '600',
  },

  itemRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  itemTitle: { fontSize: SIZES.base, fontWeight: '800', color: COLORS.gray800, flex: 1 },
  itemSub: { fontSize: SIZES.sm, color: COLORS.gray600, marginTop: 3 },
  itemDate: { fontSize: SIZES.xs, color: COLORS.gray400, marginTop: 2 },
  attendRow: { borderTopWidth: 1, borderTopColor: COLORS.gray100, paddingTop: 8 },
  attendText: { fontSize: SIZES.sm, color: COLORS.gray600 },
  topicText: {
    fontSize: SIZES.sm, color: COLORS.gray500,
    fontStyle: 'italic', marginTop: 6,
  },

  pctPill: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' },
  pctNum: { fontSize: SIZES.lg, fontWeight: '900' },

  countsRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    marginBottom: 10, marginTop: 4,
  },
  countItem: { alignItems: 'center' },
  countNum: { fontSize: SIZES.lg, fontWeight: '900' },
  countLabel: { fontSize: SIZES.xs, color: COLORS.gray500, marginTop: 2 },

  progressBg: {
    height: 5, backgroundColor: COLORS.gray100,
    borderRadius: 3, overflow: 'hidden', marginTop: 4,
  },
  progressFill: { height: 5, borderRadius: 3 },

  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16, marginTop: 12 },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1.5, borderColor: COLORS.border,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: SIZES.sm, color: COLORS.gray600, fontWeight: '600' },
  tabTextActive: { color: COLORS.white },
});