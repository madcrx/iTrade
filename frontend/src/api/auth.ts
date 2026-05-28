import apiClient from './client'
import type { User } from '../store/authStore'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  full_name: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const resp = await apiClient.post<AuthResponse>('/auth/login', data)
    return resp.data
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const resp = await apiClient.post<AuthResponse>('/auth/register', data)
    return resp.data
  },

  me: async (): Promise<User> => {
    const resp = await apiClient.get<User>('/auth/me')
    return resp.data
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const resp = await apiClient.patch<User>('/auth/me', data)
    return resp.data
  },

  changePassword: async (data: { current_password: string; new_password: string }) => {
    const resp = await apiClient.post('/auth/change-password', data)
    return resp.data
  },
}
