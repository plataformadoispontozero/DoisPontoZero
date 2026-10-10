export interface AuthUser {
  id: string
  email: string
  fullName: string
  avatarUrl?: string | null
}

export interface AuthSession {
  user: AuthUser
  token?: string
  expiresAt?: number
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface ForgotPasswordData {
  email: string
}

export interface ResetPasswordData {
  password: string
  confirmPassword: string
}
