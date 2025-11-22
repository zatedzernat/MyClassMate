import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';

export const navItems = [
  { key: 'course', title: 'ข้อมูลรายวิชา', href: paths.dashboard.course, icon: 'course' },
  { key: 'today-course', title: 'เช็คชื่อเข้าเรียน', href: paths.dashboard.todayCourses, icon: 'todayCourse' },
  { key: 'participation', title: 'การมีส่วนร่วม', href: paths.dashboard.participation, icon: 'calendarStarIcon' },
] satisfies NavItemConfig[];

export const navItemsForAdmin = [
  { key: 'users', title: 'ข้อมูลผู้ใช้งาน', href: paths.dashboard.user, icon: 'users' },
  { key: 'course', title: 'ข้อมูลรายวิชา', href: paths.dashboard.course, icon: 'course' },
  { key: 'today-course', title: 'เช็คชื่อเข้าเรียน', href: paths.dashboard.todayCourses, icon: 'todayCourse' },
  { key: 'participation', title: 'การมีส่วนร่วม', href: paths.dashboard.participation, icon: 'calendarStarIcon' },
] satisfies NavItemConfig[];

export const navItemsForStudent = [
  { key: 'student', title: 'รายละเอียดผู้เรียน', href: paths.dashboard.student, icon: 'users' },
  { key: 'course', title: 'ข้อมูลรายวิชา', href: paths.dashboard.course, icon: 'course' },
  { key: 'participation', title: 'การมีส่วนร่วม', href: paths.dashboard.participation, icon: 'calendarStarIcon' },
] satisfies NavItemConfig[];
