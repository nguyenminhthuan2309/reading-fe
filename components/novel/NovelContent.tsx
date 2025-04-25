import { useEffect, useState } from 'react';
import '@/styles/rich-text.css';

interface NovelContentProps {
  content?: string;
  className?: string;
}

/**
 * Extract plain text from the content (for use in flip books or where HTML isn't supported)
 */
export function extractTextContent(content: string): string[] {
  if (!content) return [];
  
  // Try to parse as JSON
  try {
    const jsonContent = JSON.parse(content);
    
    // Handle Tiptap JSON structure
    if (jsonContent.type === 'doc' && jsonContent.content) {
      // For Tiptap JSON, extract text content from each node
      const contentArray: string[] = [];
      
      const processNode = (node: any): string => {
        if (!node) return '';
        
        // Handle different node types
        if (node.type === 'text') {
          return node.text || '';
        }
        
        // For nodes with content, recursively process
        if (node.content && Array.isArray(node.content)) {
          return node.content.map(processNode).join('');
        }
        
        return '';
      };
      
      // Process each top-level node
      jsonContent.content.forEach((node: any) => {
        if (node.type === 'paragraph' || 
            node.type === 'heading' || 
            node.type === 'listItem' ||
            node.type === 'tableCell' ||
            node.type === 'tableHeader') {
          contentArray.push(processNode(node));
        } else if (node.type === 'bulletList' || 
                   node.type === 'orderedList' || 
                   node.type === 'blockquote' ||
                   node.type === 'table' ||
                   node.type === 'tableRow') {
          // For container nodes, extract each item as separate entry
          if (node.content && Array.isArray(node.content)) {
            node.content.forEach((childNode: any) => {
              contentArray.push(processNode(childNode));
            });
          }
        }
      });
      
      return contentArray.filter(text => text.trim() !== '');
    }
  } catch (e) {
    // Not JSON, continue with other formats
  }
  
  // Check if content is HTML
  if (content.trim().startsWith('<')) {
    // Convert HTML to text chunks for pages
    if (typeof window !== 'undefined') {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      
      // Extract text from each top-level element
      const elements = Array.from(tempDiv.children);
      return elements.map(el => el.textContent || '').filter(text => text.trim() !== '');
    }
  }
  
  // If not JSON or HTML, treat as plain text with paragraph breaks
  return content.split("\n\n").filter(text => text.trim() !== '');
}

/**
 * NovelContent - A component for rendering novel content from various formats (JSON, HTML, plain text)
 * 
 * @param content The content to render (JSON string, HTML, or plain text)
 * @param className Additional CSS classes to apply
 */
export default function NovelContent({ content, className = '' }: NovelContentProps) {
  const [renderedContent, setRenderedContent] = useState<string>('');
  
  useEffect(() => {
    if (!content) {
      setRenderedContent('');
      return;
    }
    
    // Try to parse as JSON
    try {
      const jsonContent = JSON.parse(content);
      
      // If it's a Tiptap JSON structure
      if (jsonContent.type === 'doc' && jsonContent.content) {
        const html = renderJsonContent(jsonContent);
        setRenderedContent(html);
        return;
      }
    } catch (e) {
      // Not JSON, continue with other formats
    }
    
    // Check if content is HTML
    if (content.trim().startsWith('<') && 
        (content.includes('</p>') || 
         content.includes('</h1>') || 
         content.includes('</h2>') || 
         content.includes('</ul>') || 
         content.includes('</ol>') ||
         content.includes('</table>'))) {
      // It's already HTML, use as is
      setRenderedContent(content);
      return;
    }
    
    // If it's plain text, convert to HTML paragraphs
    const paragraphs = content.split("\n\n");
    const html = paragraphs
      .map(para => `<p>${para.replace(/\n/g, '<br/>')}</p>`)
      .join('');
    
    setRenderedContent(html);
  }, [content]);
  
  /**
   * Converts Tiptap JSON structure to HTML
   */
  const renderJsonContent = (json: any): string => {
    if (!json || !json.content) return '';
    
    // Basic implementation to render the JSON content
    let contentHtml = '';
    
    const renderMarks = (text: string, marks: any[] = []): string => {
      if (!marks || !marks.length) return text;
      
      let result = text;
      marks.forEach(mark => {
        if (mark.type === 'bold') {
          result = `<strong>${result}</strong>`;
        } else if (mark.type === 'italic') {
          result = `<em>${result}</em>`;
        } else if (mark.type === 'code') {
          result = `<code>${result}</code>`;
        }
      });
      
      return result;
    };
    
    const renderNode = (node: any): string => {
      if (!node) return '';
      
      // Helper function to get alignment attributes
      const getAlignmentStyle = (node: any): string => {
        if (node.attrs && node.attrs.textAlign && node.attrs.textAlign !== 'left') {
          return ` style="text-align: ${node.attrs.textAlign};"`;
        }
        return '';
      };
      
      if (node.type === 'text') {
        return renderMarks(node.text || '', node.marks || []);
      }
      
      if (node.type === 'paragraph') {
        const content = node.content ? node.content.map(renderNode).join('') : '';
        return `<p${getAlignmentStyle(node)}>${content}</p>`;
      }
      
      if (node.type === 'heading') {
        const level = node.attrs?.level || 1;
        const content = node.content ? node.content.map(renderNode).join('') : '';
        return `<h${level}${getAlignmentStyle(node)}>${content}</h${level}>`;
      }
      
      if (node.type === 'bulletList') {
        const items = node.content ? node.content.map(renderNode).join('') : '';
        return `<ul>${items}</ul>`;
      }
      
      if (node.type === 'orderedList') {
        const items = node.content ? node.content.map(renderNode).join('') : '';
        return `<ol>${items}</ol>`;
      }
      
      if (node.type === 'listItem') {
        const content = node.content ? node.content.map(renderNode).join('') : '';
        return `<li>${content}</li>`;
      }
      
      if (node.type === 'blockquote') {
        const content = node.content ? node.content.map(renderNode).join('') : '';
        return `<blockquote${getAlignmentStyle(node)}>${content}</blockquote>`;
      }
      
      // Table handling
      if (node.type === 'table') {
        const content = node.content ? node.content.map(renderNode).join('') : '';
        return `<div class="table-wrapper"><table class="tiptap-table">${content}</table></div>`;
      }
      
      if (node.type === 'tableRow') {
        const content = node.content ? node.content.map(renderNode).join('') : '';
        return `<tr>${content}</tr>`;
      }
      
      if (node.type === 'tableHeader') {
        const content = node.content ? node.content.map(renderNode).join('') : '';
        return `<th${getAlignmentStyle(node)}>${content}</th>`;
      }
      
      if (node.type === 'tableCell') {
        const content = node.content ? node.content.map(renderNode).join('') : '';
        return `<td${getAlignmentStyle(node)}>${content}</td>`;
      }
      
      // Recursively process content if available
      if (node.content && Array.isArray(node.content)) {
        return node.content.map(renderNode).join('');
      }
      
      return '';
    };
    
    json.content.forEach((node: any) => {
      contentHtml += renderNode(node);
    });
    
    return contentHtml;
  };
  
  return (
    <div 
      className={`rich-text ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
} 