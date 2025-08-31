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

// Auth helper functions
export const auth = {
  async signIn(username, password) {
    try {
      // First, get the user by username
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .limit(1);

      if (userError || !user || user.length === 0) {
        return { success: false, error: 'Invalid username or password' };
      }

      const userData = user[0]; // Get first user from array

      // Check if account is locked
      if (userData.locked_until && new Date(userData.locked_until) > new Date()) {
        const lockTime = new Date(userData.locked_until).toLocaleTimeString();
        return { 
          success: false, 
          error: `Account locked until ${lockTime}. Too many failed attempts.` 
        };
      }

      // Verify password (in production, use proper password hashing)
      const isValidPassword = await this.verifyPassword(password, userData.password_hash);
      
      if (!isValidPassword) {
        // Increment login attempts
        await this.handleFailedLogin(userData.id);
        return { success: false, error: 'Invalid username or password' };
      }

      // Reset login attempts and update last login
      await supabase
        .from('users')
        .update({ 
          login_attempts: 0, 
          locked_until: null,
          last_login: new Date().toISOString()
        })
        .eq('id', userData.id);

      // Create a custom session (since we're not using Supabase auth)
      const session = {
        user: {
          id: userData.id,
          username: userData.username,
          role: userData.role
        },
        expires_at: Date.now() + (parseInt(import.meta.env.VITE_SESSION_TIMEOUT) || 3600000)
      };

      localStorage.setItem('btf_session', JSON.stringify(session));
      
      return { success: true, user: session.user };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'An error occurred during sign in' };
    }
  },

  async verifyPassword(password, hash) {
    // Simple comparison for demo - in production use bcrypt or similar
    return password === hash;
  },

  async handleFailedLogin(userId) {
    const maxAttempts = parseInt(import.meta.env.VITE_MAX_LOGIN_ATTEMPTS) || 5;
    
    const { data: user } = await supabase
      .from('users')
      .select('login_attempts')
      .eq('id', userId)
      .single();

    const newAttempts = (user?.login_attempts || 0) + 1;
    const updates = { login_attempts: newAttempts };

    // Lock account if max attempts reached
    if (newAttempts >= maxAttempts) {
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + 15); // 15 minute lockout
      updates.locked_until = lockUntil.toISOString();
    }

    await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);
  },

  async signOut() {
    localStorage.removeItem('btf_session');
    return { success: true };
  },

  getCurrentUser() {
    try {
      const session = localStorage.getItem('btf_session');
      if (!session) return null;

      const parsedSession = JSON.parse(session);
      
      // Check if session is expired
      if (Date.now() > parsedSession.expires_at) {
        localStorage.removeItem('btf_session');
        return null;
      }

      return parsedSession.user;
    } catch (error) {
      localStorage.removeItem('btf_session');
      return null;
    }
  },

  isAuthenticated() {
    return this.getCurrentUser() !== null;
  },

  hasRole(roles) {
    const user = this.getCurrentUser();
    if (!user) return false;
    if (!roles || roles.length === 0) return true;
    return roles.includes(user.role);
  }
};

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