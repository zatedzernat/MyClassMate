import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';

export const navItems = [
  // { key: 'overview', title: 'Overview', href: paths.dashboard.overview, icon: 'chart-pie' },
  // { key: 'customers', title: 'Customers', href: paths.dashboard.customers, icon: 'users' },
  // { key: 'settings', title: 'Settings', href: paths.dashboard.settings, icon: 'gear-six' },
  // { key: 'account', title: 'Account', href: paths.dashboard.account, icon: 'user' },
  // { key: 'error', title: 'Error', href: paths.errors.notFound, icon: 'x-square' },
  { key: 'users', title: 'ข้อมูลผู้ใช้งาน', href: paths.dashboard.user, icon: 'users' },
] satisfies NavItemConfig[];

export const navItemsForStudent = [
  { key: 'registerFace', title: 'ถ่ายภาพ', href: paths.dashboard.student, icon: 'camera' },
] satisfies NavItemConfig[];
