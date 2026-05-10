import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, Alert, Modal, ScrollView,
  KeyboardAvoidingView, Platform, TextInput,
} from 'react-native';
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { SearchBar, Card, EmptyState, LoadingSpinner, ScreenHeader } from '../../components/UI';
import { COLORS, SIZES } from '../../constants/theme';

// Helper: works on both web and mobile
const showAlert = (title, message) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}: ${message}`);
  } else {
    Alert.alert(title, message);
  }
};

const showConfirm = (message, onConfirm) => {
  if (Platform.OS === 'web') {
    if (window.confirm(message)) onConfirm();
  } else {
    Alert.alert('Confirm', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'OK', style: 'destructive', onPress: onConfirm },
    ]);
  }
};

export default function ClassesScreen({ navigation }) {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [className, setClassName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [facultyName, setFacultyName] = useState(user?.facultyName || '');
  const [venue, setVenue] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [totalStudents, setTotalStudents] = useState('');

  const canCreate = ['lecturer', 'principal_lecturer', 'program_leader'].includes(user?.role);

  const fetchClasses = async () => {
    try {
      const snap = await getDocs(collection(db, 'classes'));
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setClasses(data);
      setFiltered(data);
    } catch (e) {
      showAlert('Error', 'Failed to load classes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchClasses(); }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(classes); return; }
    const t = search.toLowerCase();
    setFiltered(classes.filter(c =>
      c.className?.toLowerCase().includes(t) ||
      c.courseName?.toLowerCase().includes(t) ||
      c.courseCode?.toLowerCase().includes(t)
    ));
  }, [search, classes]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchClasses(); }, []);

  const resetForm = () => {
    setClassName('');
    setCourseCode('');
    setCourseName('');
    setFacultyName(user?.facultyName || '');
    setVenue('');
    setScheduledTime('');
    setTotalStudents('');
  };

  const handleCreate = async () => {
    if (!className.trim()) return showAlert('Error', 'Class name is required');
    if (!courseCode.trim()) return showAlert('Error', 'Course code is required');
    if (!courseName.trim()) return showAlert('Error', 'Course name is required');

    setSaving(true);
    try {
      await addDoc(collection(db, 'classes'), {
        className: className.trim(),
        courseCode: courseCode.trim(),
        courseName: courseName.trim(),
        facultyName: facultyName.trim(),
        venue: venue.trim(),
        scheduledTime: scheduledTime.trim(),
        totalRegisteredStudents: Number(totalStudents) || 0,
        createdBy: user?.uid || '',
        createdByName: user?.fullName || '',
        assignedLecturerName: user?.fullName || '',
        createdAt: serverTimestamp(),
      });
      setShowForm(false);
      resetForm();
      fetchClasses();
      showAlert('Success', 'Class created successfully!');
    } catch (e) {
      showAlert('Error', e.message || 'Failed to create class');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    showConfirm('Are you sure you want to delete this class?', async () => {
      try {
        await deleteDoc(doc(db, 'classes', id));
        setClasses((prev) => prev.filter((c) => c.id !== id));
        setFiltered((prev) => prev.filter((c) => c.id !== id));
      } catch (e) {
        showAlert('Error', 'Failed to delete: ' + e.message);
      }
    });
  };

  const renderClass = ({ item }) => (
    <Card>
      <View style={styles.classHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.className}>{item.className}</Text>
          <Text style={styles.courseCode}>{item.courseCode}</Text>
        </View>
        {canCreate && (
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.courseName}>{item.courseName}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.metaItem}>Venue: {item.venue || '—'}</Text>
        <Text style={styles.metaItem}>Time: {item.scheduledTime || '—'}</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaItem}>Students: {item.totalRegisteredStudents || 0}</Text>
        <Text style={styles.metaItem}>Faculty: {item.facultyName || '—'}</Text>
      </View>
      {item.assignedLecturerName ? (
        <Text style={styles.lecturerName}>Lecturer: {item.assignedLecturerName}</Text>
      ) : null}
    </Card>
  );

  if (loading) return <LoadingSpinner message="Loading classes..." />;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.offWhite }}>
      <ScreenHeader
        title="Classes"
        subtitle={`${filtered.length} class${filtered.length !== 1 ? 'es' : ''}`}
        action={
          canCreate && (
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
              <Text style={styles.addText}>+</Text>
            </TouchableOpacity>
          )
        }
      />

      <View style={{ flex: 1, paddingHorizontal: SIZES.padding, paddingTop: 16 }}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search classes..." />
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          renderItem={renderClass}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          ListEmptyComponent={
            <EmptyState
              title="No classes found"
              icon="▦"
              subtitle={canCreate ? 'Tap + to add your first class' : 'No classes available yet'}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Create Class Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Class</Text>
            <TouchableOpacity onPress={() => { setShowForm(false); resetForm(); }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">

            <Text style={styles.fieldLabel}>Class Name *</Text>
            <TextInput
              style={styles.fieldInput}
              value={className}
              onChangeText={setClassName}
              placeholder="e.g. BSE Year 2 Sem 2"
              placeholderTextColor="#aaa"
              autoCapitalize="words"
            />

            <Text style={styles.fieldLabel}>Course Code *</Text>
            <TextInput
              style={styles.fieldInput}
              value={courseCode}
              onChangeText={setCourseCode}
              placeholder="e.g. BIMP2210"
              placeholderTextColor="#aaa"
              autoCapitalize="characters"
            />

            <Text style={styles.fieldLabel}>Course Name *</Text>
            <TextInput
              style={styles.fieldInput}
              value={courseName}
              onChangeText={setCourseName}
              placeholder="e.g. Mobile Device Programming"
              placeholderTextColor="#aaa"
              autoCapitalize="words"
            />

            <Text style={styles.fieldLabel}>Faculty / Department</Text>
            <TextInput
              style={styles.fieldInput}
              value={facultyName}
              onChangeText={setFacultyName}
              placeholder="e.g. Faculty of ICT"
              placeholderTextColor="#aaa"
              autoCapitalize="words"
            />

            <Text style={styles.fieldLabel}>Venue</Text>
            <TextInput
              style={styles.fieldInput}
              value={venue}
              onChangeText={setVenue}
              placeholder="e.g. Lab 3, Block B"
              placeholderTextColor="#aaa"
            />

            <Text style={styles.fieldLabel}>Scheduled Time</Text>
            <TextInput
              style={styles.fieldInput}
              value={scheduledTime}
              onChangeText={setScheduledTime}
              placeholder="e.g. Mon/Wed 08:00–10:00"
              placeholderTextColor="#aaa"
            />

            <Text style={styles.fieldLabel}>Total Registered Students</Text>
            <TextInput
              style={styles.fieldInput}
              value={totalStudents}
              onChangeText={setTotalStudents}
              placeholder="e.g. 35"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={[styles.submitBtn, saving && { opacity: 0.7 }]}
              onPress={handleCreate}
              disabled={saving}
            >
              <Text style={styles.submitBtnText}>
                {saving ? 'Creating...' : 'Create Class'}
              </Text>
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
  addText: { color: COLORS.white, fontSize: 24, fontWeight: '400', lineHeight: 34 },

  classHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  className: { fontSize: SIZES.md, fontWeight: '800', color: COLORS.gray800 },
  courseCode: { fontSize: SIZES.xs, color: COLORS.primary, fontWeight: '700', marginTop: 2 },
  courseName: { fontSize: SIZES.sm, color: COLORS.gray600, marginBottom: 10 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  metaItem: { fontSize: SIZES.sm, color: COLORS.gray500 },
  lecturerName: { fontSize: SIZES.sm, color: COLORS.gray500, marginTop: 4 },
  deleteBtn: {
    backgroundColor: COLORS.danger + '14', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  deleteText: { color: COLORS.danger, fontSize: SIZES.xs, fontWeight: '700' },

  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.gray100,
  },
  modalTitle: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.gray800 },
  closeBtn: { fontSize: 22, color: COLORS.gray500, padding: 4 },
  modalBody: { flex: 1, padding: SIZES.padding },

  fieldLabel: {
    fontSize: SIZES.sm, fontWeight: '600',
    color: COLORS.gray600, marginBottom: 6, marginTop: 4,
  },
  fieldInput: {
    backgroundColor: COLORS.offWhite, borderRadius: 10,
    borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: SIZES.base, color: COLORS.gray800, marginBottom: 14,
  },

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