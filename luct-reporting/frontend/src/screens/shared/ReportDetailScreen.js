import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, TextInput,
} from 'react-native';
import { reportsAPI, ratingsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Badge, ScreenHeader, StarRating, LoadingSpinner } from '../../components/UI';
import { COLORS, SIZES } from '../../constants/theme';

const STATUS_COLORS = { pending: COLORS.warning, reviewed: COLORS.success, rejected: COLORS.danger };

const Row = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value || '—'}</Text>
  </View>
);

export default function ReportDetailScreen({ navigation, route }) {
  const { reportId } = route.params;
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);

  const canAddFeedback = user?.role === 'principal_lecturer' || user?.role === 'program_leader';
  const canRate = user?.role !== 'student';
  const isOwner = report?.lecturerId === user?.uid;

  useEffect(() => { fetchReport(); }, []);

  const fetchReport = async () => {
    try {
      const res = await reportsAPI.getOne(reportId);
      setReport(res.data.data);
      setFeedback(res.data.data.feedback || '');
      setRating(res.data.data.rating || 0);
    } catch {
      Alert.alert('Error', 'Failed to load report');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async () => {
    if (!feedback.trim()) return Alert.alert('Error', 'Please enter feedback');
    setSubmittingFeedback(true);
    try {
      await reportsAPI.addFeedback(reportId, { feedback });
      Alert.alert('Success', 'Feedback submitted');
      fetchReport();
    } catch {
      Alert.alert('Error', 'Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleRating = async (score) => {
    setRating(score);
    setSubmittingRating(true);
    try {
      await ratingsAPI.submit({ targetId: reportId, targetType: 'report', score, reportId });
      Alert.alert('Success', `Rated ${score}/5 stars`);
    } catch {
      Alert.alert('Error', 'Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Report', 'Are you sure you want to delete this report?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await reportsAPI.delete(reportId);
            navigation.goBack();
          } catch {
            Alert.alert('Error', 'Failed to delete report');
          }
        },
      },
    ]);
  };

  if (loading) return <LoadingSpinner message="Loading report..." />;
  if (!report) return null;

  const attendance = report.totalRegisteredStudents > 0
    ? ((report.actualStudentsPresent / report.totalRegisteredStudents) * 100).toFixed(1)
    : 0;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Report Detail"
        onBack={() => navigation.goBack()}
        action={
          isOwner && report.status === 'pending' && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('CreateReport', { report })}>
                <Text style={styles.editBtnText}>✏️ Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                <Text style={styles.deleteBtnText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Status banner */}
        <View style={[styles.statusBanner, { backgroundColor: (STATUS_COLORS[report.status] || COLORS.gray500) + '18' }]}>
          <Badge label={report.status.toUpperCase()} color={STATUS_COLORS[report.status] || COLORS.gray500} />
          <Text style={styles.submittedAt}>Submitted: {new Date(report.createdAt).toLocaleDateString()}</Text>
        </View>

        {/* Attendance highlight */}
        <View style={styles.attendanceCard}>
          <View style={styles.attendanceStat}>
            <Text style={styles.attendanceBig}>{attendance}%</Text>
            <Text style={styles.attendanceLabel}>Attendance Rate</Text>
          </View>
          <View style={styles.attendanceDivider} />
          <View style={styles.attendanceStat}>
            <Text style={styles.attendanceBig}>{report.actualStudentsPresent}</Text>
            <Text style={styles.attendanceLabel}>Present</Text>
          </View>
          <View style={styles.attendanceDivider} />
          <View style={styles.attendanceStat}>
            <Text style={styles.attendanceBig}>{report.totalRegisteredStudents}</Text>
            <Text style={styles.attendanceLabel}>Registered</Text>
          </View>
        </View>

        {/* Class Info */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Class Information</Text>
          <Row label="Faculty" value={report.facultyName} />
          <Row label="Class" value={report.className} />
          <Row label="Course" value={report.courseName} />
          <Row label="Course Code" value={report.courseCode} />
          <Row label="Lecturer" value={report.lecturerName} />
          <Row label="Venue" value={report.venue} />
          <Row label="Scheduled Time" value={report.scheduledLectureTime} />
          <Row label="Date" value={report.dateOfLecture} />
          <Row label="Week" value={`Week ${report.weekOfReporting}`} />
        </Card>

        {/* Academic Content */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Academic Content</Text>
          <Text style={styles.contentLabel}>Topic Taught</Text>
          <Text style={styles.contentText}>{report.topicTaught}</Text>
          <Text style={styles.contentLabel}>Learning Outcomes</Text>
          <Text style={styles.contentText}>{report.learningOutcomes}</Text>
          {report.recommendations && <>
            <Text style={styles.contentLabel}>Recommendations</Text>
            <Text style={styles.contentText}>{report.recommendations}</Text>
          </>}
        </Card>

        {/* Feedback */}
        {(report.feedback || canAddFeedback) && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Feedback</Text>
            {report.feedback ? (
              <View style={styles.feedbackBox}>
                <Text style={styles.feedbackText}>{report.feedback}</Text>
                <Text style={styles.feedbackMeta}>— {report.feedbackBy} · {report.feedbackAt ? new Date(report.feedbackAt).toLocaleDateString() : ''}</Text>
              </View>
            ) : null}
            {canAddFeedback && (
              <View style={{ marginTop: 12 }}>
                <TextInput
                  style={styles.feedbackInput}
                  value={feedback}
                  onChangeText={setFeedback}
                  placeholder="Add your feedback..."
                  placeholderTextColor={COLORS.gray400}
                  multiline
                  numberOfLines={4}
                />
                <Button title="Submit Feedback" onPress={handleFeedback} loading={submittingFeedback} style={{ marginTop: 10 }} />
              </View>
            )}
          </Card>
        )}

        {/* Rating */}
        {canRate && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Rating</Text>
            <Text style={styles.ratingHint}>Rate this lecture report</Text>
            <StarRating value={rating} onRate={handleRating} editable={!submittingRating} size={32} />
            {report.rating && <Text style={styles.currentRating}>Current: {report.rating}/5 stars</Text>}
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.offWhite },
  body: { flex: 1 },

  statusBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, margin: 16, borderRadius: 12 },
  submittedAt: { fontSize: SIZES.xs, color: COLORS.gray500 },

  attendanceCard: {
    backgroundColor: COLORS.primary, marginHorizontal: 16, borderRadius: 16, padding: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginBottom: 16,
  },
  attendanceStat: { alignItems: 'center' },
  attendanceBig: { fontSize: SIZES.xxl, fontWeight: '900', color: COLORS.white },
  attendanceLabel: { fontSize: SIZES.xs, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  attendanceDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)' },

  section: { marginHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: SIZES.md, fontWeight: '800', color: COLORS.gray800, marginBottom: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },

  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: COLORS.gray50 },
  rowLabel: { fontSize: SIZES.sm, color: COLORS.gray500, flex: 1 },
  rowValue: { fontSize: SIZES.sm, color: COLORS.gray800, fontWeight: '600', flex: 2, textAlign: 'right' },

  contentLabel: { fontSize: SIZES.sm, color: COLORS.gray500, fontWeight: '600', marginTop: 12, marginBottom: 6 },
  contentText: { fontSize: SIZES.base, color: COLORS.gray700, lineHeight: 22 },

  feedbackBox: { backgroundColor: COLORS.primary + '08', borderRadius: 10, padding: 14, borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  feedbackText: { fontSize: SIZES.base, color: COLORS.gray700, lineHeight: 22 },
  feedbackMeta: { fontSize: SIZES.xs, color: COLORS.gray500, marginTop: 8, fontStyle: 'italic' },
  feedbackInput: {
    backgroundColor: COLORS.inputBg, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border,
    padding: 12, fontSize: SIZES.base, color: COLORS.gray700, minHeight: 100, textAlignVertical: 'top',
  },

  ratingHint: { fontSize: SIZES.sm, color: COLORS.gray500, marginBottom: 12 },
  currentRating: { fontSize: SIZES.sm, color: COLORS.secondary, fontWeight: '700', marginTop: 10 },

  editBtn: { backgroundColor: COLORS.primary + '12', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  editBtnText: { fontSize: SIZES.sm, color: COLORS.primary, fontWeight: '600' },
  deleteBtn: { backgroundColor: COLORS.danger + '12', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  deleteBtnText: { fontSize: SIZES.sm },
});

const COLORS50 = { gray50: '#F9FAFB' };
