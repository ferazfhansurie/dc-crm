import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./store";

export const colorSchemes = [
  "default",
  "theme-1",
  "theme-2",
  "theme-3",
  "theme-4",
] as const;

export type ColorSchemes = (typeof colorSchemes)[number];

interface ColorSchemeState {
  value: ColorSchemes;
}

const getColorScheme = (): ColorSchemes => {
  const colorScheme = localStorage.getItem("colorScheme");
  return colorSchemes.find((scheme) => scheme === colorScheme) || "theme-4";
};

const initialState: ColorSchemeState = {
  value: getColorScheme(),
};

export const colorSchemeSlice = createSlice({
  name: "colorScheme",
  initialState,
  reducers: {
    setColorScheme: (state, action: PayloadAction<ColorSchemes>) => {
      localStorage.setItem("colorScheme", action.payload);
      state.value = action.payload;
    },
  },
});

export const { setColorScheme } = colorSchemeSlice.actions;

export const selectColorScheme = (state: RootState) => {
  return state.colorScheme.value;
};

export default colorSchemeSlice.reducer;
