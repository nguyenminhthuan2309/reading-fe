import { useState } from 'react';
import mammoth from 'mammoth';
import { generateJSON } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';

interface ConversionResult {
  success: boolean;
  content: string;
  error?: string;
}

/**
 * Hook for converting uploaded documents to TipTap JSON format
 * 
 * @returns {Object} Methods and state for document conversion
 */
export default function useDocumentConverter() {
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<ConversionResult | null>(null);

  /**
   * Convert a plain text document to TipTap JSON format
   * 
   * @param text Plain text content
   * @returns Stringified JSON in TipTap format
   */
  const convertTextToJson = (text: string): string => {
    const paragraphs = text.split(/\n\s*\n/); // Split by empty lines
    
    // Create a TipTap document structure
    const doc = {
      type: 'doc',
      content: paragraphs
        .filter(p => p.trim().length > 0) // Filter out empty paragraphs
        .map(p => {
          // Check if paragraph might be a heading (simple heuristic)
          if (p.startsWith('# ') && p.length < 100) {
            return {
              type: 'heading',
              attrs: { level: 1 },
              content: [{ type: 'text', text: p.substring(2).trim() }]
            };
          } else if (p.startsWith('## ') && p.length < 100) {
            return {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: p.substring(3).trim() }]
            };
          } else if (p.trim().startsWith('* ') || p.trim().startsWith('- ')) {
            // Simple bullet list detection
            const items = p.split(/\n/).filter(line => 
              line.trim().startsWith('* ') || line.trim().startsWith('- ')
            );
            
            return {
              type: 'bulletList',
              content: items.map(item => ({
                type: 'listItem',
                content: [{
                  type: 'paragraph',
                  content: [{ 
                    type: 'text', 
                    text: item.trim().substring(2).trim() 
                  }]
                }]
              }))
            };
          } else if (p.trim().startsWith('> ')) {
            // Simple blockquote detection
            return {
              type: 'blockquote',
              content: [{
                type: 'paragraph',
                content: [{ 
                  type: 'text', 
                  text: p.trim().substring(2).trim() 
                }]
              }]
            };
          } else {
            // Regular paragraph
            const lines = p.split('\n').map(line => line.trim()).join(' ');
            return {
              type: 'paragraph',
              content: [{ type: 'text', text: lines }]
            };
          }
        })
    };
    
    return JSON.stringify(doc);
  };

  /**
   * Convert HTML content to TipTap JSON format using TipTap's generateJSON
   */
  const convertHtmlToJson = (html: string): string => {
    // Use TipTap's built-in function to convert HTML to JSON
    const json = generateJSON(html, [
      StarterKit,
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'tiptap-table',
        },
      }),
      TableRow,
      TableCell,
      TableHeader,
      TextAlign.configure({
        types: ['heading', 'paragraph', 'blockquote', 'tableCell', 'tableHeader'],
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'left',
      }),
    ]);
    
    return JSON.stringify(json);
  };

  /**
   * Convert uploaded file to TipTap JSON format
   */
  const convertFileToJson = async (file: File): Promise<ConversionResult> => {
    try {
      setIsConverting(true);
      
      // Check file type
      const fileType = file.type;
      let content = '';
      
      if (fileType === 'text/plain') {
        // Handle plain text files
        content = await file.text();
        const jsonContent = convertTextToJson(content);
        
        const result = { success: true, content: jsonContent };
        setLastResult(result);
        return result;
      } else if (fileType === 'application/pdf') {
        // For PDF, we'd use a PDF parsing library
        // This is a placeholder - in a real implementation, you'd use a PDF parser
        const error = 'PDF conversion requires a PDF parsing library';
        setLastResult({ success: false, content: '', error });
        return { success: false, content: '', error };
      } else if (fileType.includes('word') || fileType.includes('openxmlformats-officedocument')) {
        // Convert Word document to HTML using mammoth
        try {
          // Create an ArrayBuffer from the file
          const arrayBuffer = await file.arrayBuffer();
          
          // Convert the document to HTML using mammoth
          const result = await mammoth.convertToHtml({ arrayBuffer });
          
          // Convert the HTML to TipTap JSON
          const jsonContent = convertHtmlToJson(result.value);
          
          // Check for any warnings
          const warnings = result.messages.length > 0 
            ? result.messages.map(m => m.message).join('; ')
            : undefined;
          
          const conversionResult = { 
            success: true, 
            content: jsonContent,
            error: warnings
          };
          
          setLastResult(conversionResult);
          return conversionResult;
        } catch (docxError) {
          const errorMessage = docxError instanceof Error ? docxError.message : String(docxError);
          const result = { success: false, content: '', error: `Failed to parse Word document: ${errorMessage}` };
          setLastResult(result);
          return result;
        }
      } else {
        // Unsupported file type
        const error = `Unsupported file type: ${fileType}`;
        setLastResult({ success: false, content: '', error });
        return { success: false, content: '', error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const result = { success: false, content: '', error: errorMessage };
      setLastResult(result);
      return result;
    } finally {
      setIsConverting(false);
    }
  };

  return {
    convertFileToJson,
    convertTextToJson,
    isConverting,
    lastResult
  };
} 