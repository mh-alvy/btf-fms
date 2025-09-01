import { create } from 'zustand'
import { apiClient } from '@/lib/api'
import toast from 'react-hot-toast'

interface DataState {
  institutions: any[]
  batches: any[]
  courses: any[]
  months: any[]
  students: any[]
  payments: any[]
  activities: any[]
  referenceOptions: any[]
  receivedByOptions: any[]
  isLoading: boolean
  
  // Actions
  fetchInstitutions: () => Promise<void>
  fetchBatches: () => Promise<void>
  fetchCourses: () => Promise<void>
  fetchMonths: () => Promise<void>
  fetchStudents: () => Promise<void>
  fetchPayments: () => Promise<void>
  fetchActivities: () => Promise<void>
  fetchReferenceOptions: () => Promise<void>
  fetchReceivedByOptions: () => Promise<void>
  fetchAll: () => Promise<void>
  
  createInstitution: (data: any) => Promise<boolean>
  createBatch: (data: any) => Promise<boolean>
  createCourse: (data: any) => Promise<boolean>
  createMonth: (data: any) => Promise<boolean>
  createStudent: (data: any) => Promise<boolean>
  createPayment: (data: any) => Promise<boolean>
}

export const useDataStore = create<DataState>((set, get) => ({
  institutions: [],
  batches: [],
  courses: [],
  months: [],
  students: [],
  payments: [],
  activities: [],
  referenceOptions: [],
  receivedByOptions: [],
  isLoading: false,

  fetchInstitutions: async () => {
    try {
      const institutions = await apiClient.getInstitutions()
      set({ institutions })
    } catch (error) {
      toast.error('Failed to fetch institutions')
    }
  },

  fetchBatches: async () => {
    try {
      const batches = await apiClient.getBatches()
      set({ batches })
    } catch (error) {
      toast.error('Failed to fetch batches')
    }
  },

  fetchCourses: async () => {
    try {
      const courses = await apiClient.getCourses()
      set({ courses })
    } catch (error) {
      toast.error('Failed to fetch courses')
    }
  },

  fetchMonths: async () => {
    try {
      const months = await apiClient.getMonths()
      set({ months })
    } catch (error) {
      toast.error('Failed to fetch months')
    }
  },

  fetchStudents: async () => {
    try {
      const students = await apiClient.getStudents()
      set({ students })
    } catch (error) {
      toast.error('Failed to fetch students')
    }
  },

  fetchPayments: async () => {
    try {
      const payments = await apiClient.getPayments()
      set({ payments })
    } catch (error) {
      toast.error('Failed to fetch payments')
    }
  },

  fetchActivities: async () => {
    try {
      const activities = await apiClient.getActivities()
      set({ activities })
    } catch (error) {
      toast.error('Failed to fetch activities')
    }
  },

  fetchReferenceOptions: async () => {
    try {
      const referenceOptions = await apiClient.getReferenceOptions()
      set({ referenceOptions })
    } catch (error) {
      toast.error('Failed to fetch reference options')
    }
  },

  fetchReceivedByOptions: async () => {
    try {
      const receivedByOptions = await apiClient.getReceivedByOptions()
      set({ receivedByOptions })
    } catch (error) {
      toast.error('Failed to fetch received by options')
    }
  },

  fetchAll: async () => {
    set({ isLoading: true })
    try {
      await Promise.all([
        get().fetchInstitutions(),
        get().fetchBatches(),
        get().fetchCourses(),
        get().fetchMonths(),
        get().fetchStudents(),
        get().fetchPayments(),
        get().fetchActivities(),
        get().fetchReferenceOptions(),
        get().fetchReceivedByOptions(),
      ])
    } finally {
      set({ isLoading: false })
    }
  },

  createInstitution: async (data: any) => {
    try {
      const institution = await apiClient.createInstitution(data)
      set(state => ({ institutions: [...state.institutions, institution] }))
      toast.success('Institution created successfully')
      return true
    } catch (error) {
      toast.error('Failed to create institution')
      return false
    }
  },

  createBatch: async (data: any) => {
    try {
      const batch = await apiClient.createBatch(data)
      set(state => ({ batches: [...state.batches, batch] }))
      toast.success('Batch created successfully')
      return true
    } catch (error) {
      toast.error('Failed to create batch')
      return false
    }
  },

  createCourse: async (data: any) => {
    try {
      const course = await apiClient.createCourse(data)
      set(state => ({ courses: [...state.courses, course] }))
      toast.success('Course created successfully')
      return true
    } catch (error) {
      toast.error('Failed to create course')
      return false
    }
  },

  createMonth: async (data: any) => {
    try {
      const month = await apiClient.createMonth(data)
      set(state => ({ months: [...state.months, month] }))
      toast.success('Month created successfully')
      return true
    } catch (error) {
      toast.error('Failed to create month')
      return false
    }
  },

  createStudent: async (data: any) => {
    try {
      const student = await apiClient.createStudent(data)
      set(state => ({ students: [...state.students, student] }))
      toast.success(`Student added successfully with ID: ${student.student_id}`)
      return true
    } catch (error) {
      toast.error('Failed to create student')
      return false
    }
  },

  createPayment: async (data: any) => {
    try {
      const payment = await apiClient.createPayment(data)
      set(state => ({ payments: [...state.payments, payment] }))
      toast.success('Payment processed successfully')
      return true
    } catch (error) {
      toast.error('Failed to process payment')
      return false
    }
  },
}))