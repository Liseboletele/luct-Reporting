import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { reportsAPI } from '../../services/api';
import { SearchBar, EmptyState, LoadingSpinner, Card, Badge, Button, ScreenHeader } from '../../components/UI';
import { COLORS, SIZES } from '../../constants/theme';

const STATUS_COLORS = {
  pending: COLORS.warning,
  reviewed: COLORS.success,
  rejected: COLORS.danger,
};

export default function ReportsScreen({ navigation }) {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const canCreate = user?.role === 'lecturer';

  const fetch = async () => {
    try {
      const res = await reportsAPI.getAll({ search });
      setReports(res.data.data);
      setFiltered(res.data.data);
    } catch (e) {
      Alert.alert('Error', 'Failed to load reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(reports);
      return;
    }
    const t = search.toLowerCase();
    setFiltered(
      reports.filter(
        (r) =>
          r.courseName?.toLowerCase().includes(t) ||
          r.courseCode?.toLowerCase().includes(t) ||
          r.className?.toLowerCase().includes(t) ||
          r.topicTaught?.toLowerCase().includes(t) ||
          r.lecturerName?.toLowerCase().includes(t)
      )
    );
  }, [search, reports]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetch(); }, []);

  const handleExport = async () => {
    Alert.alert('Export', 'In production, this downloads the Excel file to your device.');
  };

  const renderReport = ({ item }) => (
    <Card onPress={() => navigation.navigate('ReportDetail', { reportId: item.id })}>
      <View style={styles.reportHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.reportCourse}>{item.courseName}</Text>
          <Text style={styles.reportCode}>{item.courseCode} • Week {item.weekOfReporting}</Text>
        </View>
        <Badge label={item.status.toUpperCase()} color={STATUS_COLORS[item.status] || COLORS.gray500} />
      </View>
      <View style={styles.reportMeta}>
        <Text style={styles.metaItem}> {item.className}</Text>
        <Text style={styles.metaItem}> {item.dateOfLecture}</Text>
      </View>
      <View style={styles.reportMeta}>
        <Text style={styles.metaItem}> {item.lecturerName}</Text>
        <Text style={styles.metaItem}> {item.actualStudentsPresent}/{item.totalRegisteredStudents}</Text>
      </View>
      <Text style={styles.topic} numberOfLines={2}> {item.topicTaught}</Text>
      {item.rating && (
        <View style={{ flexDirection: 'row', marginTop: 8, gap: 4 }}>
          {[1,2,3,4,5].map(s => (
            <Text key={s} style={{ color: s <= item.rating ? COLORS.secondary : COLORS.gray300, fontSize: 14 }}>★</Text>
          ))}
        </View>
      )}
    </Card>
  );

  if (loading) return <LoadingSpinner message="Loading reports..." />;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Lecture Reports"
        subtitle={`${filtered.length} report${filtered.length !== 1 ? 's' : ''}`}
        action={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(user?.role === 'program_leader' || user?.role === 'principal_lecturer') && (
              <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
                <Text style={styles.exportText}> Export</Text>
              </TouchableOpacity>
            )}
            {canCreate && (
              <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('CreateReport')}>
                <Text style={styles.addText}>+</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
      <View style={styles.body}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search reports..." />
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderReport}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          ListEmptyComponent={
            <EmptyState
              title="No reports found"
              subtitle={canCreate ? 'Submit your first lecture report using the + button' : 'No reports available yet'}
              icon=""
            />
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.offWhite },
  body: { flex: 1, paddingHorizontal: SIZES.padding, paddingTop: 16 },

  reportHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  reportCourse: { fontSize: SIZES.md, fontWeight: '800', color: COLORS.gray800, flex: 1, marginRight: 8 },
  reportCode: { fontSize: SIZES.xs, color: COLORS.gray500, marginTop: 3 },

  reportMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  metaItem: { fontSize: SIZES.sm, color: COLORS.gray600 },
  topic: { fontSize: SIZES.sm, color: COLORS.gray700, marginTop: 8, fontStyle: 'italic', lineHeight: 20 },

  exportBtn: {
    backgroundColor: COLORS.success + '18', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.success + '40',
  },
  exportText: { fontSize: SIZES.sm, color: COLORS.success, fontWeight: '600' },
  addBtn: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  addText: { color: COLORS.white, fontSize: 24, fontWeight: '400', lineHeight: 34 },
});
