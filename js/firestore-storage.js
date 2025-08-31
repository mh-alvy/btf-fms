// Firestore Storage Manager
import { db } from './firebase-config.js';
import { 
    collection, 
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    getDocs, 
    getDoc,
    query, 
    where, 
    orderBy,
    onSnapshot,
    writeBatch,
    serverTimestamp
} from 'firebase/firestore';

class FirestoreStorageManager {
    constructor() {
        this.collections = {
            batches: 'batches',
            courses: 'courses',
            months: 'months',
            institutions: 'institutions',
            students: 'students',
            payments: 'payments',
            activities: 'activities',
            users: 'users'
        };
        this.cache = {};
        this.listeners = {};
        this.isOnline = navigator.onLine;
        this.init();
    }

    async init() {
        try {
            // Initialize cache with data from Firestore
            await this.loadAllData();
            console.log('Firestore initialized successfully');
        } catch (error) {
            console.error('Error initializing Firestore:', error);
            // Fallback to localStorage if Firestore fails
            this.fallbackToLocalStorage();
        }

        // Listen for online/offline status
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncLocalStorageToFirestore();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    async loadAllData() {
        const collections = Object.keys(this.collections);
        
        for (const collectionName of collections) {
            try {
                const snapshot = await getDocs(collection(db, this.collections[collectionName]));
                this.cache[collectionName] = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
                    updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
                }));
            } catch (error) {
                console.error(`Error loading ${collectionName}:`, error);
                this.cache[collectionName] = [];
            }
        }
    }

    fallbackToLocalStorage() {
        console.warn('Falling back to localStorage');
        // Initialize empty arrays if they don't exist
        const collections = ['batches', 'courses', 'months', 'institutions', 'students', 'payments', 'activities', 'users'];
        
        collections.forEach(collection => {
            const key = `btf_${collection}`;
            if (!localStorage.getItem(key)) {
                localStorage.setItem(key, JSON.stringify([]));
            }
            try {
                this.cache[collection] = JSON.parse(localStorage.getItem(key) || '[]');
            } catch (e) {
                this.cache[collection] = [];
            }
        });
    }

    async syncLocalStorageToFirestore() {
        if (!this.isOnline) return;
        
        try {
            // Sync any pending changes from localStorage to Firestore
            console.log('Syncing localStorage to Firestore...');
            await this.loadAllData();
        } catch (error) {
            console.error('Error syncing to Firestore:', error);
        }
    }

    generateId(prefix = 'item') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateStudentId() {
        const year = new Date().getFullYear().toString().substr(-2);
        const existing = this.getStudents().length;
        return `BTF${year}${(existing + 1).toString().padStart(4, '0')}`;
    }

    generateInvoiceNumber() {
        const year = new Date().getFullYear();
        const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
        const existing = this.getPayments().length;
        return `INV${year}${month}${(existing + 1).toString().padStart(4, '0')}`;
    }

    // Generic CRUD operations
    async addDocument(collectionName, data) {
        try {
            if (this.isOnline) {
                const docData = {
                    ...data,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                };

                const docRef = await addDoc(collection(db, this.collections[collectionName]), docData);
                
                // Update cache
                const newDoc = {
                    id: docRef.id,
                    ...data,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                this.cache[collectionName] = this.cache[collectionName] || [];
                this.cache[collectionName].push(newDoc);
                
                return newDoc;
            } else {
                // Offline: save to localStorage
                return this.addToLocalStorage(collectionName, data);
            }
        } catch (error) {
            console.error(`Error adding document to ${collectionName}:`, error);
            // Fallback to localStorage
            return this.addToLocalStorage(collectionName, data);
        }
    }

    async updateDocument(collectionName, id, updates) {
        try {
            if (this.isOnline) {
                const docRef = doc(db, this.collections[collectionName], id);
                const updateData = {
                    ...updates,
                    updatedAt: serverTimestamp()
                };
                
                await updateDoc(docRef, updateData);
                
                // Update cache
                const index = this.cache[collectionName].findIndex(item => item.id === id);
                if (index !== -1) {
                    this.cache[collectionName][index] = {
                        ...this.cache[collectionName][index],
                        ...updates,
                        updatedAt: new Date().toISOString()
                    };
                    return this.cache[collectionName][index];
                }
                
                return null;
            } else {
                // Offline: save to localStorage
                return this.updateInLocalStorage(collectionName, id, updates);
            }
        } catch (error) {
            console.error(`Error updating document in ${collectionName}:`, error);
            // Fallback to localStorage
            return this.updateInLocalStorage(collectionName, id, updates);
        }
    }

    async deleteDocument(collectionName, id) {
        try {
            if (this.isOnline) {
                await deleteDoc(doc(db, this.collections[collectionName], id));
                
                // Update cache
                this.cache[collectionName] = this.cache[collectionName].filter(item => item.id !== id);
                
                return { success: true };
            } else {
                // Offline: delete from localStorage
                return this.deleteFromLocalStorage(collectionName, id);
            }
        } catch (error) {
            console.error(`Error deleting document from ${collectionName}:`, error);
            // Fallback to localStorage
            return this.deleteFromLocalStorage(collectionName, id);
        }
    }

    // LocalStorage fallback methods
    addToLocalStorage(collectionName, data) {
        const key = `btf_${collectionName}`;
        const items = JSON.parse(localStorage.getItem(key) || '[]');
        const newItem = {
            id: this.generateId(collectionName.slice(0, -1)),
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        items.push(newItem);
        localStorage.setItem(key, JSON.stringify(items));
        this.cache[collectionName] = items;
        
        return newItem;
    }

    updateInLocalStorage(collectionName, id, updates) {
        const key = `btf_${collectionName}`;
        const items = JSON.parse(localStorage.getItem(key) || '[]');
        const index = items.findIndex(item => item.id === id);
        
        if (index !== -1) {
            items[index] = {
                ...items[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem(key, JSON.stringify(items));
            this.cache[collectionName] = items;
            return items[index];
        }
        
        return null;
    }

    deleteFromLocalStorage(collectionName, id) {
        const key = `btf_${collectionName}`;
        const items = JSON.parse(localStorage.getItem(key) || '[]');
        const filteredItems = items.filter(item => item.id !== id);
        
        localStorage.setItem(key, JSON.stringify(filteredItems));
        this.cache[collectionName] = filteredItems;
        
        return { success: true };
    }

    // Activity logging
    async addActivity(type, description, data = {}) {
        const activity = {
            type,
            description,
            data,
            timestamp: new Date().toISOString(),
            user: window.authManager?.getCurrentUser()?.username || 'System'
        };

        const savedActivity = await this.addDocument('activities', activity);
        
        // Keep only last 100 activities in cache
        if (this.cache.activities && this.cache.activities.length > 100) {
            this.cache.activities = this.cache.activities.slice(-100);
        }
        
        return savedActivity;
    }

    // Batch operations
    async addBatch(batchData) {
        const batch = await this.addDocument('batches', batchData);
        if (batch) {
            await this.addActivity('batch_created', `Batch "${batch.name}" created`, { batchId: batch.id });
        }
        return batch;
    }

    async updateBatch(id, updates) {
        const batch = await this.updateDocument('batches', id, updates);
        if (batch) {
            await this.addActivity('batch_updated', `Batch "${batch.name}" updated`, { batchId: id });
        }
        return batch;
    }

    async deleteBatch(id) {
        const batch = this.getBatchById(id);
        if (!batch) return { success: false, message: 'Batch not found' };

        // Check if batch has courses
        const hasCourses = this.getCourses().some(course => course.batchId === id);
        if (hasCourses) {
            return { success: false, message: 'Cannot delete batch with existing courses' };
        }

        const result = await this.deleteDocument('batches', id);
        if (result.success) {
            await this.addActivity('batch_deleted', `Batch "${batch.name}" deleted`, { batchId: id });
        }
        return result;
    }

    // Course operations
    async addCourse(courseData) {
        const course = await this.addDocument('courses', courseData);
        if (course) {
            await this.addActivity('course_created', `Course "${course.name}" created`, { courseId: course.id });
        }
        return course;
    }

    async updateCourse(id, updates) {
        const course = await this.updateDocument('courses', id, updates);
        if (course) {
            await this.addActivity('course_updated', `Course "${course.name}" updated`, { courseId: id });
        }
        return course;
    }

    async deleteCourse(id) {
        const course = this.getCourseById(id);
        if (!course) return { success: false, message: 'Course not found' };

        // Check if course has months
        const hasMonths = this.getMonths().some(month => month.courseId === id);
        if (hasMonths) {
            return { success: false, message: 'Cannot delete course with existing months' };
        }

        const result = await this.deleteDocument('courses', id);
        if (result.success) {
            await this.addActivity('course_deleted', `Course "${course.name}" deleted`, { courseId: id });
        }
        return result;
    }

    // Month operations
    async addMonth(monthData) {
        const month = await this.addDocument('months', monthData);
        if (month) {
            await this.addActivity('month_created', `Month "${month.name}" created`, { monthId: month.id });
        }
        return month;
    }

    async updateMonth(id, updates) {
        const month = await this.updateDocument('months', id, updates);
        if (month) {
            await this.addActivity('month_updated', `Month "${month.name}" updated`, { monthId: id });
        }
        return month;
    }

    async deleteMonth(id) {
        const month = this.getMonthById(id);
        if (!month) return { success: false, message: 'Month not found' };

        const result = await this.deleteDocument('months', id);
        if (result.success) {
            await this.addActivity('month_deleted', `Month "${month.name}" deleted`, { monthId: id });
        }
        return result;
    }

    // Institution operations
    async addInstitution(institutionData) {
        const institution = await this.addDocument('institutions', institutionData);
        if (institution) {
            await this.addActivity('institution_created', `Institution "${institution.name}" created`, { institutionId: institution.id });
        }
        return institution;
    }

    async updateInstitution(id, updates) {
        const institution = await this.updateDocument('institutions', id, updates);
        if (institution) {
            await this.addActivity('institution_updated', `Institution "${institution.name}" updated`, { institutionId: id });
        }
        return institution;
    }

    async deleteInstitution(id) {
        const institution = this.getInstitutionById(id);
        if (!institution) return { success: false, message: 'Institution not found' };

        // Check if institution has students
        const hasStudents = this.getStudents().some(student => student.institutionId === id);
        if (hasStudents) {
            return { success: false, message: 'Cannot delete institution with existing students' };
        }

        const result = await this.deleteDocument('institutions', id);
        if (result.success) {
            await this.addActivity('institution_deleted', `Institution "${institution.name}" deleted`, { institutionId: id });
        }
        return result;
    }

    // Student operations
    async addStudent(studentData) {
        const studentWithId = {
            ...studentData,
            studentId: this.generateStudentId(),
            enrolledCourses: studentData.enrolledCourses || []
        };

        const student = await this.addDocument('students', studentWithId);
        if (student) {
            await this.addActivity('student_added', `Student "${student.name}" added with ID ${student.studentId}`, { studentId: student.id });
        }
        return student;
    }

    async updateStudent(id, updates) {
        const student = await this.updateDocument('students', id, updates);
        if (student) {
            await this.addActivity('student_updated', `Student "${student.name}" updated`, { studentId: id });
        }
        return student;
    }

    async deleteStudent(id) {
        const student = this.getStudentById(id);
        if (!student) return { success: false, message: 'Student not found' };

        const result = await this.deleteDocument('students', id);
        if (result.success) {
            await this.addActivity('student_deleted', `Student "${student.name}" deleted`, { studentId: id });
        }
        return result;
    }

    // Payment operations
    async addPayment(paymentData) {
        const paymentWithInvoice = {
            ...paymentData,
            invoiceNumber: this.generateInvoiceNumber(),
            monthPayments: paymentData.monthPayments || []
        };

        const payment = await this.addDocument('payments', paymentWithInvoice);
        if (payment) {
            await this.addActivity('payment_received', `Payment of ৳${payment.paidAmount} received from ${payment.studentName}`, { paymentId: payment.id });
        }
        return payment;
    }

    // User operations
    async addUser(userData) {
        return await this.addDocument('users', userData);
    }

    async updateUser(id, updates) {
        return await this.updateDocument('users', id, updates);
    }

    async deleteUser(id) {
        return await this.deleteDocument('users', id);
    }

    // Getter methods (using cache for performance)
    getBatches() {
        return this.cache.batches || [];
    }

    getCourses() {
        return this.cache.courses || [];
    }

    getMonths() {
        return this.cache.months || [];
    }

    getInstitutions() {
        return this.cache.institutions || [];
    }

    getStudents() {
        return this.cache.students || [];
    }

    getPayments() {
        return this.cache.payments || [];
    }

    getActivities() {
        return (this.cache.activities || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    getUsers() {
        return this.cache.users || [];
    }

    // Utility methods
    getBatchById(id) {
        return this.getBatches().find(batch => batch.id === id);
    }

    getCourseById(id) {
        return this.getCourses().find(course => course.id === id);
    }

    getMonthById(id) {
        return this.getMonths().find(month => month.id === id);
    }

    getInstitutionById(id) {
        return this.getInstitutions().find(institution => institution.id === id);
    }

    getStudentById(id) {
        return this.getStudents().find(student => student.id === id);
    }

    getStudentByStudentId(studentId) {
        return this.getStudents().find(student => student.studentId === studentId);
    }

    getUserById(id) {
        return this.getUsers().find(user => user.id === id);
    }

    getCoursesByBatch(batchId) {
        return this.getCourses().filter(course => course.batchId === batchId);
    }

    getMonthsByCourse(courseId) {
        return this.getMonths().filter(month => month.courseId === courseId);
    }

    getStudentsByBatch(batchId) {
        return this.getStudents().filter(student => student.batchId === batchId);
    }

    getPaymentsByStudent(studentId) {
        return this.getPayments().filter(payment => payment.studentId === studentId);
    }

    // Get month payment details for a student
    getMonthPaymentDetails(studentId) {
        const payments = this.getPaymentsByStudent(studentId);
        const monthPayments = {};
        
        payments.forEach(payment => {
            if (payment.monthPayments) {
                payment.monthPayments.forEach(monthPayment => {
                    const monthId = monthPayment.monthId;
                    if (!monthPayments[monthId]) {
                        monthPayments[monthId] = {
                            totalPaid: 0,
                            totalDiscount: 0,
                            monthFee: monthPayment.monthFee || 0,
                            payments: []
                        };
                    }
                    monthPayments[monthId].totalPaid += monthPayment.paidAmount;
                    monthPayments[monthId].totalDiscount += (monthPayment.discountAmount || 0);
                    monthPayments[monthId].payments.push({
                        paymentId: payment.id,
                        paidAmount: monthPayment.paidAmount,
                        discountAmount: monthPayment.discountAmount || 0,
                        date: payment.createdAt
                    });
                });
            } else if (payment.months) {
                // Handle legacy payments
                payment.months.forEach(monthId => {
                    const month = this.getMonthById(monthId);
                    if (month) {
                        if (!monthPayments[monthId]) {
                            monthPayments[monthId] = {
                                totalPaid: 0,
                                totalDiscount: 0,
                                monthFee: month.payment,
                                payments: []
                            };
                        }
                        const amountPaid = payment.paidAmount / payment.months.length;
                        let discountAmount = 0;
                        if (payment.discountAmount > 0 && payment.discountApplicableMonths) {
                            if (payment.discountApplicableMonths.includes(monthId)) {
                                const applicableMonthsCount = payment.discountApplicableMonths.length;
                                if (applicableMonthsCount > 0) {
                                    if (payment.discountType === 'percentage') {
                                        const discountPercentage = parseFloat(payment.discountAmount || 0);
                                        discountAmount = (month.payment * discountPercentage) / 100;
                                    } else {
                                        discountAmount = payment.discountAmount / applicableMonthsCount;
                                    }
                                }
                            }
                        } else if (payment.discountAmount > 0) {
                            if (payment.discountType === 'percentage') {
                                const discountPercentage = parseFloat(payment.discountAmount || 0);
                                discountAmount = (month.payment * discountPercentage) / 100;
                            } else {
                                discountAmount = payment.discountAmount / payment.months.length;
                            }
                        }
                        
                        monthPayments[monthId].totalPaid += amountPaid;
                        monthPayments[monthId].totalDiscount += discountAmount;
                        monthPayments[monthId].payments.push({
                            paymentId: payment.id,
                            paidAmount: amountPaid,
                            discountAmount: discountAmount,
                            date: payment.createdAt
                        });
                    }
                });
            }
        });
        
        return monthPayments;
    }

    // Get payments with discounts
    getDiscountedPayments() {
        return this.getPayments().filter(payment => 
            payment.discountAmount && payment.discountAmount > 0
        );
    }
}

// Create and export the storage manager instance
const storageManager = new FirestoreStorageManager();
window.storageManager = storageManager;

export default storageManager;