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
        this.db = db;
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
        
        // Cache for offline functionality
        this.cache = {
            batches: [],
            courses: [],
            months: [],
            institutions: [],
            students: [],
            payments: [],
            activities: [],
            users: []
        };
        
        this.isOnline = navigator.onLine;
        this.pendingOperations = [];
        
        this.init();
    }

    async init() {
        // Monitor online status
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncPendingOperations();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });

        // Load initial data
        await this.loadAllData();
        
        // Set up real-time listeners
        this.setupRealtimeListeners();
    }

    async loadAllData() {
        try {
            // Load all collections in parallel
            const promises = Object.keys(this.collections).map(key => 
                this.loadCollection(key)
            );
            
            await Promise.all(promises);
            console.log('All data loaded from Firestore');
        } catch (error) {
            console.error('Error loading data from Firestore:', error);
            // Fallback to localStorage if Firestore fails
            this.loadFromLocalStorage();
        }
    }

    async loadCollection(collectionName) {
        try {
            const querySnapshot = await getDocs(collection(this.db, this.collections[collectionName]));
            const data = [];
            
            querySnapshot.forEach((doc) => {
                data.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            this.cache[collectionName] = data;
            
            // Also save to localStorage as backup
            localStorage.setItem(`btf_${collectionName}`, JSON.stringify(data));
            
            return data;
        } catch (error) {
            console.error(`Error loading ${collectionName}:`, error);
            // Fallback to localStorage
            const localData = JSON.parse(localStorage.getItem(`btf_${collectionName}`) || '[]');
            this.cache[collectionName] = localData;
            return localData;
        }
    }

    loadFromLocalStorage() {
        Object.keys(this.collections).forEach(key => {
            try {
                const data = JSON.parse(localStorage.getItem(`btf_${key}`) || '[]');
                this.cache[key] = data;
            } catch (e) {
                console.error(`Error loading ${key} from localStorage:`, e);
                this.cache[key] = [];
            }
        });
    }

    setupRealtimeListeners() {
        Object.keys(this.collections).forEach(collectionName => {
            const unsubscribe = onSnapshot(
                collection(this.db, this.collections[collectionName]),
                (snapshot) => {
                    const data = [];
                    snapshot.forEach((doc) => {
                        data.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    
                    this.cache[collectionName] = data;
                    localStorage.setItem(`btf_${collectionName}`, JSON.stringify(data));
                    
                    // Refresh UI if needed
                    this.notifyDataChange(collectionName);
                },
                (error) => {
                    console.error(`Error in ${collectionName} listener:`, error);
                }
            );
        });
    }

    notifyDataChange(collectionName) {
        // Refresh relevant UI components
        switch (collectionName) {
            case 'students':
                if (window.studentsDatabaseManager) {
                    window.studentsDatabaseManager.refresh();
                }
                if (window.dashboardManager) {
                    window.dashboardManager.refresh();
                }
                break;
            case 'payments':
                if (window.dashboardManager) {
                    window.dashboardManager.refresh();
                }
                break;
            case 'batches':
            case 'courses':
            case 'months':
                if (window.batchManager) {
                    window.batchManager.refresh();
                }
                break;
        }
    }

    generateId(prefix = 'item') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateStudentId() {
        const year = new Date().getFullYear().toString().substr(-2);
        const existing = this.cache.students.length;
        return `BTF${year}${(existing + 1).toString().padStart(4, '0')}`;
    }

    generateInvoiceNumber() {
        const year = new Date().getFullYear();
        const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
        const existing = this.cache.payments.length;
        return `INV${year}${month}${(existing + 1).toString().padStart(4, '0')}`;
    }

    async addDocument(collectionName, data) {
        try {
            const docData = {
                ...data,
                createdAt: serverTimestamp(),
                createdBy: window.authManager.getCurrentUser()?.username || 'System'
            };

            if (this.isOnline) {
                const docRef = await addDoc(collection(this.db, this.collections[collectionName]), docData);
                const newDoc = { id: docRef.id, ...data, createdAt: new Date().toISOString() };
                
                // Update cache
                this.cache[collectionName].push(newDoc);
                localStorage.setItem(`btf_${collectionName}`, JSON.stringify(this.cache[collectionName]));
                
                return newDoc;
            } else {
                // Offline mode - store in cache and localStorage
                const newDoc = { 
                    id: this.generateId(collectionName.slice(0, -1)), 
                    ...data, 
                    createdAt: new Date().toISOString(),
                    _pendingSync: true
                };
                
                this.cache[collectionName].push(newDoc);
                localStorage.setItem(`btf_${collectionName}`, JSON.stringify(this.cache[collectionName]));
                
                // Queue for sync when online
                this.pendingOperations.push({
                    type: 'add',
                    collection: collectionName,
                    data: newDoc
                });
                
                return newDoc;
            }
        } catch (error) {
            console.error(`Error adding document to ${collectionName}:`, error);
            throw error;
        }
    }

    async updateDocument(collectionName, id, updates) {
        try {
            if (this.isOnline) {
                const docRef = doc(this.db, this.collections[collectionName], id);
                await updateDoc(docRef, {
                    ...updates,
                    updatedAt: serverTimestamp()
                });
            }

            // Update cache
            const index = this.cache[collectionName].findIndex(item => item.id === id);
            if (index !== -1) {
                this.cache[collectionName][index] = { 
                    ...this.cache[collectionName][index], 
                    ...updates,
                    updatedAt: new Date().toISOString()
                };
                localStorage.setItem(`btf_${collectionName}`, JSON.stringify(this.cache[collectionName]));
                return this.cache[collectionName][index];
            }
            
            return null;
        } catch (error) {
            console.error(`Error updating document in ${collectionName}:`, error);
            throw error;
        }
    }

    async deleteDocument(collectionName, id) {
        try {
            if (this.isOnline) {
                const docRef = doc(this.db, this.collections[collectionName], id);
                await deleteDoc(docRef);
            }

            // Update cache
            this.cache[collectionName] = this.cache[collectionName].filter(item => item.id !== id);
            localStorage.setItem(`btf_${collectionName}`, JSON.stringify(this.cache[collectionName]));
            
            return { success: true };
        } catch (error) {
            console.error(`Error deleting document from ${collectionName}:`, error);
            return { success: false, message: error.message };
        }
    }

    async syncPendingOperations() {
        if (!this.isOnline || this.pendingOperations.length === 0) return;

        console.log(`Syncing ${this.pendingOperations.length} pending operations...`);
        
        for (const operation of this.pendingOperations) {
            try {
                if (operation.type === 'add') {
                    const { _pendingSync, ...cleanData } = operation.data;
                    await addDoc(collection(this.db, this.collections[operation.collection]), {
                        ...cleanData,
                        createdAt: serverTimestamp()
                    });
                }
                // Add other operation types as needed
            } catch (error) {
                console.error('Error syncing operation:', error);
            }
        }
        
        this.pendingOperations = [];
        console.log('Pending operations synced successfully');
    }

    // Activity logging
    async addActivity(type, description, data = {}) {
        const activity = {
            type,
            description,
            data,
            timestamp: new Date().toISOString(),
            user: window.authManager.getCurrentUser()?.username || 'System'
        };

        await this.addDocument('activities', activity);
        
        // Keep only last 100 activities in cache
        if (this.cache.activities.length > 100) {
            this.cache.activities = this.cache.activities
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 100);
        }

        return activity;
    }

    // Batch operations
    async addBatch(batchData) {
        const batch = await this.addDocument('batches', batchData);
        await this.addActivity('batch_created', `Batch "${batch.name}" created`, { batchId: batch.id });
        return batch;
    }

    async updateBatch(id, updates) {
        const result = await this.updateDocument('batches', id, updates);
        if (result) {
            await this.addActivity('batch_updated', `Batch "${result.name}" updated`, { batchId: id });
        }
        return result;
    }

    async deleteBatch(id) {
        const batch = this.cache.batches.find(item => item.id === id);
        if (batch) {
            // Check if batch has courses
            const hasCourses = this.cache.courses.some(course => course.batchId === id);
            if (hasCourses) {
                return { success: false, message: 'Cannot delete batch with existing courses' };
            }

            const result = await this.deleteDocument('batches', id);
            if (result.success) {
                await this.addActivity('batch_deleted', `Batch "${batch.name}" deleted`, { batchId: id });
            }
            return result;
        }
        return { success: false, message: 'Batch not found' };
    }

    // Course operations
    async addCourse(courseData) {
        const course = await this.addDocument('courses', courseData);
        await this.addActivity('course_created', `Course "${course.name}" created`, { courseId: course.id });
        return course;
    }

    async updateCourse(id, updates) {
        const result = await this.updateDocument('courses', id, updates);
        if (result) {
            await this.addActivity('course_updated', `Course "${result.name}" updated`, { courseId: id });
        }
        return result;
    }

    async deleteCourse(id) {
        const course = this.cache.courses.find(item => item.id === id);
        if (course) {
            // Check if course has months
            const hasMonths = this.cache.months.some(month => month.courseId === id);
            if (hasMonths) {
                return { success: false, message: 'Cannot delete course with existing months' };
            }

            const result = await this.deleteDocument('courses', id);
            if (result.success) {
                await this.addActivity('course_deleted', `Course "${course.name}" deleted`, { courseId: id });
            }
            return result;
        }
        return { success: false, message: 'Course not found' };
    }

    // Month operations
    async addMonth(monthData) {
        const month = await this.addDocument('months', {
            ...monthData,
            monthNumber: monthData.monthNumber || 1,
            monthName: monthData.monthName || monthData.name
        });
        await this.addActivity('month_created', `Month "${month.name}" created`, { monthId: month.id });
        return month;
    }

    async updateMonth(id, updates) {
        const result = await this.updateDocument('months', id, updates);
        if (result) {
            await this.addActivity('month_updated', `Month "${result.name}" updated`, { monthId: id });
        }
        return result;
    }

    async deleteMonth(id) {
        const month = this.cache.months.find(item => item.id === id);
        if (month) {
            const result = await this.deleteDocument('months', id);
            if (result.success) {
                await this.addActivity('month_deleted', `Month "${month.name}" deleted`, { monthId: id });
            }
            return result;
        }
        return { success: false, message: 'Month not found' };
    }

    // Institution operations
    async addInstitution(institutionData) {
        const institution = await this.addDocument('institutions', institutionData);
        await this.addActivity('institution_created', `Institution "${institution.name}" created`, { institutionId: institution.id });
        return institution;
    }

    async updateInstitution(id, updates) {
        const result = await this.updateDocument('institutions', id, updates);
        if (result) {
            await this.addActivity('institution_updated', `Institution "${result.name}" updated`, { institutionId: id });
        }
        return result;
    }

    async deleteInstitution(id) {
        const institution = this.cache.institutions.find(item => item.id === id);
        if (institution) {
            // Check if institution has students
            const hasStudents = this.cache.students.some(student => student.institutionId === id);
            if (hasStudents) {
                return { success: false, message: 'Cannot delete institution with existing students' };
            }

            const result = await this.deleteDocument('institutions', id);
            if (result.success) {
                await this.addActivity('institution_deleted', `Institution "${institution.name}" deleted`, { institutionId: id });
            }
            return result;
        }
        return { success: false, message: 'Institution not found' };
    }

    // Student operations
    async addStudent(studentData) {
        const student = await this.addDocument('students', {
            ...studentData,
            studentId: this.generateStudentId(),
            enrolledCourses: studentData.enrolledCourses || []
        });
        await this.addActivity('student_added', `Student "${student.name}" added with ID ${student.studentId}`, { studentId: student.id });
        return student;
    }

    async updateStudent(id, updates) {
        const result = await this.updateDocument('students', id, updates);
        if (result) {
            await this.addActivity('student_updated', `Student "${result.name}" updated`, { studentId: id });
        }
        return result;
    }

    async deleteStudent(id) {
        const student = this.cache.students.find(item => item.id === id);
        if (student) {
            const result = await this.deleteDocument('students', id);
            if (result.success) {
                await this.addActivity('student_deleted', `Student "${student.name}" deleted`, { studentId: id });
            }
            return result;
        }
        return { success: false, message: 'Student not found' };
    }

    // Payment operations
    async addPayment(paymentData) {
        const payment = await this.addDocument('payments', {
            ...paymentData,
            invoiceNumber: this.generateInvoiceNumber(),
            monthPayments: paymentData.monthPayments || []
        });
        await this.addActivity('payment_received', `Payment of ৳${payment.paidAmount} received from ${payment.studentName}`, { paymentId: payment.id });
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

    // Getter methods (return cached data for performance)
    getBatches() { return this.cache.batches || []; }
    getCourses() { return this.cache.courses || []; }
    getMonths() { return this.cache.months || []; }
    getInstitutions() { return this.cache.institutions || []; }
    getStudents() { return this.cache.students || []; }
    getPayments() { return this.cache.payments || []; }
    getActivities() { return this.cache.activities || []; }
    getUsers() { return this.cache.users || []; }

    // Utility methods
    getBatchById(id) { return this.cache.batches.find(item => item.id === id); }
    getCourseById(id) { return this.cache.courses.find(item => item.id === id); }
    getMonthById(id) { return this.cache.months.find(item => item.id === id); }
    getInstitutionById(id) { return this.cache.institutions.find(item => item.id === id); }
    getStudentById(id) { return this.cache.students.find(item => item.id === id); }
    getStudentByStudentId(studentId) { return this.cache.students.find(item => item.studentId === studentId); }

    getCoursesByBatch(batchId) {
        return this.cache.courses.filter(course => course.batchId === batchId);
    }

    getMonthsByCourse(courseId) {
        return this.cache.months.filter(month => month.courseId === courseId);
    }

    getStudentsByBatch(batchId) {
        return this.cache.students.filter(student => student.batchId === batchId);
    }

    getPaymentsByStudent(studentId) {
        return this.cache.payments.filter(payment => payment.studentId === studentId);
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
        return this.cache.payments.filter(payment => 
            payment.discountAmount && payment.discountAmount > 0
        );
    }

    // Migration method to move localStorage data to Firestore
    async migrateLocalStorageToFirestore() {
        console.log('Starting migration from localStorage to Firestore...');
        
        try {
            const batch = writeBatch(this.db);
            let operationCount = 0;
            
            for (const [collectionName, firestoreCollection] of Object.entries(this.collections)) {
                const localData = JSON.parse(localStorage.getItem(`btf_${collectionName}`) || '[]');
                
                if (localData.length > 0) {
                    console.log(`Migrating ${localData.length} ${collectionName} records...`);
                    
                    for (const item of localData) {
                        const { id, ...data } = item;
                        const docRef = doc(collection(this.db, firestoreCollection));
                        batch.set(docRef, {
                            ...data,
                            migratedAt: serverTimestamp(),
                            originalId: id
                        });
                        operationCount++;
                        
                        // Firestore batch limit is 500 operations
                        if (operationCount >= 450) {
                            await batch.commit();
                            operationCount = 0;
                        }
                    }
                }
            }
            
            if (operationCount > 0) {
                await batch.commit();
            }
            
            console.log('Migration completed successfully!');
            Utils.showToast('Data migrated to Firestore successfully!', 'success');
            
            // Reload data from Firestore
            await this.loadAllData();
            
        } catch (error) {
            console.error('Migration failed:', error);
            Utils.showToast('Migration failed. Using local storage.', 'error');
        }
    }
}

// Export for use in other modules
export { FirestoreStorageManager };