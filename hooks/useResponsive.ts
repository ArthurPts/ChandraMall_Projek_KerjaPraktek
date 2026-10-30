import { useWindowDimensions } from "react-native";
import { Breakpoints } from "../constants/Colors";

export type ResponsiveInfo = {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
  columns: number;
  containerMaxWidth: number;
  horizontalPadding: number;
};

export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();

  const isMobile = width < Breakpoints.tablet;
  const isTablet = width >= Breakpoints.tablet && width < Breakpoints.desktop;
  const isDesktop = width >= Breakpoints.desktop;
  const isWide = width >= Breakpoints.wide;

  let columns = 2;
  if (width >= Breakpoints.ultra) {
    columns = 5;
  } else if (width >= Breakpoints.wide) {
    columns = 4;
  } else if (width >= Breakpoints.desktop) {
    columns = 4;
  } else if (width >= Breakpoints.tablet) {
    columns = 3;
  } else {
    columns = 2;
  }

  const containerMaxWidth = 1240;
  const horizontalPadding = isMobile ? 16 : isTablet ? 24 : 32;

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    columns,
    containerMaxWidth,
    horizontalPadding,
  };
}

export default useResponsive;
