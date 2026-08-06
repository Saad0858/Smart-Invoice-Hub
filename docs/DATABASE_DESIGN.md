# Database Design

## Tables

### Users

* id
* fullName
* email
* password
* role
* isActive
* lastLogin
* createdAt
* updatedAt
* createdBy
* updatedBy
* deletedAt

### Categories

* id
* name
* description
* isActive
* createdAt
* updatedAt
* createdBy
* updatedBy
* deletedAt

### Brands

* id
* name
* description
* isActive
* createdAt
* updatedAt
* createdBy
* updatedBy
* deletedAt

### Products

* id
* sku
* barcode
* name
* description
* categoryId
* brandId
* hsnCode
* gstRate
* unit
* sellingPrice
* openingStock
* currentStock
* minStock
* isActive
* imageUrl
* searchKeywords
* createdAt
* updatedAt
* createdBy
* updatedBy
* deletedAt

### Customers

* id
* customerCode
* companyName
* contactPerson
* gstNumber
* panNumber
* phone
* email
* address
* city
* state
* stateCode
* country
* postalCode
* customerType
* creditLimit
* openingBalance
* currentBalance
* isActive
* createdAt
* updatedAt
* createdBy
* updatedBy
* deletedAt

### Invoices

* id
* invoiceNumber
* invoiceDate
* dueDate
* customerId
* subtotal
* taxableAmount
* discountAmount
* transportCharges
* otherCharges
* cgstAmount
* sgstAmount
* igstAmount
* totalGstAmount
* roundOff
* grandTotal
* status
* paymentStatus
* notes
* terms
* pdfUrl
* pdfGeneratedAt
* createdAt
* updatedAt
* createdBy
* updatedBy

### InvoiceItems

* id
* invoiceId
* productId
* sku
* productName
* hsnCode
* unit
* gstRate
* quantity
* unitPrice
* discount
* taxableAmount
* cgstAmount
* sgstAmount
* igstAmount
* lineTotal
* createdAt

### CompanySettings

* id
* companyName
* gstNumber
* panNumber
* cinNumber
* phone
* email
* website
* address
* city
* state
* stateCode
* postalCode
* country
* logoUrl
* bankName
* branch
* accountHolder
* accountNumber
* ifscCode
* upiId
* digitalSignature
* invoicePrefix
* invoiceSuffix
* nextInvoiceNumber
* invoiceFooter
* primaryColor
* createdAt
* updatedAt
* createdBy
* updatedBy

### InvoiceSequence

* id
* year
* prefix
* current
* createdAt
* updatedAt

### ActivityLogs

* id
* userId
* module
* action
* description
* entity
* entityId
* oldValue
* newValue
* ipAddress
* userAgent
* createdAt

### Payments (Phase 10 - Accounts Receivable)

* id
* paymentNumber (Auto-generated, unique)
* invoiceId (FK to Invoices)
* customerId (FK to Customers)
* paymentDate
* amount
* paymentMethod (CASH, UPI, BANK_TRANSFER, CHEQUE, CARD, OTHER)
* referenceNumber (Optional, required for UPI/BANK_TRANSFER/CHEQUE)
* remarks
* receivedBy
* isCancelled (Default: false)
* cancelledReason
* createdAt
* updatedAt
* createdBy
* updatedBy

### Enums (Phase 10)

#### PaymentMethod
* CASH
* UPI
* BANK_TRANSFER
* CHEQUE
* CARD
* OTHER

#### PaymentStatus (Updated)
* UNPAID
* PARTIALLY_PAID
* PAID
* OVERDUE
* CANCELLED