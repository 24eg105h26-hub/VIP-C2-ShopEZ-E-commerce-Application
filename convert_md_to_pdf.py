#!/usr/bin/env python3
"""
ShopEZ Markdown to PDF Converter
Converts all markdown files to professional PDFs with proper formatting
"""

import os
import sys
from pathlib import Path

# Try to install required packages if missing
try:
    from markdown import markdown
    from weasyprint import HTML, CSS
except ImportError:
    print("Installing required packages...")
    os.system("pip install -q markdown weasyprint")
    from markdown import markdown
    from weasyprint import HTML, CSS

def markdown_to_pdf(md_file, output_dir):
    """Convert a markdown file to PDF"""
    try:
        # Read markdown file
        with open(md_file, 'r', encoding='utf-8') as f:
            md_content = f.read()
        
        # Convert markdown to HTML
        html_content = markdown(md_content)
        
        # Create complete HTML document with professional styling
        html_template = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                @page {{
                    size: A4;
                    margin: 2.54cm;  /* 1 inch = 2.54cm */
                    padding: 0;
                }}
                body {{
                    font-family: Calibri, Arial, sans-serif;
                    font-size: 11pt;
                    line-height: 1.2;
                    color: #333;
                }}
                h1 {{
                    font-size: 18pt;
                    font-weight: bold;
                    margin-top: 0;
                    margin-bottom: 6pt;
                    page-break-after: avoid;
                }}
                h2 {{
                    font-size: 14pt;
                    font-weight: bold;
                    margin-top: 12pt;
                    margin-bottom: 6pt;
                    page-break-after: avoid;
                }}
                h3 {{
                    font-size: 12pt;
                    font-weight: bold;
                    margin-top: 9pt;
                    margin-bottom: 6pt;
                    page-break-after: avoid;
                }}
                p {{
                    margin-bottom: 6pt;
                    text-align: left;
                }}
                ul, ol {{
                    margin-bottom: 6pt;
                    margin-left: 18pt;
                }}
                li {{
                    margin-bottom: 3pt;
                }}
                table {{
                    border-collapse: collapse;
                    width: 100%;
                    margin-bottom: 6pt;
                }}
                th, td {{
                    border: 1pt solid #999;
                    padding: 6pt;
                    text-align: left;
                }}
                th {{
                    background-color: #f0f0f0;
                    font-weight: bold;
                }}
                code {{
                    background-color: #f5f5f5;
                    padding: 2pt 4pt;
                    font-family: 'Courier New', monospace;
                    font-size: 10pt;
                }}
                pre {{
                    background-color: #f5f5f5;
                    padding: 10pt;
                    border-left: 3pt solid #ccc;
                    margin-bottom: 6pt;
                    overflow-x: auto;
                }}
            </style>
        </head>
        <body>
            {html_content}
        </body>
        </html>
        """
        
        # Generate PDF
        pdf_filename = Path(output_dir) / f"{Path(md_file).stem}.pdf"
        HTML(string=html_template).write_pdf(str(pdf_filename))
        
        return True, str(pdf_filename)
    
    except Exception as e:
        return False, str(e)

def main():
    # Set working directory
    base_dir = Path("c:/kailash/kailash/MERN phase wise")
    
    if not base_dir.exists():
        print(f"ERROR: Directory not found: {base_dir}")
        sys.exit(1)
    
    # Find all markdown files
    md_files = list(base_dir.glob("*.md"))
    
    if not md_files:
        print(f"No markdown files found in {base_dir}")
        sys.exit(1)
    
    print("=" * 50)
    print("ShopEZ Markdown to PDF Converter")
    print("=" * 50)
    print()
    print(f"Found {len(md_files)} markdown files")
    print()
    
    success_count = 0
    failed_count = 0
    
    for md_file in sorted(md_files):
        print(f"Converting: {md_file.name}...", end=" ")
        success, result = markdown_to_pdf(str(md_file), base_dir)
        
        if success:
            print(f"✓ ({result})")
            success_count += 1
        else:
            print(f"✗ Error: {result}")
            failed_count += 1
    
    # Also convert the TXT master document
    txt_file = base_dir / "ShopEZ_Complete_Professional_Documentation.txt"
    if txt_file.exists():
        print()
        print(f"Converting: {txt_file.name}...", end=" ")
        # Read as markdown and convert
        success, result = markdown_to_pdf(str(txt_file), base_dir)
        if success:
            # Rename to proper name
            pdf_file = base_dir / "ShopEZ_Complete_Professional_Documentation.pdf"
            os.rename(result, str(pdf_file))
            print(f"✓ ({pdf_file.name})")
            success_count += 1
        else:
            print(f"✗ Error: {result}")
            failed_count += 1
    
    print()
    print("=" * 50)
    print(f"Conversion Complete!")
    print(f"  ✓ Success: {success_count} files")
    print(f"  ✗ Failed: {failed_count} files")
    print("=" * 50)
    print()
    print(f"PDF files saved to: {base_dir}")
    print()

if __name__ == "__main__":
    main()
