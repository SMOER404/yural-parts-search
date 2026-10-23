import { configureStore } from '@reduxjs/toolkit';
import search from './searchSlice';

export const store = configureStore({ reducer: { search } });
