import { Injectable, ConflictException, NotFoundException, OnModuleInit } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import * as bcrypt from 'bcrypt'

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(private supabaseService: SupabaseService) {}

  async onModuleInit() {
    await this.createDefaultUsers()
  }

  private async createDefaultUsers() {
    const defaultUsers = [
      { username: 'admin', password: 'admin123', role: 'admin' },
      { username: 'manager', password: 'manager123', role: 'manager' },
      { username: 'developer', password: 'dev123', role: 'developer' },
    ]

    for (const userData of defaultUsers) {
      try {
        const existingUser = await this.findByUsername(userData.username)
        if (!existingUser) {
          const hashedPassword = await bcrypt.hash(userData.password, 10)
          
          const { error } = await this.supabaseService.getClient()
            .from('users')
            .insert({
              username: userData.username,
              password_hash: hashedPassword,
              role: userData.role,
              is_active: true,
            })

          if (error && error.code !== '23505') {
            console.error(`Error creating default user ${userData.username}:`, error)
          } else if (!error) {
            console.log(`Created default user: ${userData.username}`)
          }
        }
      } catch (error) {
        console.warn(`Default user ${userData.username} might already exist`)
      }
    }
  }

  async findAll() {
    const { data, error } = await this.supabaseService.getClient()
      .from('users')
      .select('id, username, role, is_active, created_at')
      .eq('is_active', true)

    if (error) throw error
    return data
  }

  async findById(id: string) {
    const { data, error } = await this.supabaseService.getClient()
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw new NotFoundException('User not found')
    return data
  }

  async findByUsername(username: string) {
    const { data, error } = await this.supabaseService.getClient()
      .from('users')
      .select('*')
      .eq('username', username)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async create(userData: any) {
    const hashedPassword = await bcrypt.hash(userData.password, 10)
    
    const { data, error } = await this.supabaseService.getClient()
      .from('users')
      .insert({
        username: userData.username,
        password_hash: hashedPassword,
        role: userData.role,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new ConflictException('Username already exists')
      }
      throw error
    }
    
    return data
  }

  async update(id: string, updateData: any) {
    const updates: any = { ...updateData }
    
    if (updateData.password) {
      updates.password_hash = await bcrypt.hash(updateData.password, 10)
      delete updates.password
    }

    const { data, error } = await this.supabaseService.getClient()
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async remove(id: string) {
    const { error } = await this.supabaseService.getClient()
      .from('users')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error
    return { message: 'User deactivated successfully' }
  }
}