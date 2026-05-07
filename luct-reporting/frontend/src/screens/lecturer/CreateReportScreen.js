import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { reportsAPI, classesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, ScreenHeader } from '../../components/UI';
import { COLORS, SIZES } from '../../constants/theme';

const WEEKS = Array.from({ length: 16 }, (_, i) => String(i + 1));

export default function CreateReportScreen({ navigation, route }) {
  const { user } = useAuth();
  const editReport = route.params?.report || null;

  const [form, setForm] = useState({
    facultyName: user?.facultyName || '',
    className: '',
    weekOfReporting: '1',
    dateOfLecture: new Date().toISOString().split('T')[0],
    courseName: '',
    courseCode: '',
    actualStudentsPresent: '',
    totalRegisteredStudents: '',
    venue: '',
    scheduledLectureTime: '',
    topicTaught: '',
    learningOutcomes: '',
    recommendations: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [showWeekPicker, setShowWeekPicker] = useState(false);

  useEffect(() => {
    if (editReport) {
      setForm({ ...editReport });
    }
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const res = await classesAPI.getAll();
      setClasses(res.data.data);
    } catch {}
  };

  const update = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const fillFromClass = (cls) => {
    update('className', cls.className);
    update('courseName', cls.courseName);
    update('courseCode', cls.courseCode);
    update('venue', cls.venue);
    update('scheduledLectureTime', cls.scheduledTime);
    update('totalRegisteredStudents', String(cls.totalRegisteredStudents));
    update('facultyName', cls.facultyName);
  };

  const validate = () => {
    const errs = {};
    const required = ['facultyName', 'className', 'weekOfReporting', 'dateOfLecture', 'courseName',
      'courseCode', 'actualStudentsPresent', 'totalRegisteredStudents', 'venue',
      'scheduledLectureTime', 'topicTaught', 'learningOutcomes'];
    required.forEach((f) => {
      if (!form[f]?.toString().trim()) errs[f] = 'This field is required';
    });
    if (form.actualStudentsPresent && isNaN(Number(form.actualStudentsPresent))) errs.actualStudentsPresent = 'Must be a number';
    if (form.totalRegisteredStudents && isNaN(Number(form.totalRegisteredStudents))) errs.totalRegisteredStudents = 'Must be a number';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      if (editReport) {
        await reportsAPI.update(editReport.id, form);
        Alert.alert('Success', 'Report updated successfully', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        await reportsAPI.create(form);
        Alert.alert('Success', 'Report submitted successfully!', [{ text: 'OK', onPress: () => navigation.navigate('Reports') }]);
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const FormSection = ({ title, children }) => (
    <View style={styles.formSection}>
      <View style={styles.sectionBar} />
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader
        title={editReport ? 'Edit Report' : 'Submit Report'}
        subtitle="Lecture reporting form"
        onBack={() => navigation.goBack()}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Quick fill from class */}
        {classes.length > 0 && (
          <View style={styles.quickFill}>
            <Text style={styles.quickFillLabel}>Quick fill from your class:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              {classes.map((c) => (
                <TouchableOpacity key={c.id} style={styles.classChip} onPress={() => fillFromClass(c)}>
                  <Text style={styles.classChipText}>{c.className}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <FormSection title="Class Information">
          <Input label="Faculty Name *" value={form.facultyName} onChangeText={(v) => update('facultyName', v)}
            placeholder="Faculty of ICT" error={errors.facultyName} />
          <Input label="Class Name *" value={form.className} onChangeText={(v) => update('className', v)}
            placeholder="e.g. BSE Year 2 Semester 2" error={errors.className} />
          <Input label="Course Name *" value={form.courseName} onChangeText={(v) => update('courseName', v)}
            placeholder="Mobile Device Programming" error={errors.courseName} />
          <Input label="Course Code *" value={form.courseCode} onChangeText={(v) => update('courseCode', v)}
            placeholder="BIMP2210" autoCapitalize="characters" error={errors.courseCode} />
          <Input label="Venue *" value={form.venue} onChangeText={(v) => update('venue', v)}
            placeholder="e.g. Lab 3, Block B" error={errors.venue} />
          <Input label="Scheduled Lecture Time *" value={form.scheduledLectureTime} onChangeText={(v) => update('scheduledLectureTime', v)}
            placeholder="e.g. 08:00 - 10:00" error={errors.scheduledLectureTime} />
        </FormSection>

        <FormSection title="Session Details">
          <Input label="Date of Lecture *" value={form.dateOfLecture} onChangeText={(v) => update('dateOfLecture', v)}
            placeholder="YYYY-MM-DD" error={errors.dateOfLecture} />

          {/* Week Selector */}
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.label}>Week of Reporting *</Text>
            <TouchableOpacity style={styles.weekSelector} onPress={() => setShowWeekPicker(!showWeekPicker)}>
              <Text style={styles.weekValue}>Week {form.weekOfReporting}</Text>
              <Text style={{ color: COLORS.gray400 }}>▼</Text>
            </TouchableOpacity>
            {showWeekPicker && (
              <View style={styles.weekDropdown}>
                <ScrollView style={{ maxHeight: 200 }}>
                  {WEEKS.map((w) => (
                    <TouchableOpacity key={w} style={[styles.weekOption, form.weekOfReporting === w && styles.weekOptionActive]}
                      onPress={() => { update('weekOfReporting', w); setShowWeekPicker(false); }}>
                      <Text style={[styles.weekOptionText, form.weekOfReporting === w && { color: COLORS.primary, fontWeight: '700' }]}>
                        Week {w}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <Input label="Actual Students Present *" value={form.actualStudentsPresent} onChangeText={(v) => update('actualStudentsPresent', v)}
            placeholder="e.g. 28" keyboardType="numeric" error={errors.actualStudentsPresent} />
          <Input label="Total Registered Students *" value={form.totalRegisteredStudents} onChangeText={(v) => update('totalRegisteredStudents', v)}
            placeholder="e.g. 35" keyboardType="numeric" error={errors.totalRegisteredStudents} />
          {form.actualStudentsPresent && form.totalRegisteredStudents &&
            !isNaN(Number(form.actualStudentsPresent)) && !isNaN(Number(form.totalRegisteredStudents)) && (
            <View style={styles.attendancePct}>
              <Text style={styles.pctLabel}>Attendance Rate</Text>
              <Text style={styles.pctValue}>
                {((Number(form.actualStudentsPresent) / Number(form.totalRegisteredStudents)) * 100).toFixed(1)}%
              </Text>
            </View>
          )}
        </FormSection>

        <FormSection title="Academic Content">
          <Input label="Topic Taught *" value={form.topicTaught} onChangeText={(v) => update('topicTaught', v)}
            placeholder="e.g. Introduction to React Native Navigation"
            multiline numberOfLines={3} error={errors.topicTaught} />
          <Input label="Learning Outcomes *" value={form.learningOutcomes} onChangeText={(v) => update('learningOutcomes', v)}
            placeholder="Students should be able to..."
            multiline numberOfLines={4} error={errors.learningOutcomes} />
          <Input label="Lecturer's Recommendations" value={form.recommendations} onChangeText={(v) => update('recommendations', v)}
            placeholder="Any recommendations for improvement..."
            multiline numberOfLines={3} />
        </FormSection>

        <View style={styles.submitArea}>
          <Button title={editReport ? 'Update Report' : 'Submit Report'} onPress={handleSubmit} loading={loading} />
          <Button title="Cancel" onPress={() => navigation.goBack()} variant="outline" style={{ marginTop: 10 }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.offWhite },
  content: { paddingBottom: 40 },

  quickFill: {
    backgroundColor: COLORS.primary + '0C',
    borderLeftWidth: 3, borderLeftColor: COLORS.primary,
    margin: SIZES.padding, borderRadius: 12, padding: 14,
  },
  quickFillLabel: { fontSize: SIZES.sm, color: COLORS.primary, fontWeight: '700' },
  classChip: {
    backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 10,
  },
  classChipText: { color: COLORS.white, fontSize: SIZES.sm, fontWeight: '600' },

  formSection: {
    backgroundColor: COLORS.white, marginHorizontal: SIZES.padding,
    marginBottom: 16, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.gray100,
  },
  sectionBar: { width: 32, height: 3, backgroundColor: COLORS.secondary, borderRadius: 2, marginBottom: 12 },
  sectionTitle: { fontSize: SIZES.md, fontWeight: '800', color: COLORS.gray800, marginBottom: 16 },
  label: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.gray600, marginBottom: 6 },

  weekSelector: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.inputBg, borderRadius: 8, borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  weekValue: { fontSize: SIZES.base, color: COLORS.gray700, fontWeight: '600' },
  weekDropdown: {
    backgroundColor: COLORS.white, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border,
    marginTop: 4, overflow: 'hidden',
  },
  weekOption: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  weekOptionActive: { backgroundColor: COLORS.primary + '10' },
  weekOptionText: { fontSize: SIZES.base, color: COLORS.gray700 },

  attendancePct: {
    backgroundColor: COLORS.success + '12', borderRadius: 10, padding: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
  },
  pctLabel: { fontSize: SIZES.sm, color: COLORS.success, fontWeight: '600' },
  pctValue: { fontSize: SIZES.xl, fontWeight: '900', color: COLORS.success },

  submitArea: { paddingHorizontal: SIZES.padding, marginTop: 8 },
});
