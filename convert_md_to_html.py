#!/usr/bin/env python3
"""
ShopEZ Markdown to HTML Converter
Converts markdown files to professional HTML documents
that can be printed to PDF from any browser
"""

import os
import sys
from pathlib import Path

def convert_md_to_html(md_file, output_dir):
    """Convert markdown file to professional HTML"""
    try:
        # Read markdown file
        with open(md_file, 'r', encoding='utf-8') as f:
            md_content = f.read()
        
        # Simple markdown to HTML conversion (basic)
        html_content = md_content
        
        # Convert markdown headers
        lines = html_content.split('\n')
        converted_lines = []
        
        for line in lines:
            if line.startswith('# '):
                converted_lines.append(f"<h1>{line[2:]}</h1>")
            elif line.startswith('## '):
                converted_lines.append(f"<h2>{line[3:]}</h2>")
            elif line.startswith('### '):
                converted_lines.append(f"<h3>{line[4:]}</h3>")
            elif line.startswith('- '):
                converted_lines.append(f"<li>{line[2:]}</li>")
            elif line.startswith('* '):
                converted_lines.append(f"<li>{line[2:]}</li>")
            elif line.strip() == '':
                converted_lines.append("</p><p>")
            else:
                converted_lines.append(line)
        
        html_body = '\n'.join(converted_lines)
        
        # Wrap in proper HTML with professional styling
        html_template = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{Path(md_file).stem}</title>
    <style>
        @page {{
            size: A4;
            margin: 1in;
        }}
        
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: Calibri, Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.2;
            color: #333;
            max-width: 8.5in;
            margin: 0 auto;
            padding: 1in;
            background: white;
        }}
        
        h1 {{
            font-size: 18pt;
            font-weight: bold;
            margin-top: 0;
            margin-bottom: 6pt;
            page-break-after: avoid;
            border-bottom: 2pt solid #003366;
            padding-bottom: 6pt;
        }}
        
        h2 {{
            font-size: 14pt;
            font-weight: bold;
            margin-top: 12pt;
            margin-bottom: 6pt;
            page-break-after: avoid;
            color: #003366;
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
            text-align: justify;
        }}
        
        ul, ol {{
            margin-left: 18pt;
            margin-bottom: 6pt;
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
            border-radius: 3pt;
        }}
        
        pre {{
            background-color: #f5f5f5;
            padding: 10pt;
            border-left: 3pt solid #003366;
            margin-bottom: 6pt;
            overflow-x: auto;
            font-family: 'Courier New', monospace;
            font-size: 10pt;
        }}
        
        blockquote {{
            border-left: 4pt solid #003366;
            margin-left: 0;
            padding-left: 10pt;
            margin-bottom: 6pt;
            font-style: italic;
        }}
        
        .page-break {{
            page-break-before: always;
        }}
        
        @media print {{
            body {{
                margin: 0;
                padding: 1in;
            }}
            
            h1 {{
                page-break-after: avoid;
            }}
            
            h2 {{
                page-break-after: avoid;
            }}
        }}
    </style>
</head>
<body>
    {html_body}
</body>
</html>
"""
        
        # Save HTML file
        html_filename = Path(output_dir) / f"{Path(md_file).stem}.html"
        with open(html_filename, 'w', encoding='utf-8') as f:
            f.write(html_template)
        
        return True, str(html_filename)
    
    except Exception as e:
        return False, str(e)

def main():
    # Set working directory
    base_dir = Path("c:/kailash/kailash/MERN phase wise")
    
    if not base_dir.exists():
        print(f"ERROR: Directory not found: {base_dir}")
        sys.exit(1)
    
    # Find all markdown files recursively
    md_files = list(base_dir.rglob("*.md"))
    
    if not md_files:
        print(f"No markdown files found in {base_dir}")
        sys.exit(1)
    
    print("=" * 60)
    print("ShopEZ Markdown to HTML Converter")
    print("=" * 60)
    print()
    print(f"Converting {len(md_files)} markdown files to HTML...\n")
    
    success_count = 0
    failed_count = 0
    
    for md_file in sorted(md_files):
        print(f"Converting: {md_file.name}...", end=" ")
        # Use the file's parent directory as output
        output_dir = md_file.parent
        success, result = convert_md_to_html(str(md_file), output_dir)
        
        if success:
            print(f"✓")
            success_count += 1
        else:
            print(f"✗ Error: {result}")
            failed_count += 1
    
    # Also convert the TXT master document
    txt_file = base_dir / "ShopEZ_Complete_Professional_Documentation.txt"
    if txt_file.exists():
        print(f"Converting: {txt_file.name}...", end=" ")
        success, result = convert_md_to_html(str(txt_file), base_dir)
        if success:
            print(f"✓")
            success_count += 1
        else:
            print(f"✗ Error: {result}")
            failed_count += 1
    
    print()
    print("=" * 60)
    print(f"Conversion Complete!")
    print(f"  ✓ Success: {success_count} HTML files created")
    print(f"  ✗ Failed: {failed_count} files")
    print("=" * 60)
    print()
    print("📄 HTML FILES READY FOR PDF EXPORT:")
    print()
    print("   To convert HTML to PDF:")
    print("   1. Open any HTML file in your web browser")
    print("   2. Press Ctrl+P (or right-click → Print)")
    print("   3. Change printer to 'Print to File (PDF)' or 'Save as PDF'")
    print("   4. Ensure margins are set to 1 inch (25.4mm)")
    print("   5. Click 'Save' or 'Print'")
    print()
    print(f"   HTML files location: {base_dir} (and subdirectories)")
    print()

if __name__ == "__main__":
    main()
