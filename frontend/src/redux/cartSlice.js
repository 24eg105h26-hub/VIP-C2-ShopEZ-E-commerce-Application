import { createSlice } from '@reduxjs/toolkit';

// Generate stable random guest ID if not logged in
const getOrCreateGuestId = () => {
  let gId = localStorage.getItem('guestId');
  if (!gId) {
    gId = 'guest_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('guestId', gId);
  }
  return gId;
};

const initialState = {
  items: [],
  guestId: getOrCreateGuestId(),
  loading: false,
  error: null
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    cartStart(state) {
      state.loading = true;
      state.error = null;
    },
    cartSuccess(state, action) {
      state.loading = false;
      state.items = action.payload.items || [];
    },
    cartFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    clearCart(state) {
      state.items = [];
      state.loading = false;
      state.error = null;
    }
  }
});

export const {
  cartStart,
  cartSuccess,
  cartFailure,
  clearCart
} = cartSlice.actions;

export default cartSlice.reducer;
export { getOrCreateGuestId };
