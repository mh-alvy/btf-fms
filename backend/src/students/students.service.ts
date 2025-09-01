import { Injectable } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class StudentsService {
  constructor(private supabaseService: SupabaseService) {}

  private generateStudentId(): string {
    const year = new Date().getFullYear().toString().substr(-2)
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
    return `BTF${year}${random}`
  }

  async create(createStudentDto: any) {
    const studentId = this.generateStudentId()
    
    const { data, error } = await this.supabaseService.getClient()
      .from('students')
      .insert({
        ...createStudentDto,
        student_id: studentId,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async findAll() {
    const { data, error } = await this.supabaseService.getClient()
      .from('students')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  async findOne(id: string) {
    const { data, error } = await this.supabaseService.getClient()
      .from('students')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async findByStudentId(studentId: string) {
    const { data, error } = await this.supabaseService.getClient()
      .from('students')
      .select('*')
      .eq('student_id', studentId)
      .single()

    if (error) throw error
    return data
  }

  async update(id: string, updateStudentDto: any) {
    const { data, error } = await this.supabaseService.getClient()
      .from('students')
      .update(updateStudentDto)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async remove(id: string) {
    const { error } = await this.supabaseService.getClient()
      .from('students')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { message: 'Student deleted successfully' }
  }
}