import { writable } from 'svelte/store';

export type MenuItem = {
  name: string;
  disabled?: boolean;
  shortcut?: string;
  callback?: (data: any) => void;
};

export const contextMenu = writable<{
  menu: MenuItem[][];
  arg?: any;
  x: number;
  y: number;
} | null>(null);
