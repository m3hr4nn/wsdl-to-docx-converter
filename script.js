<script>
        let currentWSDL = null;
        let parsedData = null;

        // File upload handling
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const fileInfo = document.getElementById('fileInfo');
        const generateBtn = document.getElementById('generateBtn');
        const status = document.getElementById('status');
        const preview = document.getElementById('preview');

        // Drag and drop functionality
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFile(files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFile(e.target.files[0]);
            }
        });

        function handleFile(file) {
            if (!file.name.toLowerCase().endsWith('.wsdl') && !file.name.toLowerCase().endsWith('.xml')) {
                showStatus('Please select a WSDL or XML file.', 'error');
                return;
            }

            // Show file info
            document.getElementById('fileName').textContent = file.name;
            document.getElementById('fileSize').textContent = `Size: ${(file.size / 1024).toFixed(2)} KB`;
            fileInfo.style.display = 'block';

            // Read file
            const reader = new FileReader();
            reader.onload = (e) => {
                currentWSDL = e.target.result;
                parseWSDL(currentWSDL);
            };
            reader.readAsText(file);
        }

        function parseWSDL(wsdlContent) {
            try {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(wsdlContent, 'text/xml');
                
                // Check for parsing errors
                const parserError = xmlDoc.querySelector('parsererror');
                if (parserError) {
                    throw new Error('Invalid XML format');
                }

                // Extract WSDL components
                const definitions = xmlDoc.querySelector('definitions') || xmlDoc.documentElement;
                const types = xmlDoc.querySelectorAll('types, schema');
                const messages = xmlDoc.querySelectorAll('message');
                const portTypes = xmlDoc.querySelectorAll('portType');
                const bindings = xmlDoc.querySelectorAll('binding');
                const services = xmlDoc.querySelectorAll('service');

                parsedData = {
                    rootElement: definitions ? definitions.tagName : 'definitions',
                    targetNamespace: definitions ? definitions.getAttribute('targetNamespace') : 'Not specified',
                    types: Array.from(types).map(type => ({
                        name: type.getAttribute('name') || 'Unnamed Type',
                        elements: Array.from(type.querySelectorAll('element')).map(el => el.getAttribute('name')).filter(Boolean)
                    })),
                    messages: Array.from(messages).map(msg => ({
                        name: msg.getAttribute('name') || 'Unnamed Message',
                        parts: Array.from(msg.querySelectorAll('part')).map(part => ({
                            name: part.getAttribute('name'),
                            element: part.getAttribute('element'),
                            type: part.getAttribute('type')
                        }))
                    })),
                    portTypes: Array.from(portTypes).map(pt => ({
                        name: pt.getAttribute('name') || 'Unnamed PortType',
                        operations: Array.from(pt.querySelectorAll('operation')).map(op => ({
                            name: op.getAttribute('name'),
                            input: op.querySelector('input')?.getAttribute('message'),
                            output: op.querySelector('output')?.getAttribute('message')
                        }))
                    })),
                    bindings: Array.from(bindings).map(binding => ({
                        name: binding.getAttribute('name') || 'Unnamed Binding',
                        type: binding.getAttribute('type'),
                        transport: binding.querySelector('soap\\:binding, http\\:binding')?.getAttribute('transport') || 'Not specified'
                    })),
                    services: Array.from(services).map(service => ({
                        name: service.getAttribute('name') || 'Unnamed Service',
                        ports: Array.from(service.querySelectorAll('port')).map(port => ({
                            name: port.getAttribute('name'),
                            binding: port.getAttribute('binding'),
                            address: port.querySelector('soap\\:address, http\\:address')?.getAttribute('location')
                        }))
                    }))
                };

                showPreview();
                generateBtn.disabled = false;
                showStatus('WSDL file parsed successfully!', 'success');

            } catch (error) {
                showStatus(`Error parsing WSDL: ${error.message}`, 'error');
                generateBtn.disabled = true;
                preview.style.display = 'none';
            }
        }

        function showPreview() {
            const previewContent = document.getElementById('previewContent');
            let html = '';

            html += `<strong>Root Element:</strong> ${parsedData.rootElement}<br>`;
            html += `<strong>Target Namespace:</strong> ${parsedData.targetNamespace}<br><br>`;

            if (parsedData.types.length > 0) {
                html += `<strong>Types:</strong> ${parsedData.types.length} found<br>`;
            }

            if (parsedData.messages.length > 0) {
                html += `<strong>Messages:</strong> ${parsedData.messages.length} found<br>`;
            }

            if (parsedData.portTypes.length > 0) {
                html += `<strong>Port Types:</strong> ${parsedData.portTypes.length} found<br>`;
            }

            if (parsedData.bindings.length > 0) {
                html += `<strong>Bindings:</strong> ${parsedData.bindings.length} found<br>`;
            }

            if (parsedData.services.length > 0) {
                html += `<strong>Services:</strong> ${parsedData.services.length} found<br>`;
                html += '<ul>';
                parsedData.services.forEach(service => {
                    html += `<li>${service.name}</li>`;
                });
                html += '</ul>';
            }

            previewContent.innerHTML = html;
            preview.style.display = 'block';
        }

        function showStatus(message, type) {
            status.textContent = message;
            status.className = `status ${type}`;
            status.style.display = 'block';
            
            if (type === 'success') {
                setTimeout(() => {
                    status.style.display = 'none';
                }, 3000);
            }
        }

        async function generateDocument() {
            if (!parsedData) return;

            try {
                showStatus('Generating document...', 'info');
                generateBtn.innerHTML = '<span class="loading"></span>Generating...';
                generateBtn.disabled = true;

                // Create a simple DOCX template
                const content = generateDocumentContent();
                
                // Create a basic XML structure for DOCX
                const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                    <w:body>
                        ${content}
                    </w:body>
                </w:document>`;

                // Create DOCX file structure using JSZip
                const zip = new JSZip();
                
                // Add required files
                zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
                    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
                    <Default Extension="xml" ContentType="application/xml"/>
                    <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
                    <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
                </Types>`);

                zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
                    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
                    <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="word/styles.xml"/>
                </Relationships>`);

                zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
                    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
                </Relationships>`);

                // Add styles for headings
                zip.file('word/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                    <w:style w:type="paragraph" w:styleId="Heading1">
                        <w:name w:val="heading 1"/>
                        <w:basedOn w:val="Normal"/>
                        <w:next w:val="Normal"/>
                        <w:pPr>
                            <w:keepNext/>
                            <w:keepLines/>
                            <w:spacing w:before="480" w:after="0"/>
                        </w:pPr>
                        <w:rPr>
                            <w:rFonts w:ascii="Calibri Light" w:hAnsi="Calibri Light"/>
                            <w:b/>
                            <w:sz w:val="32"/>
                            <w:color w:val="2F5496"/>
                        </w:rPr>
                    </w:style>
                    <w:style w:type="paragraph" w:styleId="Heading2">
                        <w:name w:val="heading 2"/>
                        <w:basedOn w:val="Normal"/>
                        <w:next w:val="Normal"/>
                        <w:pPr>
                            <w:keepNext/>
                            <w:keepLines/>
                            <w:spacing w:before="200" w:after="0"/>
                        </w:pPr>
                        <w:rPr>
                            <w:rFonts w:ascii="Calibri Light" w:hAnsi="Calibri Light"/>
                            <w:b/>
                            <w:sz w:val="26"/>
                            <w:color w:val="2F5496"/>
                        </w:rPr>
                    </w:style>
                    <w:style w:type="paragraph" w:styleId="Heading3">
                        <w:name w:val="heading 3"/>
                        <w:basedOn w:val="Normal"/>
                        <w:next w:val="Normal"/>
                        <w:pPr>
                            <w:keepNext/>
                            <w:keepLines/>
                            <w:spacing w:before="200" w:after="0"/>
                        </w:pPr>
                        <w:rPr>
                            <w:rFonts w:ascii="Calibri Light" w:hAnsi="Calibri Light"/>
                            <w:b/>
                            <w:sz w:val="24"/>
                            <w:color w:val="1F4E79"/>
                        </w:rPr>
                    </w:style>
                    <w:style w:type="paragraph" w:styleId="Normal" w:default="1">
                        <w:name w:val="Normal"/>
                        <w:pPr>
                            <w:spacing w:after="120"/>
                        </w:pPr>
                        <w:rPr>
                            <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                            <w:sz w:val="22"/>
                        </w:rPr>
                    </w:style>
                </w:styles>`);

                zip.file('word/document.xml', docXml);

                // Generate and download
                const blob = await zip.generateAsync({type: 'blob'});
                saveAs(blob, 'wsdl-documentation.docx');

                showStatus('Document generated successfully!', 'success');
                generateBtn.innerHTML = 'Generate DOCX Document';
                generateBtn.disabled = false;

            } catch (error) {
                showStatus(`Error generating document: ${error.message}`, 'error');
                generateBtn.innerHTML = 'Generate DOCX Document';
                generateBtn.disabled = false;
            }
        }

        function generateDocumentContent() {
            let content = '';

            // Header 1: Root Element
            content += `<w:p>
                <w:pPr>
                    <w:pStyle w:val="Heading1"/>
                </w:pPr>
                <w:r>
                    <w:t>Root Element: ${parsedData.rootElement}</w:t>
                </w:r>
            </w:p>`;

            content += `<w:p>
                <w:r>
                    <w:t>Target Namespace: ${parsedData.targetNamespace}</w:t>
                </w:r>
            </w:p>`;

            // Header 2: Types
            content += `<w:p>
                <w:pPr>
                    <w:pStyle w:val="Heading2"/>
                </w:pPr>
                <w:r>
                    <w:t>Types</w:t>
                </w:r>
            </w:p>`;

            parsedData.types.forEach(type => {
                content += `<w:p>
                    <w:r>
                        <w:t>Type: ${type.name}</w:t>
                    </w:r>
                </w:p>`;
                
                if (type.elements.length > 0) {
                    type.elements.forEach(element => {
                        content += `<w:p>
                            <w:r>
                                <w:t>  - Element: ${element}</w:t>
                            </w:r>
                        </w:p>`;
                    });
                }
            });

            // Header 3: Messages
            content += `<w:p>
                <w:pPr>
                    <w:pStyle w:val="Heading3"/>
                </w:pPr>
                <w:r>
                    <w:t>Messages</w:t>
                </w:r>
            </w:p>`;

            parsedData.messages.forEach(message => {
                content += `<w:p>
                    <w:r>
                        <w:t>Message: ${message.name}</w:t>
                    </w:r>
                </w:p>`;
                
                message.parts.forEach(part => {
                    content += `<w:p>
                        <w:r>
                            <w:t>  - Part: ${part.name} (${part.element || part.type || 'No type specified'})</w:t>
                        </w:r>
                    </w:p>`;
                });
            });

            // Port Types
            content += `<w:p>
                <w:r>
                    <w:t>Port Types</w:t>
                </w:r>
            </w:p>`;

            parsedData.portTypes.forEach(portType => {
                content += `<w:p>
                    <w:r>
                        <w:t>PortType: ${portType.name}</w:t>
                    </w:r>
                </w:p>`;
                
                portType.operations.forEach(operation => {
                    content += `<w:p>
                        <w:r>
                            <w:t>  - Operation: ${operation.name}</w:t>
                        </w:r>
                    </w:p>`;
                    if (operation.input) {
                        content += `<w:p>
                            <w:r>
                                <w:t>    Input: ${operation.input}</w:t>
                            </w:r>
                        </w:p>`;
                    }
                    if (operation.output) {
                        content += `<w:p>
                            <w:r>
                                <w:t>    Output: ${operation.output}</w:t>
                            </w:r>
                        </w:p>`;
                    }
                });
            });

            // Bindings
            content += `<w:p>
                <w:r>
                    <w:t>Bindings</w:t>
                </w:r>
            </w:p>`;

            parsedData.bindings.forEach(binding => {
                content += `<w:p>
                    <w:r>
                        <w:t>Binding: ${binding.name}</w:t>
                    </w:r>
                </w:p>`;
                content += `<w:p>
                    <w:r>
                        <w:t>  - Type: ${binding.type}</w:t>
                    </w:r>
                </w:p>`;
                content += `<w:p>
                    <w:r>
                        <w:t>  - Transport: ${binding.transport}</w:t>
                    </w:r>
                </w:p>`;
            });

            // Services
            content += `<w:p>
                <w:r>
                    <w:t>Services</w:t>
                </w:r>
            </w:p>`;

            parsedData.services.forEach(service => {
                content += `<w:p>
                    <w:r>
                        <w:t>Service: ${service.name}</w:t>
                    </w:r>
                </w:p>`;
                
                service.ports.forEach(port => {
                    content += `<w:p>
                        <w:r>
                            <w:t>  - Port: ${port.name}</w:t>
                        </w:r>
                    </w:p>`;
                    if (port.binding) {
                        content += `<w:p>
                            <w:r>
                                <w:t>    Binding: ${port.binding}</w:t>
                            </w:r>
                        </w:p>`;
                    }
                    if (port.address) {
                        content += `<w:p>
                            <w:r>
                                <w:t>    Address: ${port.address}</w:t>
                            </w:r>
                        </w:p>`;
                    }
                });
            });

            // Services Summary at the end
            content += `<w:p>
                <w:pPr>
                    <w:pStyle w:val="Heading2"/>
                </w:pPr>
                <w:r>
                    <w:t>Services Summary</w:t>
                </w:r>
            </w:p>`;

            parsedData.services.forEach(service => {
                content += `<w:p>
                    <w:r>
                        <w:t>• ${service.name}</w:t>
                    </w:r>
                </w:p>`;
            });

            return content;
        }
    </script>
