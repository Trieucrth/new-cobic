/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#8B5CF6';
const tintColorDark = '#8B5CF6';

// Định nghĩa kiểu cho một theme color
type ColorTheme = {
  text: string;
  background: string;
  tint: string;
  icon: string;
  tabIconDefault: string;
  tabIconSelected: string;
  inputBackground: string; // Thêm thuộc tính vào type
};

// Áp dụng kiểu cho đối tượng Colors
export const Colors: { light: ColorTheme; dark: ColorTheme } = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    inputBackground: '#F5F3FF', 
  },
  dark: {
    text: '#ECEDEE',
    background: '#360265',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    inputBackground: '#360265', 

  },
};
