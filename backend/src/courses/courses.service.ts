import { Injectable } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class CoursesService {
  constructor(private supabaseService: SupabaseService) {}

  async create(createCourseDto: any) {
    const { data, error } = await this.supabaseService.getClient()
      .from('courses')
      .insert(createCourseDto)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async findAll() {
    const { data, error } = await this.supabaseService.getClient()
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  async findOne(id: string) {
    const { data, error } = await this.supabaseService.getClient()
      .from('courses')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async update(id: string, updateCourseDto: any) {
    const { data, error } = await this.supabaseService.getClient()
      .from('courses')
      .update(updateCourseDto)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async remove(id: string) {
    const { error } = await this.supabaseService.getClient()
      .from('courses')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { message: 'Course deleted successfully' }
  }
}