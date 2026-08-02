import { describe, test, expect, beforeAll, beforeEach } from 'vitest';

// Create localStorage mock in Node.js environment
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

global.localStorage = localStorageMock;

// Import store after setting up localStorage mock
const { useAuthStore } = await import('../../client/src/store/auth.js');

describe('Zustand Authentication Store - Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().logout();
  });

  test('Starts with empty session', () => {
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });

  test('setSession stores user info in localStorage and state', () => {
    const mockUser = { id: 'rani_worker_static_id_2026', name: 'Rani Devi', role: 'worker' };
    const mockToken = 'mock_jwt_token_signature';

    useAuthStore.getState().setSession(mockToken, mockUser);

    const state = useAuthStore.getState();
    expect(state.token).toBe(mockToken);
    expect(state.user).toEqual(mockUser);

    expect(localStorage.getItem('token')).toBe(mockToken);
    expect(JSON.parse(localStorage.getItem('user'))).toEqual(mockUser);
  });

  test('logout removes user info from localStorage and state', () => {
    const mockUser = { id: 'sharma_supervisor_static_id_2026', name: 'Dr. Sharma', role: 'supervisor' };
    const mockToken = 'mock_jwt_token_signature';

    useAuthStore.getState().setSession(mockToken, mockUser);
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});
