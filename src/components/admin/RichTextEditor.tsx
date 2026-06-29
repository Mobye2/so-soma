import { useCallback, useEffect, useImperativeHandle, forwardRef, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import FontFamily from "@tiptap/extension-font-family";
import { TextStyle } from "@tiptap/extension-text-style";
import Placeholder from "@tiptap/extension-placeholder";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Quote,
  Link as LinkIcon, Image as ImageIcon, Undo, Redo,
  AlignLeft, AlignCenter, AlignRight, Code,
  Table as TableIcon, Monitor, Tablet, Smartphone,
  Minus, Plus, Trash2,
} from "lucide-react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeightClass?: string;
  onWidthClassChange?: (cls: string) => void;
}

export interface RichTextEditorHandle {
  getText: () => string;
  getHTML: () => string;
}

const FONT_OPTIONS = [
  { label: "預設", value: "" },
  { label: "思源宋體", value: "'Noto Serif TC', serif" },
  { label: "思源黑體", value: "'Noto Sans TC', sans-serif" },
  { label: "Cormorant Garamond", value: "'Cormorant Garamond', serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "等寬字", value: "ui-monospace, monospace" },
];

type PreviewWidth = "desktop" | "tablet" | "mobile";
const PREVIEW_WIDTHS: Record<PreviewWidth, string> = {
  desktop: "",
  tablet: "max-w-2xl",
  mobile: "max-w-sm",
};

const RichTextEditor = forwardRef<RichTextEditorHandle, Props>(
  ({ value, onChange, placeholder = "開始創作你的精彩內容 ……", minHeightClass = "min-h-[60vh]", onWidthClassChange }, ref) => {
    const [previewWidth, setPreviewWidth] = useState<PreviewWidth>("desktop");
    const [tableInput, setTableInput] = useState<{ rows: number; cols: number; bgColor: string; borderColor: string } | null>(null);
    const [tableMenu, setTableMenu] = useState<{ x: number; y: number } | null>(null);
    const tableMenuRef = useRef<HTMLDivElement>(null);
    const editorWrapRef = useRef<HTMLDivElement>(null);

    const setWidth = (w: PreviewWidth) => {
      setPreviewWidth(w);
      onWidthClassChange?.(PREVIEW_WIDTHS[w]);
    };

    const editor = useEditor({
      extensions: [
        StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        TextStyle,
        FontFamily,
        Image.configure({ inline: false }),
        Link.configure({ openOnClick: false }),
        Placeholder.configure({ placeholder }),
        Table.configure({ resizable: true }),
        TableRow,
        TableHeader,
        TableCell,
      ],
      content: value || "<p></p>",
      editorProps: {
        attributes: {
          class: [
            "prose prose-lg max-w-none focus:outline-none px-2 py-6",
            minHeightClass,
            "prose-h1:text-4xl prose-h1:font-bold prose-h1:mt-8 prose-h1:mb-4",
            "prose-h2:text-3xl prose-h2:font-semibold prose-h2:mt-7 prose-h2:mb-3",
            "prose-h3:text-2xl prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-2",
            "prose-p:text-base prose-p:leading-relaxed prose-a:text-sage prose-a:underline prose-img:rounded-md",
          ].join(" "),
        },
      },
      onUpdate: ({ editor }) => onChange(editor.getHTML()),
      onSelectionUpdate: ({ editor }) => {
        if (!editor.isActive("table")) {
          setTableMenu(null);
          return;
        }
        // Find the DOM cell node and position the menu above it
        const { state, view } = editor;
        const { from } = state.selection;
        let cellPos: number | null = null;
        state.doc.nodesBetween(0, state.doc.content.size, (node, pos) => {
          if ((node.type.name === "tableCell" || node.type.name === "tableHeader") && pos <= from && from <= pos + node.nodeSize) {
            cellPos = pos;
          }
        });
        if (cellPos === null) { setTableMenu(null); return; }
        const domNode = view.nodeDOM(cellPos) as HTMLElement | null;
        if (!domNode) { setTableMenu(null); return; }
        const cellRect = domNode.getBoundingClientRect();
        const wrapRect = editorWrapRef.current?.getBoundingClientRect();
        if (!wrapRect) { setTableMenu(null); return; }
        setTableMenu({
          x: cellRect.left - wrapRect.left,
          y: cellRect.top - wrapRect.top - 4, // 4px gap above cell
        });
      },
    });

    // Close table menu when clicking outside
    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (tableMenuRef.current && !tableMenuRef.current.contains(e.target as Node)) {
          // Don't close if clicking inside editor (selection change will re-position)
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
      if (!editor) return;
      if (value !== undefined && value !== editor.getHTML()) {
        editor.commands.setContent(value || "<p></p>", false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    useImperativeHandle(ref, () => ({
      getText: () => editor?.getText() ?? "",
      getHTML: () => editor?.getHTML() ?? "",
    }), [editor]);

    const uploadImage = useCallback(async (file: File) => {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("blog-images").upload(path, file);
      if (error) return toast({ title: "上傳失敗", description: error.message, variant: "destructive" });
      const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
      editor?.chain().focus().setImage({ src: data.publicUrl }).run();
    }, [editor]);

    const addLink = useCallback(() => {
      const prev = editor?.getAttributes("link").href ?? "";
      const url = window.prompt("輸入連結網址", prev);
      if (url === null) return;
      if (!url) { editor?.chain().focus().unsetLink().run(); return; }
      editor?.chain().focus().setLink({ href: url }).run();
    }, [editor]);

    if (!editor) return null;

    const Btn = ({ onClick, active, label, children }: {
      onClick: () => void; active?: boolean; label: string; children: React.ReactNode;
    }) => (
      <Button type="button" size="sm" variant={active ? "secondary" : "ghost"}
        onMouseDown={(e) => e.preventDefault()} onClick={onClick}
        aria-label={label} title={label} className="h-9 w-9 p-0 rounded-md">
        {children}
      </Button>
    );

    const Sep = () => <span className="w-px bg-border mx-1 self-stretch" />;

    // Small button for the floating table menu
    const TBtn = ({ onClick, label, children, danger }: {
      onClick: () => void; label: string; children: React.ReactNode; danger?: boolean;
    }) => (
      <button type="button" title={label}
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
        className={`flex items-center justify-center w-7 h-7 rounded text-xs hover:bg-muted transition-colors ${danger ? "text-destructive hover:bg-destructive/10" : "text-foreground"}`}>
        {children}
      </button>
    );

    return (
      <div className="w-full">
        {/* Main Toolbar */}
        <div className="sticky top-0 z-10 flex justify-center pb-4">
          <div className="inline-flex flex-wrap items-center gap-1 px-3 py-2 rounded-xl bg-background/95 backdrop-blur border border-border shadow-sm">
            <Btn label="H1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="w-4 h-4" /></Btn>
            <Btn label="H2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="w-4 h-4" /></Btn>
            <Btn label="H3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="w-4 h-4" /></Btn>
            <Sep />

            <select value={editor.getAttributes("textStyle").fontFamily ?? ""}
              onChange={(e) => { if (!e.target.value) editor.chain().focus().unsetFontFamily().run(); else editor.chain().focus().setFontFamily(e.target.value).run(); }}
              onMouseDown={(e) => e.stopPropagation()} aria-label="字體" title="字體"
              className="h-9 px-2 rounded-md border border-input bg-background text-sm">
              {FONT_OPTIONS.map((f) => <option key={f.label} value={f.value} style={{ fontFamily: f.value || undefined }}>{f.label}</option>)}
            </select>
            <Sep />

            <Btn label="粗體" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="w-4 h-4" /></Btn>
            <Btn label="斜體" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="w-4 h-4" /></Btn>
            <Btn label="引用" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="w-4 h-4" /></Btn>
            <Btn label="程式碼" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code className="w-4 h-4" /></Btn>
            <Sep />

            <Btn label="靠左" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft className="w-4 h-4" /></Btn>
            <Btn label="置中" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter className="w-4 h-4" /></Btn>
            <Btn label="靠右" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight className="w-4 h-4" /></Btn>
            <Sep />

            <Btn label="清單" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="w-4 h-4" /></Btn>
            <Btn label="編號" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="w-4 h-4" /></Btn>
            <Sep />

            <Btn label="插入表格" active={editor.isActive("table")} onClick={() => setTableInput({ rows: 3, cols: 3, bgColor: "#ffffff", borderColor: "#e2e8f0" })}><TableIcon className="w-4 h-4" /></Btn>
            <Sep />

            <Btn label="連結" active={editor.isActive("link")} onClick={addLink}><LinkIcon className="w-4 h-4" /></Btn>
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ""; }} />
              <span className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-muted transition-colors" title="圖片"><ImageIcon className="w-4 h-4" /></span>
            </label>
            <Sep />

            <Btn label="復原" onClick={() => editor.chain().focus().undo().run()}><Undo className="w-4 h-4" /></Btn>
            <Btn label="重做" onClick={() => editor.chain().focus().redo().run()}><Redo className="w-4 h-4" /></Btn>
            <Sep />

            <Btn label="桌面版" active={previewWidth === "desktop"} onClick={() => setWidth("desktop")}><Monitor className="w-4 h-4" /></Btn>
            <Btn label="平板版" active={previewWidth === "tablet"} onClick={() => setWidth("tablet")}><Tablet className="w-4 h-4" /></Btn>
            <Btn label="手機版" active={previewWidth === "mobile"} onClick={() => setWidth("mobile")}><Smartphone className="w-4 h-4" /></Btn>
          </div>
        </div>

        {/* Table insert dialog */}
        {tableInput && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setTableInput(null)}>
            <div className="bg-background border border-border rounded-xl shadow-xl p-6 w-80 space-y-4" onClick={(e) => e.stopPropagation()}>
              <p className="text-sm font-semibold">插入表格</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">列數（rows）</label>
                  <input type="number" min={1} max={20} value={tableInput.rows}
                    onChange={(e) => setTableInput({ ...tableInput, rows: Math.max(1, +e.target.value) })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">欄數（cols）</label>
                  <input type="number" min={1} max={20} value={tableInput.cols}
                    onChange={(e) => setTableInput({ ...tableInput, cols: Math.max(1, +e.target.value) })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">儲存格底色</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={tableInput.bgColor}
                      onChange={(e) => setTableInput({ ...tableInput, bgColor: e.target.value })}
                      className="w-9 h-9 rounded-md border border-input cursor-pointer p-0.5" />
                    <span className="text-xs text-muted-foreground">{tableInput.bgColor}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">線條顏色</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={tableInput.borderColor}
                      onChange={(e) => setTableInput({ ...tableInput, borderColor: e.target.value })}
                      className="w-9 h-9 rounded-md border border-input cursor-pointer p-0.5" />
                    <span className="text-xs text-muted-foreground">{tableInput.borderColor}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setTableInput(null)}>取消</Button>
                <Button type="button" size="sm" onClick={() => {
                  const { rows, cols, bgColor, borderColor } = tableInput;
                  editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
                  // Apply inline styles to all cells after insertion
                  setTimeout(() => {
                    const { state, view } = editor;
                    state.doc.nodesBetween(0, state.doc.content.size, (node, pos) => {
                      if (node.type.name === "table") {
                        const dom = view.nodeDOM(pos) as HTMLElement | null;
                        dom?.querySelectorAll("td, th").forEach((cell) => {
                          const el = cell as HTMLElement;
                          el.style.borderColor = borderColor;
                          el.style.backgroundColor = bgColor;
                        });
                        // Force Tiptap to re-serialize the HTML with inline styles
                        onChange(editor.getHTML());
                      }
                    });
                  }, 50);
                  setTableInput(null);
                }}>插入</Button>
              </div>
            </div>
          </div>
        )}

        {/* Editor canvas */}
        <div ref={editorWrapRef} className="relative">
          {/* Floating table toolbar — appears above the active cell */}
          {tableMenu && editor.isActive("table") && (
            <div
              ref={tableMenuRef}
              style={{ left: tableMenu.x, top: tableMenu.y, transform: "translateY(-100%)" }}
              className="absolute z-20 flex items-center gap-0.5 px-2 py-1 rounded-lg bg-background border border-border shadow-lg"
              onMouseDown={(e) => e.preventDefault()}
            >
              <TBtn label="向右加欄" onClick={() => editor.chain().focus().addColumnAfter().run()}><Plus className="w-3 h-3" /></TBtn>
              <TBtn label="刪除欄" onClick={() => editor.chain().focus().deleteColumn().run()}><Minus className="w-3 h-3" /></TBtn>
              <span className="w-px bg-border mx-0.5 self-stretch" />
              <TBtn label="向下加列" onClick={() => editor.chain().focus().addRowAfter().run()}>
                <Plus className="w-3 h-3 rotate-90" />
              </TBtn>
              <TBtn label="刪除列" onClick={() => editor.chain().focus().deleteRow().run()}>
                <Minus className="w-3 h-3 rotate-90" />
              </TBtn>
              <span className="w-px bg-border mx-0.5 self-stretch" />
              <TBtn label="刪除表格" danger onClick={() => { editor.chain().focus().deleteTable().run(); setTableMenu(null); }}>
                <Trash2 className="w-3 h-3" />
              </TBtn>
            </div>
          )}

          <div className={`mx-auto px-8 transition-all duration-300 ${PREVIEW_WIDTHS[previewWidth]}`}>
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";
export default RichTextEditor;
