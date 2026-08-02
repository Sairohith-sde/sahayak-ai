import sys
import os

def mock_soffice():
    print("Mocking PDF conversion of PPTX using soffice...")
    args = sys.argv[1:]
    pptx_file = None
    for arg in args:
        if arg.endswith(".pptx"):
            pptx_file = arg
            break
            
    if not pptx_file:
        print("Error: No .pptx file specified.")
        sys.exit(1)
        
    pdf_file = pptx_file.replace(".pptx", ".pdf")
    # Touch the PDF file
    with open(pdf_file, "w") as f:
        f.write("%PDF-1.4 mock pdf content")
        
    print(f"Successfully generated mock PDF: {pdf_file}")
    sys.exit(0)

if __name__ == "__main__":
    mock_soffice()
