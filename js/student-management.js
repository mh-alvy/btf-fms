// Student Management
class StudentManagementManager {
    constructor() {
        this.isInitialized = false;
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        this.bindEvents();
        this.refresh();
    }

    bindEvents() {
        // Create Institution Form
        const createInstitutionForm = document.getElementById('createInstitutionForm');
        if (createInstitutionForm) {
            createInstitutionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createInstitution();
            });
        }

        // Add Student Form
        const addStudentForm = document.getElementById('addStudentForm');
        if (addStudentForm) {
            addStudentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addStudent();
            });
        }

        // Student batch change
        const studentBatchSelect = document.getElementById('studentBatch');
        if (studentBatchSelect) {
            studentBatchSelect.addEventListener('change', () => {
                this.updateCourseSelection();
            });
        }
    }

    async createInstitution() {
        const institutionName = window.utils.sanitizeInput(document.getElementById('institutionName').value);
        const institutionAddress = window.utils.sanitizeInput(document.getElementById('institutionAddress').value);

        if (!institutionName || !institutionAddress) {
            window.utils.showToast('Please fill all fields', 'error');
            return;
        }

        // Check if institution already exists
        const existingInstitution = window.storageManager.getInstitutions().find(i => 
            i.name.toLowerCase() === institutionName.toLowerCase()
        );

        if (existingInstitution) {
            window.utils.showToast('Institution with this name already exists', 'error');
            return;
        }

        try {
            const institution = await window.storageManager.addInstitution({ 
                name: institutionName, 
                address: institutionAddress 
            });
            window.utils.showToast('Institution created successfully', 'success');
            
            document.getElementById('createInstitutionForm').reset();
            this.refresh();
        } catch (error) {
            console.error('Error creating institution:', error);
            window.utils.showToast('Failed to create institution', 'error');
        }
    }

    async addStudent() {
        const studentName = window.utils.sanitizeInput(document.getElementById('studentName').value);
        const institutionId = document.getElementById('studentInstitution').value;
        const gender = document.getElementById('studentGender').value;
        const phone = window.utils.sanitizeInput(document.getElementById('studentPhone').value);
        const guardianName = window.utils.sanitizeInput(document.getElementById('guardianName').value);
        const guardianPhone = window.utils.sanitizeInput(document.getElementById('guardianPhone').value);
        const batchId = document.getElementById('studentBatch').value;

        if (!studentName || !institutionId || !gender || !phone || !guardianName || !guardianPhone || !batchId) {
            window.utils.showToast('Please fill all required fields', 'error');
            return;
        }

        // Validate phone numbers
        if (!window.utils.validatePhone(phone)) {
            window.utils.showToast('Please enter a valid student phone number', 'error');
            return;
        }

        if (!window.utils.validatePhone(guardianPhone)) {
            window.utils.showToast('Please enter a valid guardian phone number', 'error');
            return;
        }

        // Get enrolled courses
        const enrolledCourses = this.getEnrolledCourses();

        if (enrolledCourses.length === 0) {
            window.utils.showToast('Please select at least one course', 'error');
            return;
        }

        const studentData = {
            name: studentName,
            institutionId,
            gender,
            phone,
            guardianName,
            guardianPhone,
            batchId,
            enrolledCourses
        };

        try {
            const student = await window.storageManager.addStudent(studentData);
            window.utils.showToast(`Student added successfully with ID: ${student.student_id}`, 'success');
            
            document.getElementById('addStudentForm').reset();
            this.updateCourseSelection(); // Reset course selection
            this.refresh();
        } catch (error) {
            console.error('Error adding student:', error);
            window.utils.showToast('Failed to add student', 'error');
        }
    }

    getEnrolledCourses() {
        const courseSelection = document.getElementById('courseSelection');
        if (!courseSelection) return [];

        const enrolledCourses = [];
        const courseItems = courseSelection.querySelectorAll('.course-enrollment-item');

        courseItems.forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (checkbox && checkbox.checked) {
                const courseId = checkbox.value;
                const startingMonthSelect = item.querySelector('.starting-month-select select');
                const endingMonthSelect = item.querySelector('.ending-month-select select');
                
                const startingMonthId = startingMonthSelect ? startingMonthSelect.value : null;
                const endingMonthId = endingMonthSelect ? endingMonthSelect.value : null;

                if (startingMonthId) {
                    enrolledCourses.push({
                        courseId,
                        startingMonthId,
                        endingMonthId: endingMonthId || null
                    });
                }
            }
        });

        return enrolledCourses;
    }

    updateCourseSelection() {
        const batchId = document.getElementById('studentBatch').value;
        const courseSelection = document.getElementById('courseSelection');

        if (!batchId || !courseSelection) {
            if (courseSelection) {
                courseSelection.innerHTML = '<p>Please select a batch first</p>';
            }
            return;
        }

        const courses = window.storageManager.getCoursesByBatch(batchId);

        if (courses.length === 0) {
            courseSelection.innerHTML = '<p>No courses available for this batch</p>';
            return;
        }

        courseSelection.innerHTML = courses.map(course => {
            const months = window.storageManager.getMonthsByCourse(course.id)
                .sort((a, b) => (a.month_number || 0) - (b.month_number || 0));

            return `
                <div class="course-enrollment-item">
                    <div class="course-checkbox">
                        <input type="checkbox" id="course_${course.id}" value="${course.id}" onchange="studentManager.toggleCourseSelection('${course.id}')">
                        <label for="course_${course.id}">${course.name}</label>
                    </div>
                    <div class="starting-month-select" id="starting_${course.id}" style="display: none;">
                        <label>Starting Month:</label>
                        <select>
                            <option value="">Select Starting Month</option>
                            ${months.map(month => 
                                `<option value="${month.id}">${month.name} (Month ${month.month_number || 'N/A'})</option>`
                            ).join('')}
                        </select>
                        <label>Ending Month (Optional):</label>
                        <select class="ending-month-select">
                            <option value="">Select Ending Month (Optional)</option>
                            ${months.map(month => 
                                `<option value="${month.id}">${month.name} (Month ${month.month_number || 'N/A'})</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
            `;
        }).join('');
    }

    toggleCourseSelection(courseId) {
        const checkbox = document.getElementById(`course_${courseId}`);
        const monthSelect = document.getElementById(`starting_${courseId}`);

        if (checkbox && monthSelect) {
            if (checkbox.checked) {
                monthSelect.style.display = 'block';
            } else {
                monthSelect.style.display = 'none';
                // Reset month selections
                const selects = monthSelect.querySelectorAll('select');
                selects.forEach(select => select.value = '');
            }
        }
    }

    refresh() {
        this.loadInstitutions();
        this.updateDropdowns();
    }

    loadInstitutions() {
        const institutionList = document.getElementById('institutionList');
        if (!institutionList) return;

        const institutions = window.storageManager.getInstitutions();

        if (institutions.length === 0) {
            institutionList.innerHTML = '<p class="text-center">No institutions created yet</p>';
            return;
        }

        institutionList.innerHTML = institutions.map(institution => `
            <div class="entity-item">
                <div class="entity-info">
                    <div class="entity-name">${institution.name}</div>
                    <div class="entity-details">${institution.address} | Created: ${window.utils.formatDate(institution.created_at)}</div>
                </div>
                <div class="entity-actions">
                    <button class="btn btn-small btn-outline" onclick="studentManager.editInstitution('${institution.id}')">Edit</button>
                    <button class="btn btn-small btn-danger" onclick="studentManager.deleteInstitution('${institution.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    }

    updateDropdowns() {
        // Update institution dropdown
        const institutionSelect = document.getElementById('studentInstitution');
        if (institutionSelect) {
            const institutions = window.storageManager.getInstitutions();
            institutionSelect.innerHTML = '<option value="">Select Institution</option>' +
                institutions.map(inst => `<option value="${inst.id}">${inst.name}</option>`).join('');
        }

        // Update batch dropdown
        const batchSelect = document.getElementById('studentBatch');
        if (batchSelect) {
            const batches = window.storageManager.getBatches();
            batchSelect.innerHTML = '<option value="">Select Batch</option>' +
                batches.map(batch => `<option value="${batch.id}">${batch.name}</option>`).join('');
        }
    }

    editInstitution(id) {
        const institution = window.storageManager.getInstitutionById(id);
        if (!institution) return;

        const newName = prompt('Edit institution name:', institution.name);
        const newAddress = prompt('Edit institution address:', institution.address);

        if (newName && newAddress && (newName !== institution.name || newAddress !== institution.address)) {
            const sanitizedName = window.utils.sanitizeInput(newName);
            const sanitizedAddress = window.utils.sanitizeInput(newAddress);
            
            // Check if new name already exists
            const existingInstitution = window.storageManager.getInstitutions().find(i => 
                i.name.toLowerCase() === sanitizedName.toLowerCase() && i.id !== id
            );

            if (existingInstitution) {
                window.utils.showToast('Institution with this name already exists', 'error');
                return;
            }

            window.storageManager.updateInstitution(id, { 
                name: sanitizedName, 
                address: sanitizedAddress 
            });
            window.utils.showToast('Institution updated successfully', 'success');
            this.refresh();
        }
    }

    async deleteInstitution(id) {
        const institution = window.storageManager.getInstitutionById(id);
        if (!institution) {
            window.utils.showToast('Institution not found', 'error');
            return;
        }

        window.utils.confirm(`Are you sure you want to delete "${institution.name}"?`, async () => {
            try {
                const result = await window.storageManager.deleteInstitution(id);
                if (result.success) {
                    window.utils.showToast('Institution deleted successfully', 'success');
                    this.refresh();
                } else {
                    window.utils.showToast(result.message, 'error');
                }
            } catch (error) {
                console.error('Error deleting institution:', error);
                window.utils.showToast('Failed to delete institution', 'error');
            }
        });
    }

    async editStudent(studentId) {
        const student = await window.storageManager.getStudentById(studentId);
        if (!student) {
            window.utils.showToast('Student not found', 'error');
            return;
        }

        const editForm = `
            <form id="editStudentForm">
                <div class="form-section-header">Personal Information</div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="editStudentName">Student Name</label>
                        <input type="text" id="editStudentName" value="${student.name}" required>
                    </div>
                    <div class="form-group">
                        <label for="editStudentGender">Gender</label>
                        <select id="editStudentGender" required>
                            <option value="Male" ${student.gender === 'Male' ? 'selected' : ''}>Male</option>
                            <option value="Female" ${student.gender === 'Female' ? 'selected' : ''}>Female</option>
                            <option value="Custom" ${student.gender === 'Custom' ? 'selected' : ''}>Custom</option>
                        </select>
                    </div>
                </div>
                <div class="form-section-header">Contact Information</div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="editStudentPhone">Student Phone</label>
                        <input type="tel" id="editStudentPhone" value="${student.phone}" required>
                    </div>
                    <div class="form-group">
                        <label for="editGuardianName">Guardian Name</label>
                        <input type="text" id="editGuardianName" value="${student.guardian_name}" required>
                    </div>
                    <div class="form-group">
                        <label for="editGuardianPhone">Guardian Phone</label>
                        <input type="tel" id="editGuardianPhone" value="${student.guardian_phone}" required>
                    </div>
                </div>
                <div class="form-section-header">Academic Information</div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="editStudentInstitution">Institution</label>
                        <select id="editStudentInstitution" required>
                            <option value="">Select Institution</option>
                            ${window.storageManager.getInstitutions().map(inst => 
                                `<option value="${inst.id}" ${inst.id === student.institution_id ? 'selected' : ''}>${inst.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="editStudentBatch">Batch</label>
                        <select id="editStudentBatch" required>
                            <option value="">Select Batch</option>
                            ${window.storageManager.getBatches().map(batch => 
                                `<option value="${batch.id}" ${batch.id === student.batch_id ? 'selected' : ''}>${batch.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
                <div class="modal-actions">
                    <button type="submit" class="btn btn-primary">Update Student</button>
                    <button type="button" class="btn btn-outline" onclick="navigationManager.closeModal(document.getElementById('editModal'))">Cancel</button>
                </div>
            </form>
        `;

        window.navigationManager.showModal('editModal', 'Edit Student', editForm);

        document.getElementById('editStudentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateStudent(studentId);
        });
    }

    async updateStudent(studentId) {
        const name = window.utils.sanitizeInput(document.getElementById('editStudentName').value);
        const gender = document.getElementById('editStudentGender').value;
        const phone = window.utils.sanitizeInput(document.getElementById('editStudentPhone').value);
        const guardianName = window.utils.sanitizeInput(document.getElementById('editGuardianName').value);
        const guardianPhone = window.utils.sanitizeInput(document.getElementById('editGuardianPhone').value);
        const institutionId = document.getElementById('editStudentInstitution').value;
        const batchId = document.getElementById('editStudentBatch').value;

        if (!name || !gender || !phone || !guardianName || !guardianPhone || !institutionId || !batchId) {
            window.utils.showToast('Please fill all required fields', 'error');
            return;
        }

        // Validate phone numbers
        if (!window.utils.validatePhone(phone)) {
            window.utils.showToast('Please enter a valid student phone number', 'error');
            return;
        }

        if (!window.utils.validatePhone(guardianPhone)) {
            window.utils.showToast('Please enter a valid guardian phone number', 'error');
            return;
        }

        const updates = {
            name,
            gender,
            phone,
            guardianName,
            guardianPhone,
            institutionId,
            batchId
        };

        try {
            await window.storageManager.updateStudent(studentId, updates);
            window.utils.showToast('Student updated successfully', 'success');
            window.navigationManager.closeModal(document.getElementById('editModal'));
            
            // Refresh students database if it's active
            if (window.studentsDatabaseManager) {
                window.studentsDatabaseManager.applyFilters();
            }
        } catch (error) {
            console.error('Error updating student:', error);
            window.utils.showToast('Failed to update student', 'error');
        }
    }
}

// Global student manager instance
window.studentManager = new StudentManagementManager();