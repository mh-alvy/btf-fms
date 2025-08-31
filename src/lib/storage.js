import { db, logActivity } from './supabase.js';

class StorageManager {
    constructor() {
        this.init();
    }

    init() {
        // Storage manager is ready
    }

    generateStudentId() {
        const year = new Date().getFullYear().toString().substr(-2);
        const timestamp = Date.now().toString().substr(-6);
        return `BTF${year}${timestamp}`;
    }

    generateInvoiceNumber() {
        const year = new Date().getFullYear();
        const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
        const timestamp = Date.now().toString().substr(-6);
        return `INV${year}${month}${timestamp}`;
    }

    // Batch operations
    async addBatch(batchData) {
        try {
            const batch = await db.create('batches', batchData);
            await logActivity('batch_created', `Batch "${batch.name}" created`);
            return batch;
        } catch (error) {
            console.error('Error adding batch:', error);
            throw error;
        }
    }

    async getBatches() {
        return await db.read('batches');
    }

    async getBatchById(id) {
        return await db.getById('batches', id);
    }

    async updateBatch(id, updates) {
        try {
            const batch = await db.update('batches', id, updates);
            await logActivity('batch_updated', `Batch "${batch.name}" updated`);
            return batch;
        } catch (error) {
            console.error('Error updating batch:', error);
            throw error;
        }
    }

    async deleteBatch(id) {
        try {
            const batch = await this.getBatchById(id);
            if (!batch) return { success: false, message: 'Batch not found' };

            // Check if batch has courses
            const courses = await db.read('courses', { batch_id: id });
            if (courses.length > 0) {
                return { success: false, message: 'Cannot delete batch with existing courses' };
            }

            await db.delete('batches', id);
            await logActivity('batch_deleted', `Batch "${batch.name}" deleted`);
            return { success: true };
        } catch (error) {
            console.error('Error deleting batch:', error);
            return { success: false, message: 'Failed to delete batch' };
        }
    }

    // Course operations
    async addCourse(courseData) {
        try {
            const course = await db.create('courses', courseData);
            await logActivity('course_created', `Course "${course.name}" created`);
            return course;
        } catch (error) {
            console.error('Error adding course:', error);
            throw error;
        }
    }

    async getCourses() {
        return await db.read('courses');
    }

    async getCourseById(id) {
        return await db.getById('courses', id);
    }

    async getCoursesByBatch(batchId) {
        return await db.read('courses', { batch_id: batchId });
    }

    async updateCourse(id, updates) {
        try {
            const course = await db.update('courses', id, updates);
            await logActivity('course_updated', `Course "${course.name}" updated`);
            return course;
        } catch (error) {
            console.error('Error updating course:', error);
            throw error;
        }
    }

    async deleteCourse(id) {
        try {
            const course = await this.getCourseById(id);
            if (!course) return { success: false, message: 'Course not found' };

            // Check if course has months
            const months = await db.read('months', { course_id: id });
            if (months.length > 0) {
                return { success: false, message: 'Cannot delete course with existing months' };
            }

            await db.delete('courses', id);
            await logActivity('course_deleted', `Course "${course.name}" deleted`);
            return { success: true };
        } catch (error) {
            console.error('Error deleting course:', error);
            return { success: false, message: 'Failed to delete course' };
        }
    }

    // Month operations
    async addMonth(monthData) {
        try {
            const month = await db.create('months', {
                name: monthData.name,
                month_number: monthData.monthNumber,
                course_id: monthData.courseId,
                payment_amount: monthData.payment
            });
            await logActivity('month_created', `Month "${month.name}" created`);
            return month;
        } catch (error) {
            console.error('Error adding month:', error);
            throw error;
        }
    }

    async getMonths() {
        return await db.read('months');
    }

    async getMonthById(id) {
        return await db.getById('months', id);
    }

    async getMonthsByCourse(courseId) {
        return await db.read('months', { course_id: courseId });
    }

    async updateMonth(id, updates) {
        try {
            const dbUpdates = {};
            if (updates.name) dbUpdates.name = updates.name;
            if (updates.monthNumber) dbUpdates.month_number = updates.monthNumber;
            if (updates.payment) dbUpdates.payment_amount = updates.payment;

            const month = await db.update('months', id, dbUpdates);
            await logActivity('month_updated', `Month "${month.name}" updated`);
            return month;
        } catch (error) {
            console.error('Error updating month:', error);
            throw error;
        }
    }

    async deleteMonth(id) {
        try {
            const month = await this.getMonthById(id);
            if (!month) return { success: false, message: 'Month not found' };

            await db.delete('months', id);
            await logActivity('month_deleted', `Month "${month.name}" deleted`);
            return { success: true };
        } catch (error) {
            console.error('Error deleting month:', error);
            return { success: false, message: 'Failed to delete month' };
        }
    }

    // Institution operations
    async addInstitution(institutionData) {
        try {
            const institution = await db.create('institutions', institutionData);
            await logActivity('institution_created', `Institution "${institution.name}" created`);
            return institution;
        } catch (error) {
            console.error('Error adding institution:', error);
            throw error;
        }
    }

    async getInstitutions() {
        return await db.read('institutions');
    }

    async getInstitutionById(id) {
        return await db.getById('institutions', id);
    }

    async updateInstitution(id, updates) {
        try {
            const institution = await db.update('institutions', id, updates);
            await logActivity('institution_updated', `Institution "${institution.name}" updated`);
            return institution;
        } catch (error) {
            console.error('Error updating institution:', error);
            throw error;
        }
    }

    async deleteInstitution(id) {
        try {
            const institution = await this.getInstitutionById(id);
            if (!institution) return { success: false, message: 'Institution not found' };

            // Check if institution has students
            const students = await db.read('students', { institution_id: id });
            if (students.length > 0) {
                return { success: false, message: 'Cannot delete institution with existing students' };
            }

            await db.delete('institutions', id);
            await logActivity('institution_deleted', `Institution "${institution.name}" deleted`);
            return { success: true };
        } catch (error) {
            console.error('Error deleting institution:', error);
            return { success: false, message: 'Failed to delete institution' };
        }
    }

    // Student operations
    async addStudent(studentData) {
        try {
            const student = await db.create('students', {
                student_id: this.generateStudentId(),
                name: studentData.name,
                gender: studentData.gender,
                phone: studentData.phone,
                guardian_name: studentData.guardianName,
                guardian_phone: studentData.guardianPhone,
                institution_id: studentData.institutionId,
                batch_id: studentData.batchId
            });

            // Add enrollments
            if (studentData.enrolledCourses && studentData.enrolledCourses.length > 0) {
                for (const enrollment of studentData.enrolledCourses) {
                    await db.create('student_enrollments', {
                        student_id: student.id,
                        course_id: enrollment.courseId,
                        starting_month_id: enrollment.startingMonthId,
                        ending_month_id: enrollment.endingMonthId || null
                    });
                }
            }

            await logActivity('student_added', `Student "${student.name}" added with ID ${student.student_id}`);
            return student;
        } catch (error) {
            console.error('Error adding student:', error);
            throw error;
        }
    }

    async getStudents() {
        return await db.read('students');
    }

    async getStudentById(id) {
        return await db.getStudentWithDetails(id);
    }

    async getStudentByStudentId(studentId) {
        try {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('student_id', studentId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data;
        } catch (error) {
            console.error('Error getting student by student ID:', error);
            return null;
        }
    }

    async updateStudent(id, updates) {
        try {
            const dbUpdates = {
                name: updates.name,
                gender: updates.gender,
                phone: updates.phone,
                guardian_name: updates.guardianName,
                guardian_phone: updates.guardianPhone,
                institution_id: updates.institutionId,
                batch_id: updates.batchId
            };

            const student = await db.update('students', id, dbUpdates);

            // Update enrollments
            if (updates.enrolledCourses) {
                // Delete existing enrollments
                await supabase
                    .from('student_enrollments')
                    .delete()
                    .eq('student_id', id);

                // Add new enrollments
                for (const enrollment of updates.enrolledCourses) {
                    await db.create('student_enrollments', {
                        student_id: id,
                        course_id: enrollment.courseId,
                        starting_month_id: enrollment.startingMonthId,
                        ending_month_id: enrollment.endingMonthId || null
                    });
                }
            }

            await logActivity('student_updated', `Student "${student.name}" updated`);
            return student;
        } catch (error) {
            console.error('Error updating student:', error);
            throw error;
        }
    }

    async deleteStudent(id) {
        try {
            const student = await this.getStudentById(id);
            if (!student) return { success: false, message: 'Student not found' };

            await db.delete('students', id);
            await logActivity('student_deleted', `Student "${student.name}" deleted`);
            return { success: true };
        } catch (error) {
            console.error('Error deleting student:', error);
            return { success: false, message: 'Failed to delete student' };
        }
    }

    // Payment operations
    async addPayment(paymentData) {
        try {
            const payment = await db.create('payments', {
                invoice_number: this.generateInvoiceNumber(),
                student_id: paymentData.studentId,
                total_amount: paymentData.totalAmount,
                discount_amount: paymentData.discountAmount || 0,
                discount_type: paymentData.discountType,
                discounted_amount: paymentData.discountedAmount,
                paid_amount: paymentData.paidAmount,
                due_amount: paymentData.dueAmount,
                reference: paymentData.reference,
                received_by: paymentData.receivedBy
            });

            // Add payment month details
            if (paymentData.monthPayments && paymentData.monthPayments.length > 0) {
                for (const monthPayment of paymentData.monthPayments) {
                    await db.create('payment_months', {
                        payment_id: payment.id,
                        month_id: monthPayment.monthId,
                        month_fee: monthPayment.monthFee,
                        paid_amount: monthPayment.paidAmount,
                        discount_amount: monthPayment.discountAmount || 0,
                        previously_paid: monthPayment.previouslyPaid || 0
                    });
                }
            }

            await logActivity('payment_received', `Payment of ৳${payment.paid_amount} received from student`);
            return payment;
        } catch (error) {
            console.error('Error adding payment:', error);
            throw error;
        }
    }

    async getPayments() {
        return await db.read('payments');
    }

    async getPaymentsByStudent(studentId) {
        return await db.read('payments', { student_id: studentId });
    }

    async getDiscountedPayments() {
        try {
            const { data, error } = await supabase
                .from('payments')
                .select('*')
                .gt('discount_amount', 0)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting discounted payments:', error);
            return [];
        }
    }

    async getMonthPaymentDetails(studentId) {
        return await db.getMonthPaymentDetails(studentId);
    }

    // Reference and received by options
    async getReferenceOptions() {
        return await db.read('reference_options');
    }

    async addReferenceOption(name) {
        try {
            const option = await db.create('reference_options', { name });
            await logActivity('reference_created', `Reference option "${name}" created`);
            return option;
        } catch (error) {
            console.error('Error adding reference option:', error);
            throw error;
        }
    }

    async getReceivedByOptions() {
        return await db.read('received_by_options');
    }

    async addReceivedByOption(name) {
        try {
            const option = await db.create('received_by_options', { name });
            await logActivity('received_by_created', `Received by option "${name}" created`);
            return option;
        } catch (error) {
            console.error('Error adding received by option:', error);
            throw error;
        }
    }

    // Activities
    async getActivities() {
        return await db.read('activities');
    }

    // Legacy compatibility methods (for existing frontend code)
    async addActivity(type, description, data = {}) {
        await logActivity(type, description, data);
    }
}

export default StorageManager;