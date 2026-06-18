import { createSlice } from '@reduxjs/toolkit';

const token = localStorage.getItem('accessToken') || null;
const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;

const initialState = {
  user,
  token,
  isAuthenticated: !!token,
  loading: false,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.loading = true;
      state.error = null;
    },
    loginSuccess(state, action) {
      state.loading = false;
      state.isAuthenticated = true;
      state.token = action.payload.accessToken;
      state.user = action.payload.user;
      localStorage.setItem('accessToken', action.payload.accessToken);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    loginFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    updateAccessToken(state, action) {
      state.token = action.payload;
      localStorage.setItem('accessToken', action.payload);
    },
    logoutUser(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    },
    updateUserProfile(state, action) {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    }
  }
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  updateAccessToken,
  logoutUser,
  updateUserProfile
} = authSlice.actions;

export default authSlice.reducer;
