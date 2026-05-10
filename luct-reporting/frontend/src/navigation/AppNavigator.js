import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuth } from '../context/AuthContext';
import { COLORS, SIZES, ROLES } from '../constants/theme';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Shared Screens
import DashboardScreen from '../screens/shared/DashboardScreen';
import ReportsScreen from '../screens/shared/ReportsScreen';
import ReportDetailScreen from '../screens/shared/ReportDetailScreen';
import ClassesScreen from '../screens/shared/ClassesScreen';
import AttendanceScreen from '../screens/shared/AttendanceScreen';
import RatingsScreen from '../screens/shared/RatingsScreen';
import MonitorScreen from '../screens/shared/MonitorScreen';
import UsersScreen from '../screens/shared/UsersScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';

// Lecturer Screens
import CreateReportScreen from '../screens/lecturer/CreateReportScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const getTabConfig = (role) => {
  switch (role) {
    case 'student':
      return [
        { name: 'Dashboard', icon: '⊞', component: DashboardScreen },
        { name: 'Monitor', icon: '◉', component: MonitorScreen },
        { name: 'Attendance', icon: '✓', component: AttendanceScreen },
        { name: 'Ratings', icon: '★', component: RatingsScreen },
      ];
    case 'lecturer':
      return [
        { name: 'Dashboard', icon: '⊞', component: DashboardScreen },
        { name: 'Reports', icon: '▤', component: ReportsScreen },
        { name: 'Classes', icon: '▦', component: ClassesScreen },
        { name: 'Attendance', icon: '✓', component: AttendanceScreen },
      ];
    case 'principal_lecturer':
      return [
        { name: 'Dashboard', icon: '⊞', component: DashboardScreen },
        { name: 'Reports', icon: '▤', component: ReportsScreen },
        { name: 'Classes', icon: '▦', component: ClassesScreen },
        { name: 'Monitor', icon: '◉', component: MonitorScreen },
      ];
    case 'program_leader':
      return [
        { name: 'Dashboard', icon: '⊞', component: DashboardScreen },
        { name: 'Reports', icon: '▤', component: ReportsScreen },
        { name: 'Classes', icon: '▦', component: ClassesScreen },
        { name: 'Users', icon: '◎', component: UsersScreen },
      ];
    default:
      return [
        { name: 'Dashboard', icon: '⊞', component: DashboardScreen },
        { name: 'Reports', icon: '▤', component: ReportsScreen },
        { name: 'Classes', icon: '▦', component: ClassesScreen },
        { name: 'Attendance', icon: '✓', component: AttendanceScreen },
      ];
  }
};

// Custom Tab Bar — no emojis
const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };
        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
            activeOpacity={0.8}
          >
            <View style={[styles.tabIconWrap, isFocused && styles.tabIconWrapActive]}>
              <Text style={[styles.tabIcon, isFocused && styles.tabIconActive]}>
                {options.tabBarIcon?.()}
              </Text>
            </View>
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
              {route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

function MainTabs({ role }) {
  const tabs = getTabConfig(role);
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {tabs.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{ tabBarIcon: () => tab.icon }}
        />
      ))}
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function AppStack({ role }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main">
        {() => <MainTabs role={role} />}
      </Stack.Screen>
      <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
      <Stack.Screen name="CreateReport" component={CreateReportScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Monitor" component={MonitorScreen} />
      <Stack.Screen name="Ratings" component={RatingsScreen} />
      <Stack.Screen name="Users" component={UsersScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen name="Classes" component={ClassesScreen} />
      <Stack.Screen name="Attendance" component={AttendanceScreen} />
    </Stack.Navigator>
  );
}

// Splash / Loading screen
function SplashScreen() {
  return (
    <View style={styles.splash}>
      <View style={styles.splashLogo}>
        <Text style={styles.splashL}>L</Text>
      </View>
      <Text style={styles.splashTitle}>LUCT Reporting</Text>
      <ActivityIndicator color="#fff" style={{ marginTop: 24 }} />
    </View>
  );
}

export default function AppNavigator() {
  const { isLoading, isAuthenticated, user } = useAuth();

  // Show splash while Firebase restores session
  if (isLoading) return <SplashScreen />;

  return (
    <NavigationContainer>
      {isAuthenticated && user
        ? <AppStack role={user?.role} />
        : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 12,
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 4 },
  tabIconWrap: {
    width: 42, height: 30, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  tabIconWrapActive: { backgroundColor: COLORS.primary + '14' },
  tabIcon: { fontSize: 18, color: COLORS.gray400 },
  tabIconActive: { color: COLORS.primary },
  tabLabel: { fontSize: 10, color: COLORS.gray400, fontWeight: '500' },
  tabLabelActive: { color: COLORS.primary, fontWeight: '700' },

  splash: {
    flex: 1, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  splashLogo: {
    width: 80, height: 80, borderRadius: 22,
    backgroundColor: '#C9A84C',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  splashL: { fontSize: 44, fontWeight: '900', color: COLORS.white },
  splashTitle: { fontSize: SIZES.xxl, fontWeight: '900', color: COLORS.white },
});