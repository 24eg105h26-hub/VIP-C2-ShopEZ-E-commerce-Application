@REM ShopEZ HTML to PDF Converter using Chrome/Edge
@REM This batch script converts HTML files to PDF using Chrome/Edge headless mode

@echo off
setlocal enabledelayedexpansion

set "HTMLDIR=C:\kailash\kailash\MERN phase wise"
set "EDGEPATH=C:\Program Files\Microsoft\Edge\Application\msedge.exe"

if not exist "!EDGEPATH!" (
    echo ERROR: Microsoft Edge not found at !EDGEPATH!
    echo Please install Microsoft Edge or update the path in this script.
    pause
    exit /b 1
)

echo ============================================================
echo ShopEZ HTML to PDF Converter
echo ============================================================
echo.
echo Microsoft Edge conversion will now start...
echo HTML directory: !HTMLDIR!
echo.

cd /d "!HTMLDIR!"

set "count=0"
set "success=0"

for /r %%F in (*.html) do (
    set /a count+=1
    set "htmlfile=%%F"
    set "pdffile=!htmlfile:.html=.pdf!"
    
    echo Converting: %%~nF
    
    "!EDGEPATH!" --headless --disable-gpu --print-to-pdf="!pdffile!" "!htmlfile!" > nul 2>&1
    
    if exist "!pdffile!" (
        echo   + Success: !pdffile!
        set /a success+=1
    ) else (
        echo   - Failed to convert
    )
)

echo.
echo ============================================================
echo Conversion Summary:
echo   Total files: !count!
echo   Successful: !success!
echo   Failed: !count-success!
echo ============================================================
echo.
echo PDF files are ready in: !HTMLDIR!
echo.
pause
