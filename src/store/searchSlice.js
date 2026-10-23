import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchBrands, fetchOffers } from '../api/favorit';

export const searchBrands = createAsyncThunk('search/brands', (number) => fetchBrands(number));

export const searchOffers = createAsyncThunk('search/offers', ({ number, brand }) => fetchOffers(number, brand));

const initialState = {
  number: '',
  brands: { items: [], status: 'idle', error: null }, // idle | loading | done | error
  selectedBrand: null,
  offers: { items: [], status: 'idle', error: null },
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    reset: () => initialState,
  },
  extraReducers: (b) => {
    b.addCase(searchBrands.pending, (s, a) => {
      s.number = a.meta.arg;
      s.brands = { items: [], status: 'loading', error: null };
      s.selectedBrand = null;
      s.offers = initialState.offers;
    })
      .addCase(searchBrands.fulfilled, (s, a) => {
        if (a.meta.arg !== s.number) return; // устаревший ответ
        s.brands = { items: a.payload, status: 'done', error: null };
      })
      .addCase(searchBrands.rejected, (s, a) => {
        if (a.meta.arg !== s.number) return;
        s.brands = { items: [], status: 'error', error: a.error.message };
      })
      .addCase(searchOffers.pending, (s, a) => {
        s.selectedBrand = a.meta.arg.brand;
        s.offers = { items: [], status: 'loading', error: null };
      })
      .addCase(searchOffers.fulfilled, (s, a) => {
        if (a.meta.arg.brand !== s.selectedBrand) return;
        s.offers = { items: a.payload, status: 'done', error: null };
      })
      .addCase(searchOffers.rejected, (s, a) => {
        if (a.meta.arg.brand !== s.selectedBrand) return;
        s.offers = { items: [], status: 'error', error: a.error.message };
      });
  },
});

export const { reset } = searchSlice.actions;
export default searchSlice.reducer;
