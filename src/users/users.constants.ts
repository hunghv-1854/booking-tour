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

export const UPDATE_PROFILE_BODY_SCHEMA = {
  type: 'object',
  properties: {
    fullName: { type: 'string', example: 'Nguyễn Văn An' },
    phone: { type: 'string', example: '0901234567' },
    avatar: { type: 'string', format: 'binary' },
  },
};

export const OAUTH_ACCOUNT_USER_SELECT = {
  id: true,
  user: AUTH_USER_SELECT,
} as const;
