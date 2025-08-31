import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});
// Database helper functions
export const db = {
  // Generic CRUD operations
  async create(table, data) {
    const user = auth.getCurrentUser();
    const dataWithUser = user ? { ...data, created_by: user.id } : data;
    
    const { data: result, error } = await supabase
      .from(table)
      .insert(dataWithUser)
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  async read(table, filters = {}) {
    let query = supabase.from(table).select('*');
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        query = query.eq(key, value);
      }
    });

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async update(table, id, data) {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  async delete(table, id) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  async getById(table, id) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Specific queries
  async getStudentWithDetails(studentId) {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        institution:institutions(*),
        batch:batches(*),
        enrollments:student_enrollments(
          *,
          course:courses(*),
          starting_month:months!starting_month_id(*),
          ending_month:months!ending_month_id(*)
        )
      `)
      .eq('id', studentId)
      .single();

    if (error) throw error;
    return data;
  },

  async getPaymentWithDetails(paymentId) {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        student:students(*),
        payment_months(
          *,
          month:months(*)
        )
      `)
      .eq('id', paymentId)
      .single();

    if (error) throw error;
    return data;
  },

  async getMonthPaymentDetails(studentId) {
    const { data, error } = await supabase
      .from('payment_months')
      .select(`
        *,
        payment:payments!inner(student_id),
        month:months(*)
      `)
      .eq('payment.student_id', studentId);

    if (error) throw error;
    
    // Group by month_id
    const monthPayments = {};
    data?.forEach(pm => {
      const monthId = pm.month_id;
      if (!monthPayments[monthId]) {
        monthPayments[monthId] = {
          totalPaid: 0,
          totalDiscount: 0,
          monthFee: pm.month_fee || 0,
          payments: []
        };
      }
      monthPayments[monthId].totalPaid += pm.paid_amount;
      monthPayments[monthId].totalDiscount += pm.discount_amount || 0;
      monthPayments[monthId].payments.push(pm);
    });

    return monthPayments;
  }
};

// Activity logging
export const logActivity = async (type, description, data = {}) => {
  try {
    const user = auth.getCurrentUser();
    await supabase
      .from('activities')
      .insert({
        type,
        description,
        data,
        user_id: user?.id
      });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};