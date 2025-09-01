import { Injectable } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class MonthsService {
  constructor(private supabaseService: SupabaseService) {}

  async create(createMonthDto: any) {
    const { data, error } = await this.supabaseService.getClient()
      .from('months')
      .insert(createMonthDto)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async findAll() {
    const { data, error } = await this.supabaseService.getClient()
      .from('months')
      .select('*')
      .order('month_number', { ascending: true })

    if (error) throw error
    return data
  }

  async findOne(id: string) {
    const { data, error } = await this.supabaseService.getClient()
      .from('months')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async update(id: string, updateMonthDto: any) {
    const { data, error } = await this.supabaseService.getClient()
      .from('months')
      .update(updateMonthDto)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async remove(id: string) {
    const { error } = await this.supabaseService.getClient()
      .from('months')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { message: 'Month deleted successfully' }
  }
}