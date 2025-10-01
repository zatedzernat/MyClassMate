export const paths = {
  home: '/',
  auth: { signIn: '/auth/sign-in', signUp: '/auth/sign-up', resetPassword: '/auth/reset-password' },
  dashboard: {
    overview: '/dashboard',
    account: '/dashboard/account',
    customers: '/dashboard/customers',
    settings: '/dashboard/settings',
    user: '/dashboard/user',
    userDetail: '/dashboard/user/user-detail',
    student: '/dashboard/student',
    course: '/dashboard/course',
    createCourse: '/dashboard/course/create-course',
  },
  errors: { notFound: '/errors/not-found' },
} as const;
