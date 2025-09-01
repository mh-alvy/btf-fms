import { Injectable } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class InstitutionsService {
  constructor(private supabaseService: SupabaseService) {}

  async create(createInstitutionDto: any) {
    const { data, error } = await this.supabaseService.getClient()
      .from('institutions')
      .insert(createInstitutionDto)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async findAll() {
    const { data, error } = await this.supabaseService.getClient()
      .from('institutions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  async findOne(id: string) {
    const { data, error } = await this.supabaseService.getClient()
      .from('institutions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async update(id: string, updateInstitutionDto: any) {
    const { data, error } = await this.supabaseService.getClient()
      .from('institutions')
      .update(updateInstitutionDto)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async remove(id: string) {
    const { error } = await this.supabaseService.getClient()
      .from('institutions')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { message: 'Institution deleted successfully' }
  }
}