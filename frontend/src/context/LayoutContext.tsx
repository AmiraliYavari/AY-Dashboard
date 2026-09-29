import { createContext, useContext } from 'react';

interface LayoutContextValue {
  openMenu: () => void;
}

export const LayoutContext = createContext<LayoutContextValue>({ openMenu: () => {} });
export const useLayout = () => useContext(LayoutContext);
