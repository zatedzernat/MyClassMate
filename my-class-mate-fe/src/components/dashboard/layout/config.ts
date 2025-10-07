import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';

export const navItems = [
  // { key: 'users', title: 'ข้อมูลผู้ใช้งาน', href: paths.dashboard.user, icon: 'users' },
  { key: 'course', title: 'ข้อมูลรายวิชา', href: paths.dashboard.course, icon: 'course' },
  { key: 'participation', title: 'การมีส่วนร่วม', href: paths.dashboard.participation, icon: 'calendarStarIcon' },
] satisfies NavItemConfig[];

export const navItemsForAdmin = [
  // { key: 'overview', title: 'Overview', href: paths.dashboard.overview, icon: 'chart-pie' },
  // { key: 'customers', title: 'Customers', href: paths.dashboard.customers, icon: 'users' },
  // { key: 'settings', title: 'Settings', href: paths.dashboard.settings, icon: 'gear-six' },
  // { key: 'account', title: 'Account', href: paths.dashboard.account, icon: 'user' },
  // { key: 'error', title: 'Error', href: paths.errors.notFound, icon: 'x-square' },
  { key: 'users', title: 'ข้อมูลผู้ใช้งาน', href: paths.dashboard.user, icon: 'users' },
  { key: 'course', title: 'ข้อมูลรายวิชา', href: paths.dashboard.course, icon: 'course' },
  { key: 'today-course', title: 'เช็คชื่อเข้าเรียน', href: paths.dashboard.todayCourses, icon: 'todayCourse' },
  { key: 'participation', title: 'การมีส่วนร่วม', href: paths.dashboard.participation, icon: 'calendarStarIcon' },
] satisfies NavItemConfig[];

export const navItemsForStudent = [
  { key: 'student', title: 'รายละเอียดนักศึกษา', href: paths.dashboard.student, icon: 'users' },
  { key: 'participation', title: 'การมีส่วนร่วม', href: paths.dashboard.participation, icon: 'calendarStarIcon' },
] satisfies NavItemConfig[];
