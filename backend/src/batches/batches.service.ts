import { Injectable } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class BatchesService {
  constructor(private supabaseService: SupabaseService) {}

  async create(createBatchDto: any) {
    const { data, error } = await this.supabaseService.getClient()
      .from('batches')
      .insert(createBatchDto)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async findAll() {
    const { data, error } = await this.supabaseService.getClient()
      .from('batches')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  async findOne(id: string) {
    const { data, error } = await this.supabaseService.getClient()
      .from('batches')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async update(id: string, updateBatchDto: any) {
    const { data, error } = await this.supabaseService.getClient()
      .from('batches')
      .update(updateBatchDto)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async remove(id: string) {
    const { error } = await this.supabaseService.getClient()
      .from('batches')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { message: 'Batch deleted successfully' }
  }
}