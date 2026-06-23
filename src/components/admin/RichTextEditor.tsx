import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Quote,
  Link as LinkIcon, Image as ImageIcon, Undo, Redo,
  AlignLeft, AlignCenter, AlignRight, Code,
} from "lucide-react";
import { useRef, useImperativeHandle, forwardRef, useCallback, useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { toast } from "@/hooks/use-toast";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeightClass?: string;
}

export interface RichTextEditorHandle {
  getText: () => string;
  getHTML: () => string;
}

const FONT_OPTIONS = [
  { label: "預設（思源黑體）", value: "" },
  { label: "思源宋體 Noto Serif TC", value: "'Noto Serif TC', serif" },
  { label: "思源黑體 Noto Sans TC", value: "'Noto Sans TC', sans-serif" },
  { label: "Cormorant Garamond", value: "'Cormorant Garamond', serif" },
  { label: "Georgia 襯線", value: "Georgia, serif" },
  { label: "系統無襯線", value: "system-ui, -apple-system, sans-serif" },
  { label: "等寬字 Monospace", value: "ui-monospace, SFMono-Regular, Menlo, monospace" },
];

const EMPTY_HTML = "<p></p>";

const RichTextEditor = forwardRef<RichTextEditorHandle, Props>(({ value, onChange, placeholder = "開始創作你的精彩內容 ……", minHeightClass = "min-h-[60vh]" }, ref) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const lastHtmlRef = useRef(value || EMPTY_HTML);
  const [active, setActive] = useState({ bold: false, italic: false, block: "", align: "left", font: "__default__" });

  const normalizeHtml = useCallback((html?: string) => {
    const next = html?.trim() || EMPTY_HTML;
    return next === "<br>" ? EMPTY_HTML : next;
  }, []);

  const emitChange = useCallback(() => {
    const next = normalizeHtml(editorRef.current?.innerHTML);
    lastHtmlRef.current = next;
    onChange(next);
  }, [normalizeHtml, onChange]);

  const focusEditor = () => editorRef.current?.focus();

  const refreshToolbarState = useCallback(() => {
    if (!editorRef.current) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current.contains(selection.anchorNode)) return;

    const block = (document.queryCommandValue("formatBlock") || "").toString().toLowerCase();
    const fontFamily = FONT_OPTIONS.find((f) => f.value && document.queryCommandValue("fontName")?.toString().includes(f.value.split(",")[0].replace(/['"]/g, "")))?.value || "__default__";

    setActive({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      block,
      align: document.queryCommandState("justifyCenter") ? "center" : document.queryCommandState("justifyRight") ? "right" : "left",
      font: fontFamily,
    });
  }, []);

  const runCommand = useCallback((command: string, commandValue?: string) => {
    focusEditor();
    document.execCommand(command, false, commandValue);
    emitChange();
    refreshToolbarState();
  }, [emitChange, refreshToolbarState]);

  const setFont = (fontValue: string) => {
    if (!fontValue || fontValue === "__default__") {
      runCommand("removeFormat");
      return;
    }
    runCommand("fontName", fontValue);
  };

  useLayoutEffect(() => {
    const editorEl = editorRef.current;
    const next = normalizeHtml(value);
    if (!editorEl) return;
    if (editorEl.innerHTML !== next && (!editorEl.innerHTML || lastHtmlRef.current !== next)) {
      editorEl.innerHTML = next;
      lastHtmlRef.current = next;
    }
  }, [normalizeHtml, value]);

  useEffect(() => {
    document.addEventListener("selectionchange", refreshToolbarState);
    return () => document.removeEventListener("selectionchange", refreshToolbarState);
  }, [refreshToolbarState]);

  useImperativeHandle(ref, () => ({
    getText: () => editorRef.current?.innerText ?? "",
    getHTML: () => normalizeHtml(editorRef.current?.innerHTML),
  }), [normalizeHtml]);

  const uploadImage = async (file: File) => {
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("blog-images").upload(path, file);
    if (error) {
      toast({ title: "上傳失敗", description: error.message, variant: "destructive" });
      return;
    }
    const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
    runCommand("insertImage", data.publicUrl);
  };

  const addLink = () => {
    const url = window.prompt("輸入連結網址");
    if (!url) return;
    runCommand("createLink", url);
  };

  const Btn = ({ onClick, isActive, children, label }: { onClick: () => void; isActive?: boolean; children: ReactNode; label: string }) => (
    <Button type="button" size="sm" variant={isActive ? "secondary" : "ghost"} onMouseDown={(e) => e.preventDefault()} onClick={onClick} aria-label={label} title={label} className="h-9 w-9 p-0 rounded-md">
      {children}
    </Button>
  );

  return (
    <div className="w-full">
      {/* Floating toolbar */}
      <div className="sticky top-0 z-10 flex justify-center pb-4">
        <div className="inline-flex flex-wrap items-center gap-1 px-3 py-2 rounded-xl bg-background/95 backdrop-blur border border-border shadow-sm">
          <Btn label="H1" isActive={active.block === "h1"} onClick={() => runCommand("formatBlock", active.block === "h1" ? "p" : "h1")}><Heading1 className="w-4 h-4" /></Btn>
          <Btn label="H2" isActive={active.block === "h2"} onClick={() => runCommand("formatBlock", active.block === "h2" ? "p" : "h2")}><Heading2 className="w-4 h-4" /></Btn>
          <Btn label="H3" isActive={active.block === "h3"} onClick={() => runCommand("formatBlock", active.block === "h3" ? "p" : "h3")}><Heading3 className="w-4 h-4" /></Btn>
          <span className="w-px bg-border mx-1" />
          <select
            value={active.font}
            onChange={(e) => setFont(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            aria-label="字體樣式"
            title="字體樣式"
            className="h-9 px-2 rounded-md border border-input bg-background text-sm"
          >
            {FONT_OPTIONS.map((f) => (
              <option
                key={f.label}
                value={f.value || "__default__"}
                style={{ fontFamily: f.value || undefined }}
              >
                {f.label}
              </option>
            ))}
          </select>
          <span className="w-px bg-border mx-1" />
          <Btn label="粗體" isActive={active.bold} onClick={() => runCommand("bold")}><Bold className="w-4 h-4" /></Btn>
          <Btn label="斜體" isActive={active.italic} onClick={() => runCommand("italic")}><Italic className="w-4 h-4" /></Btn>
          <Btn label="引用" isActive={active.block === "blockquote"} onClick={() => runCommand("formatBlock", active.block === "blockquote" ? "p" : "blockquote")}><Quote className="w-4 h-4" /></Btn>
          <Btn label="程式碼" isActive={active.block === "pre"} onClick={() => runCommand("formatBlock", active.block === "pre" ? "p" : "pre")}><Code className="w-4 h-4" /></Btn>
          <span className="w-px bg-border mx-1" />
          <Btn label="靠左" isActive={active.align === "left"} onClick={() => runCommand("justifyLeft")}><AlignLeft className="w-4 h-4" /></Btn>
          <Btn label="置中" isActive={active.align === "center"} onClick={() => runCommand("justifyCenter")}><AlignCenter className="w-4 h-4" /></Btn>
          <Btn label="靠右" isActive={active.align === "right"} onClick={() => runCommand("justifyRight")}><AlignRight className="w-4 h-4" /></Btn>
          <span className="w-px bg-border mx-1" />
          <Btn label="清單" onClick={() => runCommand("insertUnorderedList")}><List className="w-4 h-4" /></Btn>
          <Btn label="編號" onClick={() => runCommand("insertOrderedList")}><ListOrdered className="w-4 h-4" /></Btn>
          <span className="w-px bg-border mx-1" />
          <Btn label="連結" onClick={addLink}><LinkIcon className="w-4 h-4" /></Btn>
          <Btn label="圖片" onClick={() => fileRef.current?.click()}><ImageIcon className="w-4 h-4" /></Btn>
          <span className="w-px bg-border mx-1" />
          <Btn label="復原" onClick={() => runCommand("undo")}><Undo className="w-4 h-4" /></Btn>
          <Btn label="重做" onClick={() => runCommand("redo")}><Redo className="w-4 h-4" /></Btn>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadImage(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>
      <div
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label="文章內文"
        data-placeholder={placeholder}
        suppressContentEditableWarning
        onInput={emitChange}
        onKeyUp={refreshToolbarState}
        onMouseUp={refreshToolbarState}
        onFocus={refreshToolbarState}
        className={`prose prose-lg max-w-none ${minHeightClass} focus:outline-none px-2 py-6
          empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50 empty:before:pointer-events-none
          prose-h1:text-4xl prose-h1:font-bold prose-h1:mt-8 prose-h1:mb-4
          prose-h2:text-3xl prose-h2:font-semibold prose-h2:mt-7 prose-h2:mb-3
          prose-h3:text-2xl prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-2
          prose-p:text-base prose-p:leading-relaxed prose-a:text-sage prose-a:underline prose-img:rounded-md`}
      />
    </div>
  );
});

RichTextEditor.displayName = "RichTextEditor";

export default RichTextEditor;
