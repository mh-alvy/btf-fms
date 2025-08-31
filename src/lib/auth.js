import { auth, logActivity } from './supabase.js';
import { supabase } from './supabase.js';

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.maxLoginAttempts = parseInt(import.meta.env.VITE_MAX_LOGIN_ATTEMPTS) || 5;
        this.init();
    }

    async init() {
        // Check for existing session
        this.currentUser = auth.getCurrentUser();
        
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
            for (const user of defaultUsers) {
                // Check if user already exists
                const { data: existingUser } = await supabase
                    .from('users')
                    .select('id')
                    .eq('username', user.username)
                    .single();

                // Skip if user already exists
                if (existingUser) {
                    console.log(`User ${user.username} already exists, skipping creation`);
                    continue;
                }

                const { error } = await supabase
                    .from('users')
                    .insert(user);
                
                if (error) {
                    console.error('Error creating default user:', error);
                }
            }
            console.log('Default users created successfully');
        } catch (error) {
            console.error('Error creating default users:', error);
        }
    }

    async login(username, password) {
        try {
            const result = await auth.signIn(username, password);
            
            if (result.success) {
                this.currentUser = result.user;
                await logActivity('user_login', `User ${username} logged in`);
            }
            
            return result;
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'An error occurred during login' };
        }
    }

    async logout() {
        try {
            if (this.currentUser) {
                await logActivity('user_logout', `User ${this.currentUser.username} logged out`);
            }
            
            const result = await auth.signOut();
            this.currentUser = null;
            return result;
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: 'An error occurred during logout' };
        }
    }

    getCurrentUser() {
        if (!this.currentUser) {
            this.currentUser = auth.getCurrentUser();
        }
        return this.currentUser;
    }

    isAuthenticated() {
        return auth.isAuthenticated();
    }

    hasPermission(requiredRoles) {
        return auth.hasRole(requiredRoles);
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
                .single();

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
                    .single();

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
                .single();

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