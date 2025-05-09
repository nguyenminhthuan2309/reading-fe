import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Heading from '@tiptap/extension-heading'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import Blockquote from '@tiptap/extension-blockquote'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TextAlign from '@tiptap/extension-text-align'
import { Button } from "@/components/ui/button"
import { 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  List,
  ListOrdered,
  Quote,
  Table as TableIcon,
  SquarePlus,
  RowsIcon,
  ColumnsIcon,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify
} from 'lucide-react'
import { useCallback, useEffect } from 'react'
import '@/styles/rich-text.css'

interface TiptapEditorProps {
  content: string
  onChange: (content: string) => void
  className?: string
  editable?: boolean
}

// Simple menu button component
const MenuButton = ({ 
  onClick, 
  isActive = false, 
  disabled = false,
  children,
  title,
}: { 
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  children: React.ReactNode
  title?: string
}) => {
  return (
    <Button
      type="button"
      variant={isActive ? "default" : "ghost"}
      size="icon"
      onClick={onClick}
      disabled={disabled}
      className="h-8 w-8"
      title={title}
    >
      {children}
    </Button>
  )
}

export default function TiptapEditor({ content, onChange, className = '', editable = true }: TiptapEditorProps) {
  // Initialize the editor with necessary extensions
  const editor = useEditor({
    extensions: [
      StarterKit,
      Heading.configure({
        levels: [1, 2],
      }),
      BulletList,
      OrderedList,
      Blockquote,
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
    ],
    content: parseContent(content),
    editable: editable,
    onUpdate: ({ editor }) => {
      if (onChange) {
        // Get content as JSON and store as stringified JSON
        const json = editor.getJSON()
        onChange(JSON.stringify(json))
      }
    },
  })

  // Function to parse content from stored string
  function parseContent(contentString: string) {
    if (!contentString) return '<p></p>'
    
    try {
      // Try to parse as JSON
      const json = JSON.parse(contentString)
      return json
    } catch (e) {
      // If it can't be parsed as JSON, assume it's HTML or plain text
      if (contentString.trim().startsWith('<')) {
        // If it looks like HTML, return as is
        return contentString
      } else {
        // If it's plain text, wrap in paragraph
        return `<p>${contentString}</p>`
      }
    }
  }

  // Update editor content when the content prop changes from outside
  useEffect(() => {
    if (!editor || !content || editor.isFocused) return
    
    // Set content when editor is available and content changes
    editor.commands.setContent(parseContent(content))
  }, [editor, content])

  // Editor menu handlers
  const handleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run()
  }, [editor])

  const handleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run()
  }, [editor])

  const handleH1 = useCallback(() => {
    editor?.chain().focus().toggleHeading({ level: 1 }).run()
  }, [editor])

  const handleH2 = useCallback(() => {
    editor?.chain().focus().toggleHeading({ level: 2 }).run()
  }, [editor])

  const handleBulletList = useCallback(() => {
    editor?.chain().focus().toggleBulletList().run()
  }, [editor])

  const handleOrderedList = useCallback(() => {
    editor?.chain().focus().toggleOrderedList().run()
  }, [editor])

  const handleBlockquote = useCallback(() => {
    editor?.chain().focus().toggleBlockquote().run()
  }, [editor])

  // Table handlers
  const handleInsertTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }, [editor])

  const handleAddColumnBefore = useCallback(() => {
    editor?.chain().focus().addColumnBefore().run()
  }, [editor])

  const handleAddColumnAfter = useCallback(() => {
    editor?.chain().focus().addColumnAfter().run()
  }, [editor])

  const handleAddRowBefore = useCallback(() => {
    editor?.chain().focus().addRowBefore().run()
  }, [editor])

  const handleAddRowAfter = useCallback(() => {
    editor?.chain().focus().addRowAfter().run()
  }, [editor])

  const handleDeleteTable = useCallback(() => {
    editor?.chain().focus().deleteTable().run()
  }, [editor])

  // Text alignment handlers
  const handleAlignLeft = useCallback(() => {
    editor?.chain().focus().setTextAlign('left').run()
  }, [editor])

  const handleAlignCenter = useCallback(() => {
    editor?.chain().focus().setTextAlign('center').run()
  }, [editor])

  const handleAlignRight = useCallback(() => {
    editor?.chain().focus().setTextAlign('right').run()
  }, [editor])

  const handleAlignJustify = useCallback(() => {
    editor?.chain().focus().setTextAlign('justify').run()
  }, [editor])

  const isTableActive = editor?.isActive('table') || false

  if (!editor) {
    return null
  }

  return (
    <div className={`border rounded-md ${className}`}>
      <div className="flex flex-wrap items-center gap-1 p-1 border-b bg-muted/40">
        <MenuButton
          onClick={handleBold}
          isActive={editor.isActive('bold')}
          title="Bold"
          disabled={!editable}
        >
          <Bold size={16} />
        </MenuButton>
        
        <MenuButton
          onClick={handleItalic}
          isActive={editor.isActive('italic')}
          title="Italic"
          disabled={!editable}
        >
          <Italic size={16} />
        </MenuButton>
        
        <MenuButton
          onClick={handleH1}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
          disabled={!editable}
        >
          <Heading1 size={16} />
        </MenuButton>
        
        <MenuButton
          onClick={handleH2}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
          disabled={!editable}
        >
          <Heading2 size={16} />
        </MenuButton>
        
        <MenuButton
          onClick={handleBulletList}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
          disabled={!editable}
        >
          <List size={16} />
        </MenuButton>
        
        <MenuButton
          onClick={handleOrderedList}
          isActive={editor.isActive('orderedList')}
          title="Ordered List"
          disabled={!editable}
        >
          <ListOrdered size={16} />
        </MenuButton>
        
        <MenuButton
          onClick={handleBlockquote}
          isActive={editor.isActive('blockquote')}
          title="Blockquote"
          disabled={!editable}
        >
          <Quote size={16} />
        </MenuButton>

        <div className="w-px h-6 bg-muted-foreground/20 mx-1"></div>
        
        {/* Text alignment buttons */}
        <MenuButton
          onClick={handleAlignLeft}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
          disabled={!editable}
        >
          <AlignLeft size={16} />
        </MenuButton>
        
        <MenuButton
          onClick={handleAlignCenter}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
          disabled={!editable}
        >
          <AlignCenter size={16} />
        </MenuButton>
        
        <MenuButton
          onClick={handleAlignRight}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
          disabled={!editable}
        >
          <AlignRight size={16} />
        </MenuButton>
        
        <MenuButton
          onClick={handleAlignJustify}
          isActive={editor.isActive({ textAlign: 'justify' })}
          title="Align Justify"
          disabled={!editable}
        >
          <AlignJustify size={16} />
        </MenuButton>

        <div className="w-px h-6 bg-muted-foreground/20 mx-1"></div>
        
        <MenuButton
          onClick={handleInsertTable}
          isActive={isTableActive}
          title="Insert Table"
          disabled={!editable}
        >
          <TableIcon size={16} />
        </MenuButton>

        {isTableActive && (
          <>
            <MenuButton
              onClick={handleAddColumnBefore}
              disabled={!isTableActive}
              title="Add Column Before"
            >
              <ColumnsIcon size={16} className="rotate-180" />
            </MenuButton>
            
            <MenuButton
              onClick={handleAddColumnAfter}
              disabled={!isTableActive}
              title="Add Column After"
            >
              <ColumnsIcon size={16} />
            </MenuButton>
            
            <MenuButton
              onClick={handleAddRowBefore}
              disabled={!isTableActive}
              title="Add Row Before"
            >
              <RowsIcon size={16} className="rotate-180" />
            </MenuButton>
            
            <MenuButton
              onClick={handleAddRowAfter}
              disabled={!isTableActive}
              title="Add Row After"
            >
              <RowsIcon size={16} />
            </MenuButton>
            
            <MenuButton
              onClick={handleDeleteTable}
              disabled={!isTableActive}
              title="Delete Table"
            >
              <Trash2 size={16} />
            </MenuButton>
          </>
        )}
      </div>
      
      <EditorContent 
        editor={editor} 
        className="min-h-[200px] p-4 tiptap-editor rich-text" 
      />
    </div>
  )
} 