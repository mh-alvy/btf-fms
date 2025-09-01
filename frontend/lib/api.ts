const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor() {
    this.baseUrl = API_BASE_URL
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token')
    }
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(error || `HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  // Auth endpoints
  async login(username: string, password: string) {
    return this.request<{ access_token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
  }

  async getProfile() {
    return this.request<any>('/auth/profile')
  }

  // Users endpoints
  async getUsers() {
    return this.request<any[]>('/users')
  }

  async createUser(userData: any) {
    return this.request<any>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async updateUser(id: string, userData: any) {
    return this.request<any>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    })
  }

  async deleteUser(id: string) {
    return this.request<void>(`/users/${id}`, {
      method: 'DELETE',
    })
  }

  // Institutions endpoints
  async getInstitutions() {
    return this.request<any[]>('/institutions')
  }

  async createInstitution(data: any) {
    return this.request<any>('/institutions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateInstitution(id: string, data: any) {
    return this.request<any>(`/institutions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteInstitution(id: string) {
    return this.request<void>(`/institutions/${id}`, {
      method: 'DELETE',
    })
  }

  // Batches endpoints
  async getBatches() {
    return this.request<any[]>('/batches')
  }

  async createBatch(data: any) {
    return this.request<any>('/batches', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateBatch(id: string, data: any) {
    return this.request<any>(`/batches/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteBatch(id: string) {
    return this.request<void>(`/batches/${id}`, {
      method: 'DELETE',
    })
  }

  // Courses endpoints
  async getCourses() {
    return this.request<any[]>('/courses')
  }

  async createCourse(data: any) {
    return this.request<any>('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCourse(id: string, data: any) {
    return this.request<any>(`/courses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteCourse(id: string) {
    return this.request<void>(`/courses/${id}`, {
      method: 'DELETE',
    })
  }

  // Months endpoints
  async getMonths() {
    return this.request<any[]>('/months')
  }

  async createMonth(data: any) {
    return this.request<any>('/months', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateMonth(id: string, data: any) {
    return this.request<any>(`/months/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteMonth(id: string) {
    return this.request<void>(`/months/${id}`, {
      method: 'DELETE',
    })
  }

  // Students endpoints
  async getStudents() {
    return this.request<any[]>('/students')
  }

  async createStudent(data: any) {
    return this.request<any>('/students', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateStudent(id: string, data: any) {
    return this.request<any>(`/students/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteStudent(id: string) {
    return this.request<void>(`/students/${id}`, {
      method: 'DELETE',
    })
  }

  // Payments endpoints
  async getPayments() {
    return this.request<any[]>('/payments')
  }

  async createPayment(data: any) {
    return this.request<any>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Activities endpoints
  async getActivities() {
    return this.request<any[]>('/activities')
  }

  // Reference options endpoints
  async getReferenceOptions() {
    return this.request<any[]>('/reference-options')
  }

  async createReferenceOption(data: any) {
    return this.request<any>('/reference-options', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async deleteReferenceOption(id: string) {
    return this.request<void>(`/reference-options/${id}`, {
      method: 'DELETE',
    })
  }

  // Received by options endpoints
  async getReceivedByOptions() {
    return this.request<any[]>('/received-by-options')
  }

  async createReceivedByOption(data: any) {
    return this.request<any>('/received-by-options', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async deleteReceivedByOption(id: string) {
    return this.request<void>(`/received-by-options/${id}`, {
      method: 'DELETE',
    })
  }
}

export const apiClient = new ApiClient()