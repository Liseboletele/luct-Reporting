import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from './config';

const now = () => new Date().toISOString();
const ok = (data, extra = {}) => ({ data: { success: true, data, ...extra } });
const fail = (message, code = 500) => {
  const error = new Error(message);
  error.response = { status: code, data: { success: false, message } };
  return error;
};

const getCurrentProfile = async () => {
  const current = auth.currentUser;
  if (!current) throw fail('You must be logged in', 401);
  const snap = await getDoc(doc(db, 'users', current.uid));
  if (!snap.exists()) throw fail('User profile not found', 404);
  return { uid: current.uid, ...snap.data() };
};

const listCollection = async (name) => {
  const snap = await getDocs(collection(db, name));
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
};

const sortByCreated = (items) =>
  [...items].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

const filterByText = (items, search, fields) => {
  if (!search?.trim()) return items;
  const term = search.toLowerCase();
  return items.filter((item) => fields.some((field) => item[field]?.toString().toLowerCase().includes(term)));
};

export const authAPI = {
  async register(data) {
    const email = data.email.toLowerCase();
    const credential = await createUserWithEmailAndPassword(auth, email, data.password);
    await updateFirebaseProfile(credential.user, { displayName: data.fullName });

    const userData = {
      uid: credential.user.uid,
      email,
      fullName: data.fullName,
      role: data.role,
      facultyName: data.facultyName || '',
      programName: data.programName || '',
      staffId: data.staffId || '',
      studentId: data.studentId || '',
      createdAt: now(),
      updatedAt: now(),
      isActive: true,
    };

    await setDoc(doc(db, 'users', credential.user.uid), userData);
    const token = await credential.user.getIdToken();
    return ok({ user: userData, token });
  },

  async login({ email, password }) {
    const credential = await signInWithEmailAndPassword(auth, email.toLowerCase(), password);
    const snap = await getDoc(doc(db, 'users', credential.user.uid));
    if (!snap.exists()) throw fail('User profile not found', 404);
    const user = { uid: credential.user.uid, ...snap.data() };
    if (user.isActive === false) throw fail('Account deactivated. Contact administrator.', 403);
    const token = await credential.user.getIdToken();
    return ok({ user, token });
  },

  async logout() {
    await signOut(auth);
    return ok({ signedOut: true });
  },

  async getProfile() {
    const user = await getCurrentProfile();
    return ok({ user });
  },

  async updateProfile(data) {
    const user = await getCurrentProfile();
    const updates = { ...data, updatedAt: now() };
    await updateDoc(doc(db, 'users', user.uid), updates);
    if (data.fullName && auth.currentUser) {
      await updateFirebaseProfile(auth.currentUser, { displayName: data.fullName });
    }
    return ok(updates);
  },

  async changePassword({ currentPassword, newPassword }) {
    const current = auth.currentUser;
    if (!current?.email) throw fail('You must be logged in', 401);
    const credential = EmailAuthProvider.credential(current.email, currentPassword);
    await reauthenticateWithCredential(current, credential);
    await updatePassword(current, newPassword);
    return ok({ changed: true });
  },
};

export const classesAPI = {
  async create(data) {
    const user = await getCurrentProfile();
    const ref = doc(collection(db, 'classes'));
    const classData = {
      id: ref.id,
      ...data,
      programName: data.programName || '',
      totalRegisteredStudents: Number(data.totalRegisteredStudents || 0),
      assignedLecturerId: data.assignedLecturerId || user.uid,
      assignedLecturerName: data.assignedLecturerName || user.fullName,
      createdBy: user.uid,
      createdAt: now(),
      updatedAt: now(),
      isActive: true,
    };
    await setDoc(ref, classData);
    return ok(classData);
  },

  async getAll(params = {}) {
    const user = await getCurrentProfile();
    let classes = (await listCollection('classes')).filter((item) => item.isActive !== false);
    if (user.role === 'lecturer') classes = classes.filter((item) => item.assignedLecturerId === user.uid);
    if (user.role === 'principal_lecturer') classes = classes.filter((item) => item.facultyName === user.facultyName);
    if (params.courseCode) classes = classes.filter((item) => item.courseCode === params.courseCode);
    classes = filterByText(classes, params.search, ['className', 'courseName', 'courseCode']);
    classes = sortByCreated(classes);
    return ok(classes, { total: classes.length });
  },

  async getOne(id) {
    const snap = await getDoc(doc(db, 'classes', id));
    if (!snap.exists()) throw fail('Class not found', 404);
    return ok({ id: snap.id, ...snap.data() });
  },

  async update(id, data) {
    const updates = { ...data, updatedAt: now() };
    await updateDoc(doc(db, 'classes', id), updates);
    return ok({ id, ...updates });
  },

  async delete(id) {
    await updateDoc(doc(db, 'classes', id), { isActive: false, updatedAt: now() });
    return ok({ id });
  },
};

export const attendanceAPI = {
  async record(data) {
    const user = await getCurrentProfile();
    const ref = doc(collection(db, 'attendance'));
    const total = Number(data.totalRegistered || 0);
    const present = Number(data.presentStudents || 0);
    const absent = data.absentStudents === '' ? Math.max(total - present, 0) : Number(data.absentStudents || 0);
    const record = {
      id: ref.id,
      ...data,
      lecturerId: user.uid,
      lecturerName: user.fullName,
      presentStudents: present,
      absentStudents: absent,
      totalRegistered: total,
      attendancePercentage: total ? ((present / total) * 100).toFixed(1) : '0.0',
      notes: data.notes || '',
      createdAt: now(),
      updatedAt: now(),
    };
    await setDoc(ref, record);
    return ok(record);
  },

  async getAll(params = {}) {
    const user = await getCurrentProfile();
    let records = await listCollection('attendance');
    if (user.role === 'lecturer' || user.role === 'student') {
      records = records.filter((item) => item.lecturerId === user.uid);
    }
    if (params.classId) records = records.filter((item) => item.classId === params.classId);
    records = filterByText(records, params.search, ['classId', 'className', 'lecturerName', 'date']);
    records = sortByCreated(records);
    return ok(records, { total: records.length });
  },
};

export const reportsAPI = {
  async create(data) {
    const user = await getCurrentProfile();
    const ref = doc(collection(db, 'reports'));
    const report = {
      id: ref.id,
      ...data,
      lecturerName: user.fullName,
      lecturerId: user.uid,
      actualStudentsPresent: Number(data.actualStudentsPresent || 0),
      totalRegisteredStudents: Number(data.totalRegisteredStudents || 0),
      status: 'pending',
      feedback: '',
      feedbackBy: '',
      feedbackAt: null,
      rating: null,
      createdAt: now(),
      updatedAt: now(),
    };
    await setDoc(ref, report);
    return ok(report);
  },

  async getAll(params = {}) {
    const user = await getCurrentProfile();
    let reports = await listCollection('reports');
    if (user.role === 'lecturer') reports = reports.filter((item) => item.lecturerId === user.uid);
    if (user.role === 'principal_lecturer') reports = reports.filter((item) => item.facultyName === user.facultyName);
    if (params.week) reports = reports.filter((item) => item.weekOfReporting === params.week);
    if (params.courseCode) reports = reports.filter((item) => item.courseCode === params.courseCode);
    if (params.lecturerId && user.role !== 'lecturer') reports = reports.filter((item) => item.lecturerId === params.lecturerId);
    reports = filterByText(reports, params.search, ['courseName', 'courseCode', 'className', 'topicTaught', 'lecturerName']);
    reports = sortByCreated(reports);
    return ok(reports, { total: reports.length });
  },

  async getOne(id) {
    const user = await getCurrentProfile();
    const snap = await getDoc(doc(db, 'reports', id));
    if (!snap.exists()) throw fail('Report not found', 404);
    const report = { id: snap.id, ...snap.data() };
    if (user.role === 'lecturer' && report.lecturerId !== user.uid) throw fail('Access denied', 403);
    return ok(report);
  },

  async update(id, data) {
    const updates = { ...data, updatedAt: now() };
    await updateDoc(doc(db, 'reports', id), updates);
    return ok({ id, ...updates });
  },

  async addFeedback(id, { feedback }) {
    const user = await getCurrentProfile();
    const updates = {
      feedback,
      feedbackBy: user.fullName,
      feedbackById: user.uid,
      feedbackAt: now(),
      status: 'reviewed',
      updatedAt: now(),
    };
    await updateDoc(doc(db, 'reports', id), updates);
    return ok(updates);
  },

  async delete(id) {
    await deleteDoc(doc(db, 'reports', id));
    return ok({ id });
  },

  async export() {
    return ok([]);
  },
};

export const ratingsAPI = {
  async submit(data) {
    const user = await getCurrentProfile();
    if (Number(data.score) < 1 || Number(data.score) > 5) throw fail('Score must be between 1 and 5', 400);
    const ref = doc(collection(db, 'ratings'));
    const rating = {
      id: ref.id,
      ...data,
      score: Number(data.score),
      comment: data.comment || '',
      reportId: data.reportId || null,
      ratedBy: user.uid,
      ratedByName: user.fullName,
      ratedByRole: user.role,
      createdAt: now(),
    };
    await setDoc(ref, rating);
    if (data.reportId) {
      await updateDoc(doc(db, 'reports', data.reportId), { rating: Number(data.score), updatedAt: now() });
    }
    return ok(rating);
  },

  async getAll(params = {}) {
    let ratings = await listCollection('ratings');
    if (params.targetId) ratings = ratings.filter((item) => item.targetId === params.targetId);
    if (params.targetType) ratings = ratings.filter((item) => item.targetType === params.targetType);
    ratings = filterByText(ratings, params.search, ['ratedByName', 'comment']);
    ratings = sortByCreated(ratings);
    const averageScore = ratings.length
      ? Number((ratings.reduce((sum, item) => sum + Number(item.score || 0), 0) / ratings.length).toFixed(1))
      : 0;
    return ok(ratings, { total: ratings.length, averageScore });
  },
};

export const usersAPI = {
  async getAll(params = {}) {
    let users = await listCollection('users');
    if (params.role) users = users.filter((item) => item.role === params.role);
    users = filterByText(users, params.search, ['fullName', 'email', 'staffId', 'studentId']);
    users = sortByCreated(users);
    return ok(users, { total: users.length });
  },

  async getOne(id) {
    const snap = await getDoc(doc(db, 'users', id));
    if (!snap.exists()) throw fail('User not found', 404);
    return ok({ uid: snap.id, ...snap.data() });
  },

  async update(id, data) {
    const updates = { ...data, updatedAt: now() };
    await updateDoc(doc(db, 'users', id), updates);
    return ok(updates);
  },

  async toggleStatus(id) {
    const snap = await getDoc(doc(db, 'users', id));
    if (!snap.exists()) throw fail('User not found', 404);
    const isActive = !snap.data().isActive;
    await updateDoc(doc(db, 'users', id), { isActive, updatedAt: now() });
    return ok({ isActive });
  },

  async getDashboardStats() {
    const user = await getCurrentProfile();
    let reports = await listCollection('reports');
    let classes = (await listCollection('classes')).filter((item) => item.isActive !== false);
    const users = await listCollection('users');

    if (user.role === 'lecturer') {
      reports = reports.filter((item) => item.lecturerId === user.uid);
      classes = classes.filter((item) => item.assignedLecturerId === user.uid);
    } else if (user.role === 'principal_lecturer') {
      reports = reports.filter((item) => item.facultyName === user.facultyName);
      classes = classes.filter((item) => item.facultyName === user.facultyName);
    }

    const pendingReports = reports.filter((item) => item.status === 'pending').length;
    const reviewedReports = reports.filter((item) => item.status === 'reviewed').length;
    const averageAttendance = reports.length
      ? Number((reports.reduce((sum, item) => {
          const total = Number(item.totalRegisteredStudents || 0);
          return total ? sum + (Number(item.actualStudentsPresent || 0) / total) * 100 : sum;
        }, 0) / reports.length).toFixed(1))
      : 0;

    return ok({
      totalReports: reports.length,
      pendingReports,
      reviewedReports,
      totalClasses: classes.length,
      totalUsers: users.length,
      averageAttendance,
    });
  },
};

export default {
  authAPI,
  reportsAPI,
  classesAPI,
  attendanceAPI,
  ratingsAPI,
  usersAPI,
};
