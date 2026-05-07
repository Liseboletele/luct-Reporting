import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  StyleSheet, ScrollView, Modal, Alert,
} from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

// ─── Button ───────────────────────────────────────────────────────────────────
export const Button = ({ title, onPress, variant = 'primary', loading, disabled, style, textStyle, icon }) => {
  const isOutline = variant === 'outline';
  const isDanger = variant === 'danger';
  const isSecondary = variant === 'secondary';

  const bgColor = isDanger ? COLORS.danger : isSecondary ? COLORS.secondary : isOutline ? 'transparent' : COLORS.primary;
  const borderColor = isOutline ? COLORS.primary : 'transparent';
  const txtColor = isOutline ? COLORS.primary : COLORS.white;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.btn,
        { backgroundColor: bgColor, borderColor, borderWidth: isOutline ? 1.5 : 0, opacity: disabled || loading ? 0.6 : 1 },
        style,
      ]}
      activeOpacity={0.82}
    >
      {loading ? (
        <ActivityIndicator color={txtColor} size="small" />
      ) : (
        <View style={styles.btnRow}>
          {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
          <Text style={[styles.btnText, { color: txtColor }, textStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ─── Input ────────────────────────────────────────────────────────────────────
export const Input = ({ label, error, containerStyle, rightIcon, ...props }) => (
  <View style={[styles.inputContainer, containerStyle]}>
    {label && <Text style={styles.label}>{label}</Text>}
    <View style={[styles.inputWrapper, error && styles.inputError]}>
      <TextInput
        style={styles.input}
        placeholderTextColor={COLORS.gray400}
        {...props}
      />
      {rightIcon && <View style={styles.inputRight}>{rightIcon}</View>}
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

// ─── Card ─────────────────────────────────────────────────────────────────────
export const Card = ({ children, style, onPress }) => {
  const Comp = onPress ? TouchableOpacity : View;
  return (
    <Comp style={[styles.card, style]} onPress={onPress} activeOpacity={0.88}>
      {children}
    </Comp>
  );
};

// ─── Badge ────────────────────────────────────────────────────────────────────
export const Badge = ({ label, color = COLORS.primary }) => (
  <View style={[styles.badge, { backgroundColor: color + '18', borderColor: color + '40' }]}>
    <Text style={[styles.badgeText, { color }]}>{label}</Text>
  </View>
);

// ─── Section Header ───────────────────────────────────────────────────────────
export const SectionHeader = ({ title, subtitle, action, onAction }) => (
  <View style={styles.sectionHeader}>
    <View style={{ flex: 1 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
    {action && (
      <TouchableOpacity onPress={onAction}>
        <Text style={styles.sectionAction}>{action}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─── Empty State ──────────────────────────────────────────────────────────────
export const EmptyState = ({ title, subtitle, icon = '📭' }) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyIcon}>{icon}</Text>
    <Text style={styles.emptyTitle}>{title}</Text>
    {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
  </View>
);

// ─── Loading ──────────────────────────────────────────────────────────────────
export const LoadingSpinner = ({ message = 'Loading...' }) => (
  <View style={styles.loading}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={styles.loadingText}>{message}</Text>
  </View>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────
export const StatCard = ({ label, value, icon, color = COLORS.primary, style }) => (
  <Card style={[styles.statCard, style]}>
    <View style={[styles.statIcon, { backgroundColor: color + '18' }]}>
      <Text style={{ fontSize: 22 }}>{icon}</Text>
    </View>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </Card>
);

// ─── Search Bar ───────────────────────────────────────────────────────────────
export const SearchBar = ({ value, onChangeText, placeholder = 'Search...' }) => (
  <View style={styles.searchBar}>
    <Text style={styles.searchIcon}>🔍</Text>
    <TextInput
      style={styles.searchInput}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={COLORS.gray400}
    />
    {value.length > 0 && (
      <TouchableOpacity onPress={() => onChangeText('')}>
        <Text style={{ fontSize: 18, color: COLORS.gray400 }}>✕</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─── Star Rating ──────────────────────────────────────────────────────────────
export const StarRating = ({ value = 0, onRate, editable = false, size = 24 }) => (
  <View style={{ flexDirection: 'row', gap: 4 }}>
    {[1, 2, 3, 4, 5].map((star) => (
      <TouchableOpacity key={star} onPress={() => editable && onRate?.(star)} disabled={!editable}>
        <Text style={{ fontSize: size, color: star <= value ? COLORS.secondary : COLORS.gray300 }}>★</Text>
      </TouchableOpacity>
    ))}
  </View>
);

// ─── Screen Header ────────────────────────────────────────────────────────────
export const ScreenHeader = ({ title, subtitle, onBack, action }) => (
  <View style={styles.screenHeader}>
    <View style={styles.headerLeft}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      )}
      <View>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
      </View>
    </View>
    {action}
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    ...SHADOWS.small,
  },
  btnRow: { flexDirection: 'row', alignItems: 'center' },
  btnText: { fontSize: SIZES.md, fontWeight: '700', letterSpacing: 0.3 },

  inputContainer: { marginBottom: 16 },
  label: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.gray600, marginBottom: 6, letterSpacing: 0.2 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: SIZES.radiusSm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
  },
  inputError: { borderColor: COLORS.danger },
  input: { flex: 1, fontSize: SIZES.base, color: COLORS.gray700, paddingVertical: 13, minHeight: 48 },
  inputRight: { marginLeft: 8 },
  errorText: { fontSize: SIZES.xs, color: COLORS.danger, marginTop: 4 },

  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    ...SHADOWS.small,
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: SIZES.xs, fontWeight: '700', letterSpacing: 0.3 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 4 },
  sectionTitle: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.gray800 },
  sectionSubtitle: { fontSize: SIZES.sm, color: COLORS.gray500, marginTop: 2 },
  sectionAction: { fontSize: SIZES.sm, color: COLORS.primary, fontWeight: '600' },

  emptyState: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.gray700, textAlign: 'center' },
  emptySubtitle: { fontSize: SIZES.base, color: COLORS.gray500, textAlign: 'center', marginTop: 8, lineHeight: 22 },

  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { marginTop: 12, fontSize: SIZES.base, color: COLORS.gray500 },

  statCard: { flex: 1, alignItems: 'center', minWidth: '44%' },
  statIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: SIZES.xxl, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: SIZES.sm, color: COLORS.gray500, textAlign: 'center', fontWeight: '500' },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: SIZES.radius,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 16,
    gap: 10,
  },
  searchIcon: { fontSize: 18 },
  searchInput: { flex: 1, fontSize: SIZES.base, color: COLORS.gray700 },

  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    ...SHADOWS.small,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  backBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.gray100, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20, color: COLORS.primary, fontWeight: '700' },
  headerTitle: { fontSize: SIZES.lg, fontWeight: '800', color: COLORS.gray800 },
  headerSubtitle: { fontSize: SIZES.xs, color: COLORS.gray500, marginTop: 1 },
});
