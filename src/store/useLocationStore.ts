import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LocationState {
  location: { latitude: number; longitude: number } | null;
  officeLocation: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
  } | null;
  isInRange: boolean | null;
  setLocation: (location: { latitude: number; longitude: number } | null) => void;
  setOfficeLocation: (officeLocation: { id: number; name: string; latitude: number; longitude: number; radius: number } | null) => void;
  setIsInRange: (isInRange: boolean | null) => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      location: null,
      officeLocation: null,
      isInRange: null,
      setLocation: (location) => set({ location }),
      setOfficeLocation: (officeLocation) => set({ officeLocation }),
      setIsInRange: (isInRange) => set({ isInRange }),
    }),
    {
      name: 'location-storage',
    }
  )
);