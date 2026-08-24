$ErrorActionPreference = "Continue"

$CLOUD_NAME = "nyjavsnw"
$UPLOAD_PRESET = "newseson"
$SUPABASE_URL = "https://dfnobqwqkcxtzupqohno.supabase.co"
$SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmbm9icXdxa2N4dHp1cHFvaG5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NjEyNzEsImV4cCI6MjEwMzEzNzI3MX0.98940bFi_ePFsYlu_e7dJPvaVmzFYyIXymdsbmPuLAk"

Add-Type -AssemblyName System.Net.Http
$httpClient = [System.Net.Http.HttpClient]::new()
$httpClient.Timeout = [TimeSpan]::FromSeconds(120)

$folder = "C:\Users\Admin\Documents\ew seson\المنتجات"
$files = Get-ChildItem "$folder\*.jpeg" | Sort-Object Name

$groups = @{}
foreach($f in $files) {
    $baseName = $f.BaseName
    $baseName = $baseName -replace ' \(\d+\)$', ''
    if(-not $groups.ContainsKey($baseName)) {
        $groups[$baseName] = @()
    }
    $groups[$baseName] += $f.FullName
}

$categories = @("T-Shirts","Pants","Hoodies","Jackets","Tracksuits")
$counter = 0
$total = $groups.Count

Write-Host "Total products to upload: $total"

foreach($key in ($groups.Keys | Sort-Object)) {
    $counter++
    $imgs = $groups[$key]
    $uploadedUrls = @()
    
    Write-Host "`n[$counter/$total] Uploading: $key ($($imgs.Count) images)"
    
    foreach($imgPath in $imgs) {
        try {
            $fileContent = [System.Net.Http.ByteArrayContent]::new([System.IO.File]::ReadAllBytes($imgPath))
            $fileContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::new("image/jpeg")
            
            $form = [System.Net.Http.MultipartFormDataContent]::new()
            $form.Add($fileContent, "file", [System.IO.Path]::GetFileName($imgPath))
            $form.Add([System.Net.Http.StringContent]::new($UPLOAD_PRESET), "upload_preset")
            
            $response = $httpClient.PostAsync("https://api.cloudinary.com/v1_1/$CLOUD_NAME/image/upload", $form).Result
            $json = $response.Content.ReadAsStringAsync().Result
            $result = $json | ConvertFrom-Json
            
            if($result.secure_url) {
                $uploadedUrls += $result.secure_url
                Write-Host "  OK: $([System.IO.Path]::GetFileName($imgPath))"
            } else {
                Write-Host "  FAIL: $([System.IO.Path]::GetFileName($imgPath)) - $($result.error.message)"
            }
        } catch {
            Write-Host "  ERROR: $([System.IO.Path]::GetFileName($imgPath)) - $($_.Exception.Message)"
        }
    }
    
    if($uploadedUrls.Count -gt 0) {
        $catIndex = ($counter - 1) % $categories.Count
        $body = @{
            brand = "New Season"
            name = "Product $counter"
            price = 12
            category = $categories[$catIndex]
            img = $uploadedUrls[0]
            images = $uploadedUrls
            description = "Premium streetwear from New Season collection"
        } | ConvertTo-Json -Depth 5
        
        $headers = New-Object System.Collections.Generic.Dictionary[[string],[string]]
        $headers.Add("apikey", $SUPABASE_KEY)
        $headers.Add("Authorization", "Bearer $SUPABASE_KEY")
        $headers.Add("Content-Type", "application/json")
        $headers.Add("Prefer", "return=representation")
        
        try {
            $req = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::Post, "$SUPABASE_URL/rest/v1/products")
            $req.Content = [System.Net.Http.StringContent]::new($body, [System.Text.Encoding]::UTF8, "application/json")
            foreach($h in $headers.Keys) { $req.Headers.TryAddWithoutValidation($h, $headers[$h]) | Out-Null }
            
            $resp = $httpClient.SendAsync($req).Result
            $respBody = $resp.Content.ReadAsStringAsync().Result
            if($resp.IsSuccessStatusCode) {
                Write-Host "  => Supabase OK"
            } else {
                Write-Host "  => Supabase FAIL: $respBody"
            }
        } catch {
            Write-Host "  => Supabase ERROR: $($_.Exception.Message)"
        }
    }
}

Write-Host "`nDONE! Uploaded $counter products."