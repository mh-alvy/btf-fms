// Invoice Management
class InvoiceManager {
    constructor() {
        this.init();
    }

    init() {
        // Invoice functionality is ready
    }

    generateInvoice(payment) {
        const student = window.storageManager.getStudentById(payment.studentId);
        const institution = student ? window.storageManager.getInstitutionById(student.institutionId) : null;
        const batch = student ? window.storageManager.getBatchById(student.batchId) : null;

        // Get course and month details
        const courseDetails = payment.courses.map(courseId => {
            const course = window.storageManager.getCourseById(courseId);
            return course || { name: 'Unknown Course' };
        });

        const monthDetails = payment.months.map(monthId => {
            const month = window.storageManager.getMonthById(monthId);
            const course = month ? window.storageManager.getCourseById(month.courseId) : null;
            return {
                name: month?.name || 'Unknown Month',
                payment: month?.payment || 0,
                courseName: course?.name || 'Unknown Course'
            };
        });

        const invoiceHtml = this.createInvoiceHTML(payment, student, institution, batch, courseDetails, monthDetails);
        
        window.navigationManager.showModal('invoiceModal', 'Invoice', invoiceHtml);
    }

    createInvoiceHTML(payment, student, institution, batch, courseDetails, monthDetails) {
        return `
            <div class="invoice-container">
                <!-- Header Section -->
                <div class="thermal-header">
                    <div class="company-logo">
                        <h1>BREAK THE FEAR</h1>
                        <p>Professional Coaching Center</p>
                    </div>
                    <div class="company-details">
                        <p>Address: Dhaka, Bangladesh</p>
                        <p>Phone: +880 1XXX-XXXXXX</p>
                        <p>Email: info@breakthefear.com</p>
                    </div>
                </div>

                <!-- Invoice Info -->
                <div class="thermal-invoice-info">
                    <div class="invoice-title">PAYMENT RECEIPT</div>
                    <div class="invoice-details-row">
                        <span>Invoice #: ${payment.invoiceNumber}</span>
                    </div>
                    <div class="invoice-details-row">
                        <span>Date: ${Utils.formatDate(payment.createdAt)}</span>
                        <span>Time: ${Utils.formatTime(payment.createdAt)}</span>
                    </div>
                </div>

                <!-- Customer Info -->
                <div class="thermal-customer">
                    <div class="section-title">STUDENT INFORMATION</div>
                    <div class="customer-row">
                        <span class="label">Name:</span>
                        <span class="value">${student?.name || 'Unknown'}</span>
                    </div>
                    <div class="customer-row">
                        <span class="label">ID:</span>
                        <span class="value">${student?.studentId || 'Unknown'}</span>
                    </div>
                    <div class="customer-row">
                        <span class="label">Phone:</span>
                        <span class="value">${student?.phone || 'N/A'}</span>
                    </div>
                    <div class="customer-row">
                        <span class="label">Institution:</span>
                        <span class="value">${institution?.name || 'Unknown'}</span>
                    </div>
                    <div class="customer-row">
                        <span class="label">Batch:</span>
                        <span class="value">${batch?.name || 'Unknown'}</span>
                    </div>
                </div>

                <!-- Items Section -->
                <div class="thermal-items">
                    <div class="section-title">PAYMENT DETAILS</div>
                    <div class="items-header">
                        <span class="item-desc">Description</span>
                        <span class="item-amount">Amount</span>
                    </div>
                    <div class="items-divider"></div>
                    ${monthDetails.map(month => `
                        <div class="item-row">
                            <span class="item-desc">
                                ${month.name}<br>
                                <small>(${month.courseName})</small>
                            </span>
                            <span class="item-amount">${Utils.formatCurrency(month.payment)}</span>
                        </div>
                    `).join('')}
                </div>

                <!-- Totals Section -->
                <div class="thermal-totals">
                    <div class="items-divider"></div>
                    <div class="total-row">
                        <span class="total-label">Subtotal:</span>
                        <span class="total-amount">${Utils.formatCurrency(payment.totalAmount)}</span>
                    </div>
                    ${payment.discountAmount > 0 ? `
                    <div class="total-row discount-row">
                        <span class="total-label">Discount ${payment.discountType === 'percentage' ? '(' + payment.discountAmount + '%)' : '(Fixed)'}:</span>
                        <span class="total-amount">-${Utils.formatCurrency(payment.discountAmount)}</span>
                    </div>
                    <div class="total-row">
                        <span class="total-label">After Discount:</span>
                        <span class="total-amount">${Utils.formatCurrency(payment.discountedAmount)}</span>
                    </div>
                    ` : ''}
                    <div class="total-row paid-row">
                        <span class="total-label">PAID:</span>
                        <span class="total-amount">${Utils.formatCurrency(payment.paidAmount)}</span>
                    </div>
                    ${payment.dueAmount > 0 ? `
                    <div class="total-row due-row">
                        <span class="total-label">DUE:</span>
                        <span class="total-amount">${Utils.formatCurrency(payment.dueAmount)}</span>
                    </div>
                    ` : ''}
                    <div class="items-divider"></div>
                </div>

                <!-- Payment Info -->
                <div class="thermal-payment-info">
                    <div class="payment-row">
                        <span class="label">Received By:</span>
                        <span class="value">${payment.receivedBy}</span>
                    </div>
                    ${payment.reference ? `
                    <div class="payment-row">
                        <span class="label">Reference:</span>
                        <span class="value">${payment.reference}</span>
                    </div>
                    ` : ''}
                </div>

                <!-- Footer -->
                <div class="thermal-footer">
                    <div class="thank-you">THANK YOU FOR YOUR PAYMENT!</div>
                    <div class="footer-note">
                        This is a computer generated receipt.<br>
                        No signature required.
                    </div>
                    <div class="footer-contact">
                        For queries: info@breakthefear.com
                    </div>
                </div>

                <!-- Print Actions -->
                <div class="print-actions">
                    <button class="btn btn-primary" onclick="invoiceManager.printInvoice()">Print Receipt</button>
                    <button class="btn btn-outline" onclick="navigationManager.closeModal(document.getElementById('invoiceModal'))">Close</button>
                </div>
            </div>
        `;
    }

    printInvoice() {
        const invoiceContent = document.querySelector('.invoice-container');
        if (invoiceContent) {
            Utils.printElement(invoiceContent);
        }
    }
}

// Global invoice manager instance
window.invoiceManager = new InvoiceManager();
