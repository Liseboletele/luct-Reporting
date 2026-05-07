import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, Alert, Modal, ScrollView,
} from 'react-native';
import { ratingsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { SearchBar, Card, EmptyState, LoadingSpinner, ScreenHeader, Button, Input, StarRating } from '../../components/UI';
import { COLORS, SIZES } from '../../constants/theme';

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
  const [form, setForm] = useState({ targetId: '', targetType: 'lecturer', score: 0, comment: '' });

  const fetchRatings = async () => {
    try {
      const res = await ratingsAPI.getAll();
      setRatings(res.data.data);
      setFiltered(res.data.data);
      setAvgScore(res.data.averageScore);
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
      r.targetType?.toLowerCase().includes(t)
    ));
  }, [search, ratings]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchRatings(); }, []);

  const handleSubmit = async () => {
    if (!form.targetId.trim()) return Alert.alert('Error', 'Please enter a target (e.g. lecturer ID or name)');
    if (form.score === 0) return Alert.alert('Error', 'Please select a star rating');
    setSaving(true);
    try {
      await ratingsAPI.submit(form);
      setShowForm(false);
      setForm({ targetId: '', targetType: 'lecturer', score: 0, comment: '' });
      fetchRatings();
      Alert.alert('Success', 'Rating submitted!');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to submit rating');
    } finally {
      setSaving(false);
    }
  };

  const TARGET_TYPES = ['lecturer', 'class', 'report'];

  const renderRating = ({ item }) => (
    <Card>
      <View style={styles.ratingHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.targetType}>{item.targetType?.toUpperCase()}</Text>
          <Text style={styles.ratedBy}>By {item.ratedByName} · {item.ratedByRole}</Text>
        </View>
        <StarRating value={item.score} size={20} />
      </View>
      {item.comment ? <Text style={styles.comment}>"{item.comment}"</Text> : null}
      <Text style={styles.ratingDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
    </Card>
  );

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
        {/* Average score card */}
        {ratings.length > 0 && (
          <View style={styles.avgCard}>
            <Text style={styles.avgScore}>{avgScore}</Text>
            <StarRating value={Math.round(avgScore)} size={28} />
            <Text style={styles.avgLabel}>Overall Average Rating</Text>
          </View>
        )}

        <SearchBar value={search} onChangeText={setSearch} placeholder="Search ratings..." />
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          renderItem={renderRating}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          ListEmptyComponent={
            <EmptyState title="No ratings yet" subtitle="Be the first to submit a rating" icon="⭐" />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Submit Rating Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Submit Rating</Text>
          <TouchableOpacity onPress={() => setShowForm(false)}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
          <Text style={styles.fieldLabel}>Rating Type</Text>
          <View style={styles.typeRow}>
            {TARGET_TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeChip, form.targetType === t && styles.typeChipActive]}
                onPress={() => setForm(p => ({ ...p, targetType: t }))}
              >
                <Text style={[styles.typeChipText, form.targetType === t && { color: COLORS.white }]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Target ID / Name *"
            value={form.targetId}
            onChangeText={(v) => setForm(p => ({ ...p, targetId: v }))}
            placeholder="Lecturer ID, Class ID, or Report ID"
          />

          <Text style={styles.fieldLabel}>Your Rating *</Text>
          <View style={styles.starPicker}>
            <StarRating value={form.score} onRate={(s) => setForm(p => ({ ...p, score: s }))} editable size={40} />
            {form.score > 0 && (
              <Text style={styles.scoreLabel}>{['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][form.score]}</Text>
            )}
          </View>

          <Input
            label="Comment (optional)"
            value={form.comment}
            onChangeText={(v) => setForm(p => ({ ...p, comment: v }))}
            placeholder="Share your thoughts..."
            multiline
            numberOfLines={4}
          />

          <Button title="Submit Rating" onPress={handleSubmit} loading={saving} />
          <Button title="Cancel" onPress={() => setShowForm(false)} variant="outline" style={{ marginTop: 10, marginBottom: 40 }} />
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  addBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: COLORS.white, fontSize: 24, fontWeight: '400', lineHeight: 34 },

  avgCard: {
    backgroundColor: COLORS.primary, borderRadius: 16, padding: 20,
    alignItems: 'center', marginBottom: 16,
  },
  avgScore: { fontSize: 52, fontWeight: '900', color: COLORS.white, lineHeight: 60 },
  avgLabel: { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.7)', marginTop: 8 },

  ratingHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  targetType: { fontSize: SIZES.xs, fontWeight: '800', color: COLORS.primary, letterSpacing: 1 },
  ratedBy: { fontSize: SIZES.sm, color: COLORS.gray600, marginTop: 3 },
  comment: { fontSize: SIZES.base, color: COLORS.gray700, fontStyle: 'italic', lineHeight: 22, marginBottom: 8 },
  ratingDate: { fontSize: SIZES.xs, color: COLORS.gray400 },

  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.gray100,
  },
  modalTitle: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.gray800 },
  closeBtn: { fontSize: 22, color: COLORS.gray500, padding: 4 },
  modalBody: { flex: 1, padding: SIZES.padding },

  fieldLabel: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.gray600, marginBottom: 8 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeChip: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 9, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white },
  typeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeChipText: { fontSize: SIZES.sm, color: COLORS.gray700, fontWeight: '600' },

  starPicker: { alignItems: 'center', paddingVertical: 20, marginBottom: 16, backgroundColor: COLORS.gray100, borderRadius: 12 },
  scoreLabel: { marginTop: 10, fontSize: SIZES.md, fontWeight: '700', color: COLORS.secondary },
});
