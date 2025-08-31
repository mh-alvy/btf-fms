import { logActivity } from './supabase.js';
import { supabase } from './supabase.js';

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.maxLoginAttempts = parseInt(import.meta.env.VITE_MAX_LOGIN_ATTEMPTS) || 5;
        this.init();
    }

    async init() {
        // Check for existing session
        this.currentUser = this.getCurrentUser();
        
        // Ensure default users exist
        await this.ensureDefaultUsers();
    }

    async ensureDefaultUsers() {
        try {
            // Check if any users exist
            const { data: existingUsers, error } = await supabase
                .from('users')
                .select('id')
                .limit(1);

            if (error) {
                console.error('Error checking existing users:', error);
                return;
            }

            // If no users exist, create default ones
            if (!existingUsers || existingUsers.length === 0) {
                await this.createDefaultUsers();
            }
        } catch (error) {
            console.error('Error ensuring default users:', error);
        }
    }

    async createDefaultUsers() {
        const defaultUsers = [
            {
                username: 'admin',
                password_hash: 'admin123', // In production, use proper hashing
                role: 'admin',
                is_active: true
            },
            {
                username: 'manager',
                password_hash: 'manager123',
                role: 'manager',
                is_active: true
            },
            {
                username: 'developer',
                password_hash: 'dev123',
                role: 'developer',
                is_active: true
            }
        ];

        try {
            const { error } = await supabase
                .from('users')
                .upsert(defaultUsers, { 
                    onConflict: 'username',
                    ignoreDuplicates: true 
                });
            
            if (error) {
                console.error('Error creating default users:', error);
            }
            console.log('Default users created successfully');
        } catch (error) {
            console.error('Error creating default users:', error);
        }
    }

    async login(username, password) {
        try {
            // First, get the user by username
            const { data: users, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('username', username)
                .eq('is_active', true)
                .maybeSingle();

            if (userError) {
                console.error('Database error:', userError);
                return { success: false, error: 'Database connection error' };
            }

            if (!users) {
                return { success: false, error: 'Invalid username or password' };
            }

            const userData = users;

            // Check if account is locked
            if (userData.locked_until && new Date(userData.locked_until) > new Date()) {
                const lockTime = new Date(userData.locked_until).toLocaleTimeString();
                return { 
                    success: false, 
                    error: `Account locked until ${lockTime}. Too many failed attempts.` 
                };
            }

            // Verify password (in production, use proper password hashing)
            const isValidPassword = password === userData.password_hash;
            
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

            // Create a custom session
            const session = {
                user: {
                    id: userData.id,
                    username: userData.username,
                    role: userData.role
                },
                expires_at: Date.now() + (parseInt(import.meta.env.VITE_SESSION_TIMEOUT) || 3600000)
            };

            localStorage.setItem('btf_session', JSON.stringify(session));
            this.currentUser = session.user;
            
            await logActivity('user_login', `User ${username} logged in`);
            
            return { success: true, user: session.user };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'An error occurred during login' };
        }
    }

    async handleFailedLogin(userId) {
        const maxAttempts = parseInt(import.meta.env.VITE_MAX_LOGIN_ATTEMPTS) || 5;
        
        const { data: user } = await supabase
            .from('users')
            .select('login_attempts')
            .eq('id', userId)
            .maybeSingle();

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
    }

    async logout() {
        try {
            if (this.currentUser) {
                await logActivity('user_logout', `User ${this.currentUser.username} logged out`);
            }
            
            localStorage.removeItem('btf_session');
            this.currentUser = null;
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: 'An error occurred during logout' };
        }
    }

    getCurrentUser() {
        if (!this.currentUser) {
            try {
                const session = localStorage.getItem('btf_session');
                if (!session) return null;

                const parsedSession = JSON.parse(session);
                
                // Check if session is expired
                if (Date.now() > parsedSession.expires_at) {
                    localStorage.removeItem('btf_session');
                    return null;
                }

                this.currentUser = parsedSession.user;
            } catch (error) {
                localStorage.removeItem('btf_session');
                return null;
            }
        }
        return this.currentUser;
    }

    isAuthenticated() {
        return this.getCurrentUser() !== null;
    }

    hasPermission(requiredRoles) {
        const user = this.getCurrentUser();
        if (!user) return false;
        if (!requiredRoles || requiredRoles.length === 0) return true;
        return requiredRoles.includes(user.role);
    }

    async addUser(username, password, role) {
        try {
            // Check if current user has permission
            if (!this.hasPermission(['developer'])) {
                return { success: false, message: 'Insufficient permissions' };
            }

            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('username', username)
                .maybeSingle();

            if (existingUser) {
                return { success: false, message: 'Username already exists' };
            }

            const { data: newUser, error } = await supabase
                .from('users')
                .insert({
                    username,
                    password_hash: password, // In production, hash this
                    role,
                    is_active: true
                })
                .select()
                .single();

            if (error) throw error;

            await logActivity('user_created', `New user ${username} created with role ${role}`);
            return { success: true, user: newUser };
        } catch (error) {
            console.error('Add user error:', error);
            return { success: false, message: 'Failed to create user' };
        }
    }

    async updateUser(id, updates) {
        try {
            if (!this.hasPermission(['developer'])) {
                return { success: false, message: 'Insufficient permissions' };
            }

            // Check if username already exists (for other users)
            if (updates.username) {
                const { data: existingUser } = await supabase
                    .from('users')
                    .select('id')
                    .eq('username', updates.username)
                    .neq('id', id)
                    .maybeSingle();

                if (existingUser) {
                    return { success: false, message: 'Username already exists' };
                }
            }

            // Hash password if provided
            if (updates.password) {
                updates.password_hash = updates.password; // In production, hash this
                delete updates.password;
            }

            const { data: updatedUser, error } = await supabase
                .from('users')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            await logActivity('user_updated', `User ${updatedUser.username} updated`);
            return { success: true, user: updatedUser };
        } catch (error) {
            console.error('Update user error:', error);
            return { success: false, message: 'Failed to update user' };
        }
    }

    async deleteUser(id) {
        try {
            if (!this.hasPermission(['developer'])) {
                return { success: false, message: 'Insufficient permissions' };
            }

            // Get user info before deletion
            const { data: user } = await supabase
                .from('users')
                .select('username, role')
                .eq('id', id)
                .maybeSingle();

            if (!user) {
                return { success: false, message: 'User not found' };
            }

            // Prevent deleting the last developer
            if (user.role === 'developer') {
                const { data: developers } = await supabase
                    .from('users')
                    .select('id')
                    .eq('role', 'developer');

                if (developers && developers.length <= 1) {
                    return { success: false, message: 'Cannot delete the last developer account' };
                }
            }

            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', id);

            if (error) throw error;

            await logActivity('user_deleted', `User ${user.username} deleted`);
            return { success: true };
        } catch (error) {
            console.error('Delete user error:', error);
            return { success: false, message: 'Failed to delete user' };
        }
    }

    async getAllUsers() {
        try {
            const { data: users, error } = await supabase
                .from('users')
                .select('id, username, role, created_at, last_login, is_active')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return users || [];
        } catch (error) {
            console.error('Get users error:', error);
            return [];
        }
    }
}

export default AuthManager;