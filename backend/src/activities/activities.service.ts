import { Injectable } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class ActivitiesService {
  constructor(private supabaseService: SupabaseService) {}

  async create(createActivityDto: any) {
    const { data, error } = await this.supabaseService.getClient()
      .from('activities')
      .insert(createActivityDto)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async findAll() {
    const { data, error } = await this.supabaseService.getClient()
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error
    return data
  }
}