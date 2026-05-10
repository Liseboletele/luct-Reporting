import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, Alert, Modal, ScrollView,
} from 'react-native';
import { ratingsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { SearchBar, Card, EmptyState, LoadingSpinner, ScreenHeader, Button, Input, StarRating } from '../../components/UI';
import { COLORS, SIZES } from '../../constants/theme';

// Target types per role as per the brief
const TARGET_TYPES_BY_ROLE = {
  student: ['lecturer', 'class'],
  lecturer: ['class', 'report'],
  principal_lecturer: ['lecturer', 'class', 'report'],
  program_leader: ['lecturer', 'class', 'report'],
};

const SCORE_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

export default function RatingsScreen() {
  const { user } = useAuth();
  const [ratings, setRatings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avgScore, setAvgScore] = useState(0);

  const targetTypes = TARGET_TYPES_BY_ROLE[user?.role] || ['lecturer', 'class', 'report'];

  const [form, setForm] = useState({
    targetId: '',
    targetType: targetTypes[0],
    score: 0,
    comment: '',
  });

  const fetchRatings = async () => {
    try {
      const res = await ratingsAPI.getAll();
      setRatings(res.data.data);
      setFiltered(res.data.data);
      setAvgScore(res.data.averageScore || 0);
    } catch {
      Alert.alert('Error', 'Failed to load ratings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchRatings(); }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(ratings); return; }
    const t = search.toLowerCase();
    setFiltered(ratings.filter(r =>
      r.ratedByName?.toLowerCase().includes(t) ||
      r.comment?.toLowerCase().includes(t) ||
      r.targetType?.toLowerCase().includes(t) ||
      r.targetId?.toLowerCase().includes(t)
    ));
  }, [search, ratings]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchRatings(); }, []);

  const resetForm = () => {
    setForm({ targetId: '', targetType: targetTypes[0], score: 0, comment: '' });
  };

  const handleSubmit = async () => {
    if (!form.targetId.trim()) {
      return Alert.alert('Missing Info', 'Please enter the ID or name of what you are rating');
    }
    if (form.score === 0) {
      return Alert.alert('Missing Rating', 'Please select a star rating before submitting');
    }
    setSaving(true);
    try {
      await ratingsAPI.submit(form);
      setShowForm(false);
      resetForm();
      fetchRatings();
      Alert.alert('Thank you!', 'Your rating has been submitted successfully.');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to submit rating. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 4) return COLORS.success;
    if (score >= 3) return COLORS.warning;
    return COLORS.danger;
  };

  const renderRating = ({ item }) => {
    const scoreColor = getScoreColor(item.score);
    return (
      <Card>
        {/* Header: type badge + stars */}
        <View style={styles.ratingHeader}>
          <View style={{ flex: 1 }}>
            <View style={[styles.typeBadge, { backgroundColor: COLORS.primary + '12' }]}>
              <Text style={[styles.typeLabel, { color: COLORS.primary }]}>
                {item.targetType?.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.ratedBy}>
              By {item.ratedByName}
              {item.ratedByRole ? ` · ${item.ratedByRole}` : ''}
            </Text>
          </View>
          <View style={styles.scoreBlock}>
            <Text style={[styles.scoreBig, { color: scoreColor }]}>{item.score}</Text>
            <Text style={styles.scoreOutOf}>/5</Text>
          </View>
        </View>

        {/* Star display */}
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Text
              key={s}
              style={{ color: s <= item.score ? COLORS.secondary : COLORS.gray300, fontSize: 18 }}
            >
              ★
            </Text>
          ))}
          <Text style={[styles.scoreWordLabel, { color: scoreColor }]}>
            {SCORE_LABELS[item.score] || ''}
          </Text>
        </View>

        {/* Comment */}
        {item.comment ? (
          <View style={styles.commentBox}>
            <Text style={styles.commentText}>"{item.comment}"</Text>
          </View>
        ) : null}

        {/* Target + date */}
        {item.targetId ? (
          <Text style={styles.targetId}>Target: {item.targetId}</Text>
        ) : null}
        <Text style={styles.ratingDate}>
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
        </Text>
      </Card>
    );
  };

  if (loading) return <LoadingSpinner message="Loading ratings..." />;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.offWhite }}>
      <ScreenHeader
        title="Ratings"
        subtitle={`${filtered.length} rating${filtered.length !== 1 ? 's' : ''}`}
        action={
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        }
      />

      <View style={{ flex: 1, paddingHorizontal: SIZES.padding, paddingTop: 16 }}>

        {/* Average score banner */}
        {ratings.length > 0 && (
          <View style={styles.avgCard}>
            <View style={styles.avgLeft}>
              <Text style={styles.avgScore}>{Number(avgScore).toFixed(1)}</Text>
              <Text style={styles.avgLabel}>Overall Average</Text>
            </View>
            <View style={styles.avgRight}>
              <View style={styles.starsLarge}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Text
                    key={s}
                    style={{ color: s <= Math.round(avgScore) ? COLORS.secondary : 'rgba(255,255,255,0.3)', fontSize: 26 }}
                  >
                    ★
                  </Text>
                ))}
              </View>
              <Text style={styles.totalRatings}>{ratings.length} ratings submitted</Text>
            </View>
          </View>
        )}

        <SearchBar value={search} onChangeText={setSearch} placeholder="Search ratings..." />

        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          renderItem={renderRating}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          ListEmptyComponent={
            <EmptyState
              title="No ratings yet"
              subtitle="Tap + to be the first to submit a rating"
              icon=""
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Submit Rating Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Submit Rating</Text>
          <TouchableOpacity onPress={() => { setShowForm(false); resetForm(); }}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">

          {/* Rating type selector */}
          <Text style={styles.fieldLabel}>What are you rating? *</Text>
          <View style={styles.typeRow}>
            {targetTypes.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeChip, form.targetType === t && styles.typeChipActive]}
                onPress={() => setForm(p => ({ ...p, targetType: t }))}
              >
                <Text style={[styles.typeChipText, form.targetType === t && { color: COLORS.white }]}>
                  {t === 'lecturer' ? ' Lecturer'
                    : t === 'class' ? ' Class'
                    : ' Report'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Target ID input with context-aware placeholder */}
          <Input
            label={
              form.targetType === 'lecturer' ? 'Lecturer Name or Staff ID *'
              : form.targetType === 'class' ? 'Class Name or Class ID *'
              : 'Report ID *'
            }
            value={form.targetId}
            onChangeText={(v) => setForm(p => ({ ...p, targetId: v }))}
            placeholder={
              form.targetType === 'lecturer' ? 'e.g. Dr. Mokoena or STAFF001'
              : form.targetType === 'class' ? 'e.g. BSE Year 2 Sem 2'
              : 'e.g. Report ID from the Reports screen'
            }
          />

          {/* Star rating picker */}
          <Text style={styles.fieldLabel}>Your Rating *</Text>
          <View style={styles.starPickerCard}>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setForm(p => ({ ...p, score: s }))}
                  style={styles.starBtn}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.starIcon,
                    { color: s <= form.score ? COLORS.secondary : COLORS.gray300 }
                  ]}>
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {form.score > 0 && (
              <View style={[styles.scoreLabelBadge, { backgroundColor: getScoreColor(form.score) + '18' }]}>
                <Text style={[styles.scoreLabelText, { color: getScoreColor(form.score) }]}>
                  {form.score}/5 — {SCORE_LABELS[form.score]}
                </Text>
              </View>
            )}
          </View>

          {/* Comment */}
          <Input
            label="Comment (optional)"
            value={form.comment}
            onChangeText={(v) => setForm(p => ({ ...p, comment: v }))}
            placeholder="Share your thoughts about this lecturer / class / report..."
            multiline
            numberOfLines={4}
          />

          <Button
            title={saving ? 'Submitting...' : 'Submit Rating'}
            onPress={handleSubmit}
            loading={saving}
            disabled={saving}
          />
          <Button
            title="Cancel"
            onPress={() => { setShowForm(false); resetForm(); }}
            variant="outline"
            style={{ marginTop: 10, marginBottom: 40 }}
          />
        </ScrollView>
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

  avgCard: {
    backgroundColor: COLORS.primary, borderRadius: 16, padding: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16,
  },
  avgLeft: { alignItems: 'center' },
  avgScore: { fontSize: 56, fontWeight: '900', color: COLORS.white, lineHeight: 64 },
  avgLabel: { fontSize: SIZES.xs, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  avgRight: { alignItems: 'flex-end' },
  starsLarge: { flexDirection: 'row', gap: 4 },
  totalRatings: { fontSize: SIZES.xs, color: 'rgba(255,255,255,0.6)', marginTop: 8 },

  ratingHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  typeBadge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 6 },
  typeLabel: { fontSize: SIZES.xs, fontWeight: '800', letterSpacing: 0.5 },
  ratedBy: { fontSize: SIZES.sm, color: COLORS.gray600 },
  scoreBlock: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  scoreBig: { fontSize: 32, fontWeight: '900' },
  scoreOutOf: { fontSize: SIZES.sm, color: COLORS.gray400, fontWeight: '600' },

  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  scoreWordLabel: { fontSize: SIZES.sm, fontWeight: '700', marginLeft: 8 },

  commentBox: {
    backgroundColor: COLORS.gray50 || COLORS.offWhite,
    borderRadius: 8, padding: 12, marginBottom: 8,
    borderLeftWidth: 3, borderLeftColor: COLORS.primary,
  },
  commentText: { fontSize: SIZES.base, color: COLORS.gray700, lineHeight: 22, fontStyle: 'italic' },
  targetId: { fontSize: SIZES.xs, color: COLORS.gray500, marginBottom: 4 },
  ratingDate: { fontSize: SIZES.xs, color: COLORS.gray400 },

  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.gray100,
  },
  modalTitle: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.gray800 },
  closeBtn: { fontSize: 22, color: COLORS.gray500, padding: 4 },
  modalBody: { flex: 1, padding: SIZES.padding },

  fieldLabel: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.gray600, marginBottom: 10 },

  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  typeChip: {
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white,
  },
  typeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeChipText: { fontSize: SIZES.sm, color: COLORS.gray700, fontWeight: '600' },

  starPickerCard: {
    backgroundColor: COLORS.offWhite, borderRadius: 16, padding: 20,
    alignItems: 'center', marginBottom: 20,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  starRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  starBtn: { padding: 4 },
  starIcon: { fontSize: 44 },
  scoreLabelBadge: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  scoreLabelText: { fontSize: SIZES.base, fontWeight: '800' },
});