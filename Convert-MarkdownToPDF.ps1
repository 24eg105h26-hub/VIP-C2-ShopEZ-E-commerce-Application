$ErrorActionPreference = "SilentlyContinue"

# ShopEZ Markdown to PDF Converter using Microsoft Word
# This script converts markdown files to PDFs using Word's COM object

$docDir = "C:\kailash\kailash\MERN phase wise"
$wordFile = $null
$word = $null

try {
    # Create Word COM object
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    
    # Find all markdown files
    $mdFiles = Get-ChildItem -Path $docDir -Filter "*.md" -File
    
    Write-Host "=" -ForegroundColor Cyan
    Write-Host "ShopEZ Markdown to PDF Converter" -ForegroundColor Cyan
    Write-Host "=" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Found $($mdFiles.Count) markdown files`n" -ForegroundColor Green
    
    $success = 0
    $failed = 0
    
    foreach ($file in $mdFiles) {
        Write-Host "Converting: $($file.Name)..." -NoNewline
        
        try {
            # Read markdown file
            $content = Get-Content $file.FullName -Raw
            
            # Create new Word document
            $doc = $word.Documents.Add()
            
            # Add content to document
            $doc.Content.Text = $content
            
            # Set document formatting
            $doc.Range.Font.Name = "Calibri"
            $doc.Range.Font.Size = 11
            $doc.Range.LineSpacing = 1.2
            
            # Set page setup
            With-Object ($doc.PageSetup) {
                .TopMargin = [single]72 # 1 inch
                .BottomMargin = [single]72
                .LeftMargin = [single]72
                .RightMargin = [single]72
            }
            
            # Save as PDF
            $pdfPath = [System.IO.Path]::ChangeExtension($file.FullName, ".pdf")
            $doc.SaveAs($pdfPath, 17) # 17 = Word.WdSaveFormat.wdFormatPDF
            
            $doc.Close($false)
            
            Write-Host " ✓" -ForegroundColor Green
            $success++
        }
        catch {
            Write-Host " ✗ Error: $_" -ForegroundColor Red
            $failed++
            if ($doc) { $doc.Close($false) }
        }
    }
    
    # Also convert the master document
    $txtFile = Join-Path $docDir "ShopEZ_Complete_Professional_Documentation.txt"
    if (Test-Path $txtFile) {
        Write-Host "Converting: ShopEZ_Complete_Professional_Documentation.txt..." -NoNewline
        try {
            $content = Get-Content $txtFile -Raw
            $doc = $word.Documents.Add()
            $doc.Content.Text = $content
            
            $doc.Range.Font.Name = "Calibri"
            $doc.Range.Font.Size = 11
            $doc.Range.LineSpacing = 1.2
            
            With-Object ($doc.PageSetup) {
                .TopMargin = [single]72
                .BottomMargin = [single]72
                .LeftMargin = [single]72
                .RightMargin = [single]72
            }
            
            $pdfPath = Join-Path $docDir "ShopEZ_Complete_Professional_Documentation.pdf"
            $doc.SaveAs($pdfPath, 17)
            $doc.Close($false)
            
            Write-Host " ✓" -ForegroundColor Green
            $success++
        }
        catch {
            Write-Host " ✗ Error: $_" -ForegroundColor Red
            $failed++
            if ($doc) { $doc.Close($false) }
        }
    }
    
    Write-Host ""
    Write-Host "=" -ForegroundColor Cyan
    Write-Host "Conversion Complete!" -ForegroundColor Cyan
    Write-Host "=" -ForegroundColor Cyan
    Write-Host "  ✓ Success: $success files" -ForegroundColor Green
    Write-Host "  ✗ Failed: $failed files" -ForegroundColor Red
    Write-Host ""
    Write-Host "PDF files saved to: $docDir" -ForegroundColor Yellow
    Write-Host ""
}
catch {
    Write-Host "ERROR: Could not create Word COM object" -ForegroundColor Red
    Write-Host "Please ensure Microsoft Word is installed on this system" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
finally {
    # Clean up
    if ($word) {
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
        [System.GC]::Collect()
        [System.GC]::WaitForPendingFinalizers()
    }
}
