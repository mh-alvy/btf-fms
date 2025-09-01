import { create } from 'zustand'
import { apiClient } from '@/lib/api'
import toast from 'react-hot-toast'

interface User {
  id: string
  username: string
  role: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,

  login: async (username: string, password: string) => {
    try {
      const response = await apiClient.login(username, password)
      apiClient.setToken(response.access_token)
      set({ user: response.user, isLoading: false })
      toast.success(`Welcome back, ${response.user.username}!`)
      return true
    } catch (error) {
      toast.error('Invalid credentials')
      return false
    }
  },

  logout: () => {
    apiClient.clearToken()
    set({ user: null, isLoading: false })
    toast.success('Logged out successfully')
  },

  checkAuth: async () => {
    try {
      const user = await apiClient.getProfile()
      set({ user, isLoading: false })
    } catch (error) {
      apiClient.clearToken()
      set({ user: null, isLoading: false })
    }
  },
}))