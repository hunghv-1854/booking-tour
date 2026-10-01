export const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  role: true,
  status: true,
  createdAt: true,
} as const;

export const AUTH_USER_SELECT = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  status: true,
} as const;

export const USER_CREDENTIALS_SELECT = {
  ...AUTH_USER_SELECT,
  password: true,
} as const;
