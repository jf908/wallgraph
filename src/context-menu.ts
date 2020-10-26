import { writable } from 'svelte/store';

export type MenuItem = {
  name: string;
  shortcut?: string;
  callback?: (data: any) => void;
};

export const contextMenu = writable<{
  menu: MenuItem[][];
  x: number;
  y: number;
} | null>(null);
