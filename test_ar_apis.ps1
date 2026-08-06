# Get the access token from login response
$loginResponse = Get-Content -Path 'd:\Smart_Invioce_Hub\login_response.json' -Raw | ConvertFrom-Json
$token = $loginResponse.data.tokens.accessToken
$headers = @{'Authorization' = "Bearer $token"; 'Content-Type' = 'application/json'}

Write-Host "==========================================" -ForegroundColor Green
Write-Host "Testing Accounts Receivable APIs" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

function Test-Endpoint {
    param($name, $method, $url, $body = $null)
    Write-Host "`n--- $name ---" -ForegroundColor Cyan
    try {
        $params = @{
            Uri = "http://localhost:3000$url"
            Method = $method
            Headers = $headers
            UseBasicParsing = $true
        }
        if ($body) { $params.Body = $body }
        $response = Invoke-WebRequest @params
        $content = $response.Content | ConvertFrom-Json
        if ($content.success) {
            Write-Host "✅ SUCCESS" -ForegroundColor Green
            Write-Host "Data: $($content.data | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
        } else {
            Write-Host "❌ FAILED: $($content.message)" -ForegroundColor Red
            Write-Host "Errors: $($content.errors | ConvertTo-Json)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $errorBody = $reader.ReadToEnd()
            Write-Host "Response: $errorBody" -ForegroundColor Red
        }
    }
}

# ============================================
# PAYMENTS MODULE TESTS
# ============================================

Write-Host "`n==========================================" -ForegroundColor Yellow
Write-Host "PAYMENTS MODULE" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow

# 1. List payments
Test-Endpoint "List Payments" "GET" "/api/v1/payments?page=1&limit=10"

# 2. Payment statistics
Test-Endpoint "Payment Statistics" "GET" "/api/v1/payments/statistics"

# 3. Payment method distribution
Test-Endpoint "Payment Method Distribution" "GET" "/api/v1/payments/method-distribution"

# 4. Collection trend
Test-Endpoint "Collection Trend (monthly)" "GET" "/api/v1/payments/collection-trend?interval=monthly"

# 5. Get invoices to find an invoice ID for testing
$invoicesResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/invoices?page=1&limit=5" -Method GET -Headers $headers -UseBasicParsing
$invoicesData = $invoicesResponse.Content | ConvertFrom-Json
if ($invoicesData.data -and $invoicesData.data.length -gt 0) {
    $firstInvoice = $invoicesData.data[0]
    $invoiceId = $firstInvoice.id
    Write-Host "`nFound test invoice: $($firstInvoice.invoiceNumber) (ID: $invoiceId)" -ForegroundColor Magenta
    
    # 6. Payment history for invoice
    Test-Endpoint "Invoice Payment History" "GET" "/api/v1/payments/invoice/$invoiceId"
}

# 7. Get customers to find a customer ID for testing
$customersResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/customers?page=1&limit=5" -Method GET -Headers $headers -UseBasicParsing
$customersData = $customersResponse.Content | ConvertFrom-Json
if ($customersData.data -and $customersData.data.length -gt 0) {
    $firstCustomer = $customersData.data[0]
    $customerId = $firstCustomer.id
    Write-Host "`nFound test customer: $($firstCustomer.companyName) (ID: $customerId)" -ForegroundColor Magenta
    
    # 8. Customer payment history
    Test-Endpoint "Customer Payment History" "GET" "/api/v1/payments/customer/$customerId"
}

# 9. Get a payment ID for testing
$paymentsResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/payments?page=1&limit=1" -Method GET -Headers $headers -UseBasicParsing
$paymentsData = $paymentsResponse.Content | ConvertFrom-Json
if ($paymentsData.data -and $paymentsData.data.length -gt 0) {
    $firstPayment = $paymentsData.data[0]
    $paymentId = $firstPayment.id
    Write-Host "`nFound test payment: $($firstPayment.paymentNumber) (ID: $paymentId)" -ForegroundColor Magenta
    
    # 10. Get payment by ID
    Test-Endpoint "Get Payment by ID" "GET" "/api/v1/payments/$paymentId"
}

# ============================================
# LEDGER MODULE TESTS
# ============================================

Write-Host "`n==========================================" -ForegroundColor Yellow
Write-Host "LEDGER MODULE" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow

if ($customerId) {
    # 11. Customer ledger
    Test-Endpoint "Customer Ledger" "GET" "/api/v1/ledger/customer/$customerId"
    
    # 12. Customer statement
    Test-Endpoint "Customer Statement" "GET" "/api/v1/ledger/customer/$customerId/statement"
}

# 13. Outstanding aging
Test-Endpoint "Outstanding Aging" "GET" "/api/v1/ledger/aging"

# ============================================
# OUTSTANDING MODULE TESTS
# ============================================

Write-Host "`n==========================================" -ForegroundColor Yellow
Write-Host "OUTSTANDING MODULE" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow

# 14. Outstanding invoices
Test-Endpoint "Outstanding Invoices" "GET" "/api/v1/outstanding?page=1&limit=10"

# 15. Outstanding summary
Test-Endpoint "Outstanding Summary" "GET" "/api/v1/outstanding/summary"

# 16. Outstanding aging
Test-Endpoint "Outstanding Aging Report" "GET" "/api/v1/outstanding/aging"

# 17. Overdue invoices
Test-Endpoint "Overdue Invoices" "GET" "/api/v1/outstanding/overdue"

# 18. Collection efficiency
Test-Endpoint "Collection Efficiency" "GET" "/api/v1/outstanding/collection-efficiency"

if ($customerId) {
    # 19. Customer outstanding
    Test-Endpoint "Customer Outstanding" "GET" "/api/v1/outstanding/customer/$customerId"
}

# ============================================
# AR ANALYTICS TESTS
# ============================================

Write-Host "`n==========================================" -ForegroundColor Yellow
Write-Host "AR ANALYTICS" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow

# 20. Collection trend
Test-Endpoint "AR Collection Trend" "GET" "/api/v1/analytics/ar/collection-trend?interval=monthly"

# 21. Monthly collection
Test-Endpoint "AR Monthly Collection" "GET" "/api/v1/analytics/ar/monthly-collection"

# 22. Daily collection
Test-Endpoint "AR Daily Collection" "GET" "/api/v1/analytics/ar/daily-collection"

# 23. Top paying customers
Test-Endpoint "Top Paying Customers" "GET" "/api/v1/analytics/ar/top-paying-customers?limit=5"

# 24. Outstanding aging
Test-Endpoint "AR Outstanding Aging" "GET" "/api/v1/analytics/ar/outstanding-aging"

# 25. Payment method analytics
Test-Endpoint "AR Payment Method Analytics" "GET" "/api/v1/analytics/ar/payment-method-analytics"

# 26. Collection forecast
Test-Endpoint "AR Collection Forecast" "GET" "/api/v1/analytics/ar/collection-forecast?months=6"

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "ALL TESTS COMPLETED" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green