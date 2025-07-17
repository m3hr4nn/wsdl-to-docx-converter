# WSDL to DOCX Converter

A web application that converts WSDL (Web Services Description Language) files into structured Word documents.
<a href="https://m3hr4nn.github.io/wsdl-to-docx-converter" target="(https://m3hr4nn.github.io/wsdl-to-docx-converter/)">https://m3hr4nn.github.io/wsdl-to-docx-converter</a>

## Features

- Upload WSDL files via drag & drop or file selection
- Parse WSDL components (Types, Messages, Port Types, Bindings, Services)
- Generate formatted Word documents with proper heading structure
- Live preview of WSDL structure before generation
- Modern, responsive user interface

## Usage

1. Open `index.html` in a web browser
2. Upload your WSDL file by dragging it to the upload area or clicking "Choose File"
3. Review the parsed structure in the preview
4. Click "Generate DOCX Document" to create and download the Word file

## Document Structure

The generated Word document includes:
- **Header 1**: Root Element with target namespace
- **Header 2**: Types section
- **Header 3**: Messages section
- **Regular text**: Port Types, Bindings, and Services
- **Header 2**: Services Summary at the end

## Technologies Used

- HTML5
- CSS3 (Modern styling with gradients and animations)
- JavaScript (ES6+)
- JSZip (for DOCX generation)
- FileSaver.js (for file downloads)

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Live Demo

Simply open https://m3hr4nn.github.io/wsdl-to-docx-converter/ in your browser to use the application.

## License

MIT License - see LICENSE file for details
