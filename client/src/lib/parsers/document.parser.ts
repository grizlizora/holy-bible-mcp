import * as xlsx from 'xlsx';
import mammoth from 'mammoth';

export async function parseDocument(buffer: Buffer, mimeType: string, filename: string = ''): Promise<string> {
  try {
    if (mimeType === 'application/pdf') {
      try {
        const pdfParse = require('pdf-parse');
        const data = await pdfParse(buffer);
        return data.text || '';
      } catch (pdfErr) {
        console.warn('PDF parsing fallback:', pdfErr);
        return '';
      }
    } 
    
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mimeType === 'application/msword') {
      try {
        const result = await mammoth.extractRawText({ buffer });
        return result.value || '';
      } catch (docxErr) {
        console.warn('Word document parsing fallback:', docxErr);
        return '';
      }
    }
    
    if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || mimeType === 'application/vnd.ms-excel') {
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      let text = '';
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        text += `\n--- Sheet: ${sheetName} ---\n`;
        text += xlsx.utils.sheet_to_csv(sheet);
      }
      return text;
    }

    // Truncate text if it exceeds safe context limits (40,000 characters ~ 10,000 tokens)
    const MAX_SAFE_CHARS = 40000;
    let finalResult = '';

    const isTextMime = mimeType.startsWith('text/') || mimeType === 'application/json' || mimeType === 'application/xml';
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const codeExtensions = ['js', 'ts', 'py', 'go', 'rs', 'java', 'c', 'cpp', 'cs', 'php', 'rb', 'swift', 'kt', 'sql', 'sh', 'md', 'json', 'yml', 'yaml', 'xml', 'css', 'html', 'jsx', 'tsx'];
    
    if (isTextMime || codeExtensions.includes(ext)) {
      finalResult = buffer.toString('utf-8');
    }

    if (finalResult.length > MAX_SAFE_CHARS) {
      return finalResult.slice(0, MAX_SAFE_CHARS) + `\n\n[WARNING: Content of file "${filename}" was automatically truncated to the first 40,000 characters to prevent context window overflow].`;
    }

    return finalResult;
  } catch (error) {
    console.error('Error parsing document:', error);
    throw new Error('Failed to parse document');
  }
}
