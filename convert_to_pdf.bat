@echo off
REM Convert Markdown files to PDF using LibreOffice
REM This script converts all .md files in the MERN phase wise folder to PDF

echo ========================================
echo ShopEZ Markdown to PDF Converter
echo ========================================

cd "c:\kailash\kailash\MERN phase wise"

REM Check if LibreOffice is installed
if not exist "C:\Program Files\LibreOffice\program\soffice.exe" (
    echo.
    echo ERROR: LibreOffice not found!
    echo Please install LibreOffice from https://www.libreoffice.org/download/
    echo.
    pause
    exit /b 1
)

REM Convert each markdown file
echo.
echo Converting markdown files to PDF...
echo.

for %%F in (*.md) do (
    echo Converting: %%F
    REM Convert MD to DOCX first, then to PDF
    "C:\Program Files\LibreOffice\program\soffice.exe" --headless --convert-to docx --outdir "." "%%F" >nul 2>&1
    
    REM Get the base name without extension
    for /f "tokens=*" %%A in ('echo %%F ^| sed "s/\.md//"') do set "basename=%%A"
    
    REM Convert DOCX to PDF
    if exist "!basename!.docx" (
        "C:\Program Files\LibreOffice\program\soffice.exe" --headless --convert-to pdf --outdir "." "!basename!.docx" >nul 2>&1
        echo   ✓ Created: !basename!.pdf
        REM Delete the temporary DOCX file
        del "!basename!.docx" >nul 2>&1
    )
)

echo.
echo ========================================
echo Conversion Complete!
echo PDF files are ready in: c:\kailash\kailash\MERN phase wise\
echo ========================================
echo.
pause
