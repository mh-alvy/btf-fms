import { Injectable } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class ReceivedByOptionsService {
  constructor(private supabaseService: SupabaseService) {}

  async create(createReceivedByOptionDto: any) {
    const { data, error } = await this.supabaseService.getClient()
      .from('received_by_options')
      .insert(createReceivedByOptionDto)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async findAll() {
    const { data, error } = await this.supabaseService.getClient()
      .from('received_by_options')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  async remove(id: string) {
    const { error } = await this.supabaseService.getClient()
      .from('received_by_options')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { message: 'Received by option deleted successfully' }
  }
}