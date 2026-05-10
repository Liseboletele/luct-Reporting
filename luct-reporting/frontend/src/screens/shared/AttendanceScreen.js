import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, Alert, Modal, ScrollView,
  KeyboardAvoidingView, Platform, TextInput,
} from 'react-native';
import {
  collection, addDoc, getDocs, query, where,
  serverTimestamp, orderBy,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { SearchBar, Card, EmptyState, LoadingSpinner, ScreenHeader } from '../../components/UI';
import { COLORS, SIZES } from '../../constants/theme';

export default function AttendanceScreen() {
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
  const isStudent = user?.role === 'student';

  const fetchAll = async () => {
    try {
      // Fetch classes from Firebase
      const classSnap = await getDocs(collection(db, 'classes'));
      const classData = classSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setClasses(classData);

      // Fetch attendance from Firebase
      const attSnap = await getDocs(collection(db, 'attendance'));
      let attData = attSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Students only see their own attendance
      if (isStudent) {
        attData = attData.filter(
          (r) => r.studentId === user?.uid || r.classId === user?.classId
        );
      }

      setRecords(attData);
      setFiltered(attData);
    } catch (e) {
      Alert.alert('Error', 'Failed to load attendance data');
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
      r.className?.toLowerCase().includes(t) ||
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
      totalRegistered: String(cls.totalRegisteredStudents || ''),
    }));
  };

  const resetForm = () => {
    setForm({
      classId: '', className: '',
      date: new Date().toISOString().split('T')[0],
      presentStudents: '', absentStudents: '', totalRegistered: '', notes: '',
    });
  };

  const handleRecord = async () => {
    if (!form.classId) return Alert.alert('Error', 'Please select a class first');
    if (!form.presentStudents) return Alert.alert('Error', 'Please enter number of students present');
    if (!form.totalRegistered) return Alert.alert('Error', 'Please enter total registered students');

    const present = Number(form.presentStudents);
    const total = Number(form.totalRegistered);
    const pct = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

    setSaving(true);
    try {
      await addDoc(collection(db, 'attendance'), {
        classId: form.classId,
        className: form.className,
        date: form.date,
        presentStudents: present,
        absentStudents: Number(form.absentStudents) || (total - present),
        totalRegistered: total,
        attendancePercentage: pct,
        notes: form.notes,
        lecturerId: user?.uid,
        lecturerName: user?.fullName || '',
        facultyName: user?.facultyName || '',
        createdAt: serverTimestamp(),
      });

      setShowForm(false);
      resetForm();
      fetchAll();
      Alert.alert('Success', `Attendance recorded! ${pct}% attendance rate.`);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to record attendance');
    } finally {
      setSaving(false);
    }
  };

  const getColor = (pct) => {
    if (pct >= 75) return COLORS.success;
    if (pct >= 50) return COLORS.warning;
    return COLORS.danger;
  };

  // Student summary
  const myAvg = records.length > 0
    ? (records.reduce((s, r) => s + Number(r.attendancePercentage || 0), 0) / records.length).toFixed(1)
    : null;

  const renderRecord = ({ item }) => {
    const pct = Number(item.attendancePercentage || 0);
    const color = getColor(pct);
    return (
      <Card>
        <View style={styles.recordHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.className}>{item.className || item.classId}</Text>
            <Text style={styles.date}>Date: {item.date} · Lecturer: {item.lecturerName}</Text>
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
            <Text style={styles.countLabel}>Total</Text>
          </View>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: color }]} />
        </View>
        {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
      </Card>
    );
  };

  if (loading) return <LoadingSpinner message="Loading attendance..." />;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.offWhite }}>
      <ScreenHeader
        title="Attendance"
        subtitle={isStudent ? 'Your attendance records' : `${filtered.length} record${filtered.length !== 1 ? 's' : ''}`}
        action={
          canRecord && (
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
              <Text style={styles.addBtnText}>+</Text>
            </TouchableOpacity>
          )
        }
      />

      <View style={{ flex: 1, paddingHorizontal: SIZES.padding, paddingTop: 16 }}>

        {/* Student summary card */}
        {isStudent && myAvg !== null && (
          <View style={[styles.summaryCard, { backgroundColor: getColor(Number(myAvg)) + '12', borderColor: getColor(Number(myAvg)) + '30' }]}>
            <View style={styles.summaryStat}>
              <Text style={[styles.summaryBig, { color: getColor(Number(myAvg)) }]}>{myAvg}%</Text>
              <Text style={styles.summaryLabel}>My Average</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStat}>
              <Text style={[styles.summaryBig, { color: COLORS.primary }]}>{records.length}</Text>
              <Text style={styles.summaryLabel}>Sessions</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStat}>
              <Text style={[styles.summaryBig, { color: Number(myAvg) >= 75 ? COLORS.success : COLORS.danger }]}>
                {Number(myAvg) >= 75 ? 'OK' : 'LOW'}
              </Text>
              <Text style={styles.summaryLabel}>Status</Text>
            </View>
          </View>
        )}

        <SearchBar value={search} onChangeText={setSearch} placeholder="Search attendance..." />

        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          renderItem={renderRecord}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          ListEmptyComponent={
            <EmptyState
              title="No attendance records"
              subtitle={canRecord ? 'Tap + to record attendance for your class' : 'No attendance records yet'}
              icon="✓"
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
            <TouchableOpacity onPress={() => { setShowForm(false); resetForm(); }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">

            {/* Class selector */}
            <Text style={styles.fieldLabel}>Select Class *</Text>
            {classes.length === 0 ? (
              <View style={styles.noClassBox}>
                <Text style={styles.noClassText}>No classes found. Please add a class first.</Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                {classes.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.classChip, form.classId === c.id && styles.classChipActive]}
                    onPress={() => selectClass(c)}
                  >
                    <Text style={[styles.classChipText, form.classId === c.id && { color: COLORS.white }]}>
                      {c.className}
                    </Text>
                    <Text style={[styles.classChipSub, form.classId === c.id && { color: 'rgba(255,255,255,0.7)' }]}>
                      {c.courseCode}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Selected class info */}
            {form.className ? (
              <View style={styles.selectedClass}>
                <Text style={styles.selectedClassText}>Selected: {form.className}</Text>
              </View>
            ) : null}

            {/* Date */}
            <Text style={styles.fieldLabel}>Date *</Text>
            <TextInput
              style={styles.fieldInput}
              value={form.date}
              onChangeText={(v) => setForm(p => ({ ...p, date: v }))}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#aaa"
            />

            {/* Total students */}
            <Text style={styles.fieldLabel}>Total Registered Students *</Text>
            <TextInput
              style={styles.fieldInput}
              value={form.totalRegistered}
              onChangeText={(v) => setForm(p => ({ ...p, totalRegistered: v }))}
              placeholder="Auto-filled from class"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
            />

            {/* Students present */}
            <Text style={styles.fieldLabel}>Students Present *</Text>
            <TextInput
              style={styles.fieldInput}
              value={form.presentStudents}
              onChangeText={(v) => {
                const present = Number(v);
                const total = Number(form.totalRegistered);
                const absent = total - present >= 0 ? String(total - present) : '';
                setForm(p => ({ ...p, presentStudents: v, absentStudents: absent }));
              }}
              keyboardType="numeric"
              placeholder="e.g. 28"
              placeholderTextColor="#aaa"
            />

            {/* Students absent */}
            <Text style={styles.fieldLabel}>Students Absent (auto-calculated)</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: COLORS.gray100 }]}
              value={form.absentStudents}
              editable={false}
              placeholder="Auto-calculated"
              placeholderTextColor="#aaa"
            />

            {/* Attendance rate preview */}
            {form.presentStudents && form.totalRegistered ? (
              <View style={styles.calcPreview}>
                <Text style={styles.calcLabel}>Attendance Rate</Text>
                <Text style={[styles.calcValue, {
                  color: getColor(((Number(form.presentStudents) / Number(form.totalRegistered)) * 100))
                }]}>
                  {((Number(form.presentStudents) / Number(form.totalRegistered)) * 100).toFixed(1)}%
                </Text>
              </View>
            ) : null}

            {/* Notes */}
            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.fieldInput, { height: 80, textAlignVertical: 'top' }]}
              value={form.notes}
              onChangeText={(v) => setForm(p => ({ ...p, notes: v }))}
              placeholder="Any additional notes..."
              placeholderTextColor="#aaa"
              multiline
            />

            <TouchableOpacity
              style={[styles.submitBtn, saving && { opacity: 0.7 }]}
              onPress={handleRecord}
              disabled={saving}
            >
              <Text style={styles.submitBtnText}>{saving ? 'Recording...' : 'Record Attendance'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => { setShowForm(false); resetForm(); }}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
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

  summaryCard: {
    borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
  },
  summaryStat: { alignItems: 'center' },
  summaryBig: { fontSize: SIZES.xl, fontWeight: '900' },
  summaryLabel: { fontSize: SIZES.xs, color: COLORS.gray500, marginTop: 4 },
  summaryDivider: { width: 1, height: 36, backgroundColor: COLORS.gray200 },

  recordHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  className: { fontSize: SIZES.md, fontWeight: '800', color: COLORS.gray800 },
  date: { fontSize: SIZES.xs, color: COLORS.gray500, marginTop: 3 },
  pctBadge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  pctText: { fontSize: SIZES.lg, fontWeight: '900' },

  counts: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  countItem: { alignItems: 'center' },
  countNum: { fontSize: SIZES.xl, fontWeight: '900' },
  countLabel: { fontSize: SIZES.xs, color: COLORS.gray500, marginTop: 2 },

  progressBg: { height: 6, backgroundColor: COLORS.gray100, borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: 6, borderRadius: 3 },
  notes: { fontSize: SIZES.sm, color: COLORS.gray600, fontStyle: 'italic', marginTop: 4 },

  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.gray100,
  },
  modalTitle: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.gray800 },
  closeBtn: { fontSize: 22, color: COLORS.gray500, padding: 4 },
  modalBody: { flex: 1, padding: SIZES.padding },

  fieldLabel: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.gray600, marginBottom: 8 },
  fieldInput: {
    backgroundColor: COLORS.offWhite, borderRadius: 10,
    borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: SIZES.base, color: COLORS.gray800, marginBottom: 16,
  },

  noClassBox: {
    backgroundColor: COLORS.warning + '12', borderRadius: 10, padding: 14,
    borderLeftWidth: 3, borderLeftColor: COLORS.warning, marginBottom: 16,
  },
  noClassText: { fontSize: SIZES.sm, color: COLORS.warning, fontWeight: '600' },

  classChip: {
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginRight: 10,
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  classChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  classChipText: { fontSize: SIZES.sm, color: COLORS.gray700, fontWeight: '700' },
  classChipSub: { fontSize: SIZES.xs, color: COLORS.gray400, marginTop: 2 },

  selectedClass: {
    backgroundColor: COLORS.primary + '10', borderRadius: 8, padding: 10, marginBottom: 16,
  },
  selectedClassText: { fontSize: SIZES.sm, color: COLORS.primary, fontWeight: '600' },

  calcPreview: {
    backgroundColor: COLORS.success + '12', borderRadius: 10, padding: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  calcLabel: { fontSize: SIZES.sm, color: COLORS.gray600, fontWeight: '600' },
  calcValue: { fontSize: SIZES.xl, fontWeight: '900' },

  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 12,
  },
  submitBtnText: { color: COLORS.white, fontSize: SIZES.base, fontWeight: '800' },
  cancelBtn: {
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.border, marginBottom: 40,
  },
  cancelBtnText: { color: COLORS.gray600, fontSize: SIZES.base, fontWeight: '600' },
});