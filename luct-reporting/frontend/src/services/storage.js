import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const memoryStore = {};

const getWebStorage = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
};

export const storage = {
  async getItem(key) {
    if (Platform.OS === 'web') {
      return getWebStorage()?.getItem(key) ?? memoryStore[key] ?? null;
    }
    return SecureStore.getItemAsync(key);
  },

  async setItem(key, value) {
    if (Platform.OS === 'web') {
      const webStorage = getWebStorage();
      if (webStorage) {
        webStorage.setItem(key, value);
      } else {
        memoryStore[key] = value;
      }
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },

  async deleteItem(key) {
    if (Platform.OS === 'web') {
      getWebStorage()?.removeItem(key);
      delete memoryStore[key];
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};
