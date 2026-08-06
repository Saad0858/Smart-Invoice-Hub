$body = @{email='admin@billflow.com'; password='admin123'} | ConvertTo-Json
$response = Invoke-WebRequest -Uri 'http://localhost:3000/api/v1/auth/login' -Method POST -Headers @{'Content-Type'='application/json'} -Body $body -UseBasicParsing
$response.Content | Out-File -FilePath 'd:\Smart_Invioce_Hub\login_response.json' -Encoding UTF8
Write-Host "Login Response: $($response.Content)"