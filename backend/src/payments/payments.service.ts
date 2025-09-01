import { Injectable } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class PaymentsService {
  constructor(private supabaseService: SupabaseService) {}

  private generateInvoiceNumber(): string {
    const year = new Date().getFullYear()
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0')
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
    return `INV${year}${month}${random}`
  }

  async create(createPaymentDto: any) {
    const invoiceNumber = this.generateInvoiceNumber()
    
    const { data, error } = await this.supabaseService.getClient()
      .from('payments')
      .insert({
        ...createPaymentDto,
        invoice_number: invoiceNumber,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async findAll() {
    const { data, error } = await this.supabaseService.getClient()
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  async findOne(id: string) {
    const { data, error } = await this.supabaseService.getClient()
      .from('payments')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async findByStudent(studentId: string) {
    const { data, error } = await this.supabaseService.getClient()
      .from('payments')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }
}