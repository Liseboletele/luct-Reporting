import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, Alert, Modal, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { attendanceAPI, classesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { SearchBar, Card, EmptyState, LoadingSpinner, ScreenHeader, Button, Input } from '../../components/UI';
import { COLORS, SIZES } from '../../constants/theme';

export default function AttendanceScreen({ navigation }) {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    classId: '',
    className: '',
    date: new Date().toISOString().split('T')[0],
    presentStudents: '',
    absentStudents: '',
    totalRegistered: '',
    notes: '',
  });

  const canRecord = user?.role === 'lecturer';

  const fetchAll = async () => {
    try {
      const [attRes, clsRes] = await Promise.all([attendanceAPI.getAll(), classesAPI.getAll()]);
      setRecords(attRes.data.data);
      setFiltered(attRes.data.data);
      setClasses(clsRes.data.data);
    } catch {
      Alert.alert('Error', 'Failed to load attendance records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(records); return; }
    const t = search.toLowerCase();
    setFiltered(records.filter(r =>
      r.classId?.toLowerCase().includes(t) ||
      r.date?.includes(t) ||
      r.lecturerName?.toLowerCase().includes(t)
    ));
  }, [search, records]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchAll(); }, []);

  const selectClass = (cls) => {
    setForm(p => ({
      ...p,
      classId: cls.id,
      className: cls.className,
      totalRegistered: String(cls.totalRegisteredStudents),
    }));
  };

  const handleRecord = async () => {
    if (!form.classId || !form.presentStudents || !form.totalRegistered) {
      return Alert.alert('Error', 'Select a class and enter student counts');
    }
    setSaving(true);
    try {
      await attendanceAPI.record(form);
      setShowForm(false);
      setForm({ classId: '', className: '', date: new Date().toISOString().split('T')[0], presentStudents: '', absentStudents: '', totalRegistered: '', notes: '' });
      fetchAll();
      Alert.alert('Success', 'Attendance recorded');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to record attendance');
    } finally {
      setSaving(false);
    }
  };

  const getAttendanceColor = (pct) => {
    if (pct >= 75) return COLORS.success;
    if (pct >= 50) return COLORS.warning;
    return COLORS.danger;
  };

  const renderRecord = ({ item }) => {
    const pct = Number(item.attendancePercentage);
    const color = getAttendanceColor(pct);
    return (
      <Card>
        <View style={styles.recordHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.classId}>{item.classId}</Text>
            <Text style={styles.date}>📅 {item.date} · 👨‍🏫 {item.lecturerName}</Text>
          </View>
          <View style={[styles.pctBadge, { backgroundColor: color + '18', borderColor: color + '40' }]}>
            <Text style={[styles.pctText, { color }]}>{pct}%</Text>
          </View>
        </View>
        <View style={styles.counts}>
          <View style={styles.countItem}>
            <Text style={[styles.countNum, { color: COLORS.success }]}>{item.presentStudents}</Text>
            <Text style={styles.countLabel}>Present</Text>
          </View>
          <View style={styles.countItem}>
            <Text style={[styles.countNum, { color: COLORS.danger }]}>{item.absentStudents}</Text>
            <Text style={styles.countLabel}>Absent</Text>
          </View>
          <View style={styles.countItem}>
            <Text style={[styles.countNum, { color: COLORS.primary }]}>{item.totalRegistered}</Text>
            <Text style={styles.countLabel}>Registered</Text>
          </View>
        </View>
        {/* Progress bar */}
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: color }]} />
        </View>
        {item.notes ? <Text style={styles.notes}>📝 {item.notes}</Text> : null}
      </Card>
    );
  };

  if (loading) return <LoadingSpinner message="Loading attendance..." />;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.offWhite }}>
      <ScreenHeader
        title="Attendance"
        subtitle={`${filtered.length} record${filtered.length !== 1 ? 's' : ''}`}
        action={
          canRecord && (
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
              <Text style={styles.addBtnText}>+</Text>
            </TouchableOpacity>
          )
        }
      />

      <View style={{ flex: 1, paddingHorizontal: SIZES.padding, paddingTop: 16 }}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search attendance..." />
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          renderItem={renderRecord}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          ListEmptyComponent={
            <EmptyState
              title="No attendance records"
              subtitle={canRecord ? 'Record attendance for your classes' : 'No attendance data available'}
              icon="✅"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Record Attendance Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Record Attendance</Text>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Select Class *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {classes.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.classChip, form.classId === c.id && styles.classChipActive]}
                  onPress={() => selectClass(c)}
                >
                  <Text style={[styles.classChipText, form.classId === c.id && { color: COLORS.white }]}>
                    {c.className}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Input
              label="Date *"
              value={form.date}
              onChangeText={(v) => setForm(p => ({ ...p, date: v }))}
              placeholder="YYYY-MM-DD"
            />
            <Input
              label="Total Registered Students *"
              value={form.totalRegistered}
              onChangeText={(v) => setForm(p => ({ ...p, totalRegistered: v }))}
              placeholder="Auto-filled from class"
              keyboardType="numeric"
            />
            <Input
              label="Students Present *"
              value={form.presentStudents}
              onChangeText={(v) => {
                const present = Number(v);
                const total = Number(form.totalRegistered);
                const absent = total - present >= 0 ? String(total - present) : '';
                setForm(p => ({ ...p, presentStudents: v, absentStudents: absent }));
              }}
              keyboardType="numeric"
              placeholder="e.g. 28"
            />
            <Input
              label="Students Absent"
              value={form.absentStudents}
              onChangeText={(v) => setForm(p => ({ ...p, absentStudents: v }))}
              keyboardType="numeric"
              placeholder="Auto-calculated"
            />

            {form.presentStudents && form.totalRegistered ? (
              <View style={styles.calcPreview}>
                <Text style={styles.calcLabel}>Attendance Rate</Text>
                <Text style={styles.calcValue}>
                  {((Number(form.presentStudents) / Number(form.totalRegistered)) * 100).toFixed(1)}%
                </Text>
              </View>
            ) : null}

            <Input
              label="Notes"
              value={form.notes}
              onChangeText={(v) => setForm(p => ({ ...p, notes: v }))}
              placeholder="Any additional notes..."
              multiline
              numberOfLines={3}
            />

            <Button title="Record Attendance" onPress={handleRecord} loading={saving} />
            <Button title="Cancel" onPress={() => setShowForm(false)} variant="outline" style={{ marginTop: 10, marginBottom: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { color: COLORS.white, fontSize: 24, fontWeight: '400', lineHeight: 34 },

  recordHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  classId: { fontSize: SIZES.md, fontWeight: '800', color: COLORS.gray800 },
  date: { fontSize: SIZES.xs, color: COLORS.gray500, marginTop: 3 },
  pctBadge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, alignItems: 'center' },
  pctText: { fontSize: SIZES.lg, fontWeight: '900' },

  counts: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  countItem: { alignItems: 'center' },
  countNum: { fontSize: SIZES.xl, fontWeight: '900' },
  countLabel: { fontSize: SIZES.xs, color: COLORS.gray500, marginTop: 2 },

  progressBg: { height: 6, backgroundColor: COLORS.gray100, borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: 6, borderRadius: 3 },
  notes: { fontSize: SIZES.sm, color: COLORS.gray600, marginTop: 4, fontStyle: 'italic' },

  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.gray100,
  },
  modalTitle: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.gray800 },
  closeBtn: { fontSize: 22, color: COLORS.gray500, padding: 4 },
  modalBody: { flex: 1, padding: SIZES.padding },

  fieldLabel: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.gray600, marginBottom: 8 },
  classChip: {
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 9, marginRight: 10,
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white,
  },
  classChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  classChipText: { fontSize: SIZES.sm, color: COLORS.gray700, fontWeight: '600' },

  calcPreview: {
    backgroundColor: COLORS.success + '12', borderRadius: 10, padding: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  calcLabel: { fontSize: SIZES.sm, color: COLORS.success, fontWeight: '600' },
  calcValue: { fontSize: SIZES.xl, fontWeight: '900', color: COLORS.success },
});
