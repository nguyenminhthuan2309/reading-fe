import { useEffect, useState, useMemo } from 'react';
import '@/styles/rich-text.css';

interface NovelContentProps {
  content?: string;
  className?: string;
  highlightParagraph?: number;
  highlightWordStart?: number;
  highlightWordEnd?: number;
  onParagraphClick?: (index: number) => void;
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
 * @param highlightParagraph Index of paragraph to highlight (for text-to-speech)
 * @param highlightWordStart Start index of word to highlight
 * @param highlightWordEnd End index of word to highlight
 * @param onParagraphClick Callback when a paragraph is clicked
 */
export default function NovelContent({ 
  content, 
  className = '',
  highlightParagraph = -1,
  highlightWordStart = -1,
  highlightWordEnd = -1,
  onParagraphClick
}: NovelContentProps) {
  const [renderedContent, setRenderedContent] = useState<string>('');
  const [paragraphIds, setParagraphIds] = useState<string[]>([]);
  
  // Process content for rendering, adding IDs to paragraphs for highlighting
  useEffect(() => {
    if (!content) {
      setRenderedContent('');
      setParagraphIds([]);
      return;
    }
    
    // Try to parse as JSON
    try {
      const jsonContent = JSON.parse(content);
      
      // If it's a Tiptap JSON structure
      if (jsonContent.type === 'doc' && jsonContent.content) {
        const html = renderJsonContent(jsonContent);
        processAndSetContent(html);
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
      // It's already HTML, process it
      processAndSetContent(content);
      return;
    }
    
    // If it's plain text, convert to HTML paragraphs
    const paragraphs = content.split("\n\n");
    const html = paragraphs
      .map(para => `<p>${para.replace(/\n/g, '<br/>')}</p>`)
      .join('');
    
    processAndSetContent(html);
  }, [content]);
  
  /**
   * Process HTML content to add unique IDs to paragraphs for highlighting
   */
  const processAndSetContent = (html: string) => {
    if (typeof window === 'undefined') {
      setRenderedContent(html);
      return;
    }
    
    // Create temporary div to manipulate the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Find all paragraph-like elements to add IDs
    const elements = Array.from(tempDiv.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li'));
    const ids: string[] = [];
    
    elements.forEach((el, index) => {
      const id = `para-${index}`;
      el.setAttribute('id', id);
      el.setAttribute('data-paragraph-index', index.toString());
      el.setAttribute('class', (el.getAttribute('class') || '') + ' novel-paragraph');
      ids.push(id);
    });
    
    setParagraphIds(ids);
    setRenderedContent(tempDiv.innerHTML);
  };
  
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
  
  // Scroll highlighted paragraph into view
  useEffect(() => {
    if (highlightParagraph >= 0 && highlightParagraph < paragraphIds.length && typeof window !== 'undefined') {
      const paraId = paragraphIds[highlightParagraph];
      const element = document.getElementById(paraId);
      
      if (element) {
        // Add highlight class and scroll into view
        document.querySelectorAll('.novel-paragraph-highlight').forEach(el => {
          el.classList.remove('novel-paragraph-highlight');
        });
        
        element.classList.add('novel-paragraph-highlight');
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightParagraph, paragraphIds]);
  
  // Add CSS for word highlighting
  useEffect(() => {
    if (highlightWordStart >= 0 && highlightWordEnd > highlightWordStart) {
      // Find all words in the content
      if (typeof window !== 'undefined') {
        // Create a style tag for the highlighting
        let styleTag = document.getElementById('word-highlight-style');
        if (!styleTag) {
          styleTag = document.createElement('style');
          styleTag.id = 'word-highlight-style';
          document.head.appendChild(styleTag);
        }

        // Define the CSS for word highlighting
        styleTag.innerHTML = `
          .highlight-word {
            background-color: rgba(59, 130, 246, 0.2);
            border-radius: 2px;
            padding: 0 2px;
            margin: 0 -2px;
          }
        `;

        // Get all paragraphs and process them
        const allParas = document.querySelectorAll('.novel-paragraph');
        
        // Reset any previous highlighting
        document.querySelectorAll('.highlight-word').forEach(el => {
          const text = el.textContent || '';
          el.outerHTML = text;
        });
        
        // We only care about the active paragraph for now
        if (highlightParagraph >= 0 && highlightParagraph < allParas.length) {
          // Only get the words in the highlighted paragraph
          // This is a simplified approach - more complex texts with nested tags 
          // would need a more sophisticated solution
          const targetParagraph = allParas[highlightParagraph];
          
          // Get the text content, then split into words
          const textContent = targetParagraph.textContent || '';
          const words = textContent.split(' ');
          
          // Only highlight if we have valid word indices
          if (highlightWordStart < words.length) {
            // Create a temporary container to handle the HTML
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = targetParagraph.innerHTML;
            
            // Approach: Replace text nodes with highlighted versions
            // This is complex but possible with DOM manipulation
            // For now, we'll implement a simplified version
            
            // Create a walker to traverse all text nodes
            const walker = document.createTreeWalker(
              tempContainer,
              NodeFilter.SHOW_TEXT,
              null
            );
            
            // Get all text nodes
            const textNodes: Text[] = [];
            let currentNode = walker.nextNode();
            while (currentNode) {
              textNodes.push(currentNode as Text);
              currentNode = walker.nextNode();
            }
            
            // Mark the target words in text nodes
            let wordCount = 0;
            textNodes.forEach(textNode => {
              const nodeText = textNode.textContent || '';
              const nodeWords = nodeText.split(/\s+/);
              
              // Check if this node contains our target words
              for (let i = 0; i < nodeWords.length; i++) {
                const currentIndex = wordCount + i;
                
                if (currentIndex >= highlightWordStart && currentIndex < highlightWordEnd) {
                  // This word should be highlighted
                  // We replace it in the DOM
                  const word = nodeWords[i];
                  const beforeText = nodeWords.slice(0, i).join(' ');
                  const afterText = nodeWords.slice(i + 1).join(' ');
                  
                  // Create highlighted span
                  const span = document.createElement('span');
                  span.className = 'highlight-word';
                  span.textContent = word;
                  
                  // Replace the text node with our new structure
                  const parent = textNode.parentNode;
                  if (parent) {
                    if (beforeText) {
                      parent.insertBefore(document.createTextNode(beforeText + ' '), textNode);
                    }
                    parent.insertBefore(span, textNode);
                    if (afterText) {
                      parent.insertBefore(document.createTextNode(' ' + afterText), textNode);
                    }
                    parent.removeChild(textNode);
                    break; // Break after replacement
                  }
                }
              }
              
              wordCount += nodeWords.length;
            });
            
            // Update the paragraph with our highlighted content
            targetParagraph.innerHTML = tempContainer.innerHTML;
          }
        }
      }
    } else {
      // Remove highlighting if indices are invalid
      if (typeof window !== 'undefined') {
        document.querySelectorAll('.highlight-word').forEach(el => {
          const text = el.textContent || '';
          el.outerHTML = text;
        });
      }
    }
  }, [highlightWordStart, highlightWordEnd, highlightParagraph]);
  
  // Handle paragraph click
  const handleClick = (e: React.MouseEvent) => {
    if (!onParagraphClick) return;
    
    // Find the clicked paragraph
    const target = e.target as HTMLElement;
    const paragraph = target.closest('.novel-paragraph');
    
    if (paragraph) {
      const index = parseInt(paragraph.getAttribute('data-paragraph-index') || '-1');
      if (index >= 0) {
        onParagraphClick(index);
      }
    }
  };
  
  return (
    <div 
      className={`rich-text ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
      onClick={onParagraphClick ? handleClick : undefined}
    />
  );
} 