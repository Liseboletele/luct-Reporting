import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, Alert, Modal, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { classesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { SearchBar, Card, EmptyState, LoadingSpinner, ScreenHeader, Button, Input } from '../../components/UI';
import { COLORS, SIZES } from '../../constants/theme';

export default function ClassesScreen({ navigation }) {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ className: '', courseCode: '', courseName: '', facultyName: user?.facultyName || '', scheduledTime: '', venue: '', totalRegisteredStudents: '' });
  const [saving, setSaving] = useState(false);

  const canCreate = user?.role === 'program_leader' || user?.role === 'principal_lecturer';

  const fetch = async () => {
    try {
      const res = await classesAPI.getAll();
      setClasses(res.data.data);
      setFiltered(res.data.data);
    } catch { Alert.alert('Error', 'Failed to load classes'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetch(); }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(classes); return; }
    const t = search.toLowerCase();
    setFiltered(classes.filter(c => c.className?.toLowerCase().includes(t) || c.courseName?.toLowerCase().includes(t) || c.courseCode?.toLowerCase().includes(t)));
  }, [search, classes]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetch(); }, []);

  const handleCreate = async () => {
    if (!form.className || !form.courseCode || !form.courseName) return Alert.alert('Error', 'Fill required fields');
    setSaving(true);
    try {
      await classesAPI.create(form);
      setShowForm(false);
      setForm({ className: '', courseCode: '', courseName: '', facultyName: user?.facultyName || '', scheduledTime: '', venue: '', totalRegisteredStudents: '' });
      fetch();
    } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Failed to create class'); }
    finally { setSaving(false); }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Class', 'Deactivate this class?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { try { await classesAPI.delete(id); fetch(); } catch {} } },
    ]);
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
            <Text>🗑️</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.courseName}>{item.courseName}</Text>
      <View style={styles.classMeta}>
        <Text style={styles.metaItem}>📍 {item.venue || '—'}</Text>
        <Text style={styles.metaItem}>⏰ {item.scheduledTime || '—'}</Text>
      </View>
      <View style={styles.classMeta}>
        <Text style={styles.metaItem}>👥 {item.totalRegisteredStudents} students</Text>
        <Text style={styles.metaItem}>👨‍🏫 {item.assignedLecturerName}</Text>
      </View>
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          ListEmptyComponent={<EmptyState title="No classes found" icon="🏫" subtitle={canCreate ? 'Add your first class' : 'No classes assigned yet'} />}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Create Class Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Class</Text>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Input label="Class Name *" value={form.className} onChangeText={(v) => setForm(p => ({ ...p, className: v }))} placeholder="e.g. BSE Year 2 Sem 2" />
            <Input label="Course Code *" value={form.courseCode} onChangeText={(v) => setForm(p => ({ ...p, courseCode: v }))} placeholder="BIMP2210" autoCapitalize="characters" />
            <Input label="Course Name *" value={form.courseName} onChangeText={(v) => setForm(p => ({ ...p, courseName: v }))} placeholder="Mobile Device Programming" />
            <Input label="Faculty" value={form.facultyName} onChangeText={(v) => setForm(p => ({ ...p, facultyName: v }))} placeholder="Faculty of ICT" />
            <Input label="Venue" value={form.venue} onChangeText={(v) => setForm(p => ({ ...p, venue: v }))} placeholder="Lab 3, Block B" />
            <Input label="Scheduled Time" value={form.scheduledTime} onChangeText={(v) => setForm(p => ({ ...p, scheduledTime: v }))} placeholder="Mon/Wed 08:00-10:00" />
            <Input label="Total Registered Students" value={form.totalRegisteredStudents} onChangeText={(v) => setForm(p => ({ ...p, totalRegisteredStudents: v }))} placeholder="35" keyboardType="numeric" />
            <Button title="Create Class" onPress={handleCreate} loading={saving} />
            <Button title="Cancel" onPress={() => setShowForm(false)} variant="outline" style={{ marginTop: 10, marginBottom: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  addBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  addText: { color: COLORS.white, fontSize: 24, fontWeight: '400', lineHeight: 34 },
  classHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  className: { fontSize: SIZES.md, fontWeight: '800', color: COLORS.gray800 },
  courseCode: { fontSize: SIZES.xs, color: COLORS.primary, fontWeight: '700', marginTop: 2 },
  courseName: { fontSize: SIZES.sm, color: COLORS.gray600, marginBottom: 10 },
  classMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  metaItem: { fontSize: SIZES.sm, color: COLORS.gray500 },
  deleteBtn: { padding: 8 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  modalTitle: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.gray800 },
  closeBtn: { fontSize: 22, color: COLORS.gray500, padding: 4 },
  modalBody: { flex: 1, padding: SIZES.padding },
});
