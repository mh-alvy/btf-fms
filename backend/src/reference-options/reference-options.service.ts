import { Injectable } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class ReferenceOptionsService {
  constructor(private supabaseService: SupabaseService) {}

  async create(createReferenceOptionDto: any) {
    const { data, error } = await this.supabaseService.getClient()
      .from('reference_options')
      .insert(createReferenceOptionDto)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async findAll() {
    const { data, error } = await this.supabaseService.getClient()
      .from('reference_options')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  async remove(id: string) {
    const { error } = await this.supabaseService.getClient()
      .from('reference_options')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { message: 'Reference option deleted successfully' }
  }
}