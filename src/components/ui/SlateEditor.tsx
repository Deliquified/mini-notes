'use client';

import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { createEditor, Descendant, Transforms, Editor, Element as SlateElement, BaseEditor, BaseElement, BaseText, NodeEntry } from 'slate';
import { Slate, Editable, withReact, useSlate, ReactEditor } from 'slate-react';
import type { RenderElementProps, RenderLeafProps } from 'slate-react';
import { withHistory } from 'slate-history';
import { Button } from './button';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Type,
  List
} from 'lucide-react';

// Custom types for Slate
export type CustomElement =
  | { type: 'paragraph'; children: CustomText[] }
  | { type: 'heading-one'; children: CustomText[] }
  | { type: 'heading-two'; children: CustomText[] }
  | { type: 'align-center'; children: CustomText[] }
  | { type: 'align-right'; children: CustomText[] }
  | { type: 'align-left'; children: CustomText[] }
  | { type: 'bulleted-list'; children: CustomElement[] }
  | { type: 'list-item'; children: CustomText[] };
export type CustomText = { text: string; bold?: boolean; italic?: boolean; underline?: boolean; color?: string; backgroundColor?: string; fontSize?: string };
declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

// Helper functions for formatting
const isMarkActive = (editor: Editor, format: keyof CustomText) => {
  const marks = Editor.marks(editor) as CustomText | null;
  return marks ? marks[format] === true : false;
};
const toggleMark = (editor: Editor, format: keyof CustomText, value?: any) => {
  const isActive = isMarkActive(editor, format);
  if (isActive && value === undefined) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, value === undefined ? true : value);
  }
};

const isBlockActive = (editor: Editor, format: CustomElement['type']) => {
  const [match] = Array.from(
    Editor.nodes(editor, {
      match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
    })
  );
  return !!match;
};
const toggleBlock = (editor: Editor, format: CustomElement['type']) => {
  const isActive = isBlockActive(editor, format);
  Transforms.setNodes(
    editor,
    { type: isActive ? 'paragraph' : format },
    { match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n) }
  );
};

const Element = ({ attributes, children, element }: { attributes: any; children: any; element: CustomElement }) => {
  switch (element.type) {
    case 'heading-one':
      return <h1 {...attributes} style={{ fontSize: 28, fontWeight: 700, margin: '1.2em 0 0.5em' }}>{children}</h1>;
    case 'heading-two':
      return <h2 {...attributes} style={{ fontSize: 22, fontWeight: 600, margin: '1em 0 0.5em' }}>{children}</h2>;
    case 'align-center':
      return <div {...attributes} style={{ textAlign: 'center' }}>{children}</div>;
    case 'align-right':
      return <div {...attributes} style={{ textAlign: 'right' }}>{children}</div>;
    case 'align-left':
      return <div {...attributes} style={{ textAlign: 'left' }}>{children}</div>;
    case 'bulleted-list':
      return <ul {...attributes} style={{ paddingLeft: 24 }}>{children}</ul>;
    case 'list-item':
      return <li {...attributes}>{children}</li>;
    default:
      return <p {...attributes}>{children}</p>;
  }
};

const Leaf = ({ attributes, children, leaf }: { attributes: any; children: any; leaf: CustomText }) => {
  let style: React.CSSProperties = {};
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }
  if (leaf.italic) {
    children = <em>{children}</em>;
  }
  if (leaf.underline) {
    children = <u>{children}</u>;
  }
  if (leaf.color) {
    style.color = leaf.color;
  }
  if (leaf.backgroundColor) {
    style.backgroundColor = leaf.backgroundColor;
  }
  if (leaf.fontSize) {
    style.fontSize = leaf.fontSize;
  }
  return <span {...attributes} style={style}>{children}</span>;
};

const toggleList = (editor: Editor) => {
  const isActive = isBlockActive(editor, 'bulleted-list');
  Transforms.unwrapNodes(editor, {
    match: n =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      n.type === 'bulleted-list',
    split: true,
  });
  const newType = isActive ? 'paragraph' : 'list-item';
  Transforms.setNodes(editor, { type: newType } as Partial<CustomElement>);
  if (!isActive) {
    const block = { type: 'bulleted-list' as const, children: [] };
    Transforms.wrapNodes(editor, block);
  }
};

const Toolbar = ({ readOnly = false }) => {
  const editor = useSlate();
  const [customSize, setCustomSize] = useState("");

  // Skip rendering if in readonly mode
  if (readOnly) return null;

  // Handle custom font size
  const handleCustomSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomSize(value);

    // Apply if valid
    if (value && !isNaN(Number(value))) {
      toggleMark(editor, 'fontSize', `${value}px`);
    }
  };

  return (
    <div className="border-b border-gray-200 bg-gray-50 px-2 p-2 mb-4 rounded-t-lg sticky top-0 z-10">
      <div className="flex items-center gap-1 flex-wrap">
        {/* Text formatting */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onMouseDown={e => { e.preventDefault(); toggleMark(editor, 'bold'); }}>
          <Bold className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onMouseDown={e => { e.preventDefault(); toggleMark(editor, 'italic'); }}>
          <Italic className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onMouseDown={e => { e.preventDefault(); toggleMark(editor, 'underline'); }}>
          <Underline className="w-4 h-4" />
        </Button>
        
        {/* Headings */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onMouseDown={e => { e.preventDefault(); toggleBlock(editor, 'heading-one'); }}>
          <span className="font-bold text-lg">H1</span>
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onMouseDown={e => { e.preventDefault(); toggleBlock(editor, 'heading-two'); }}>
          <span className="font-bold">H2</span>
        </Button>
        
        {/* Alignment */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onMouseDown={e => { e.preventDefault(); toggleBlock(editor, 'align-left'); }}>
          <AlignLeft className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onMouseDown={e => { e.preventDefault(); toggleBlock(editor, 'align-center'); }}>
          <AlignCenter className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onMouseDown={e => { e.preventDefault(); toggleBlock(editor, 'align-right'); }}>
          <AlignRight className="w-4 h-4" />
        </Button>
        
        {/* List */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onMouseDown={e => { e.preventDefault(); toggleList(editor); }}>
          <List className="w-4 h-4" />
        </Button>
        
        {/* Colors */}
        <div className="relative">
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Text color">
            <span className="text-base font-semibold">A</span>
          </Button>
          <input 
            type="color" 
            title="Text color" 
            className="absolute inset-0 opacity-0 cursor-pointer" 
            onChange={e => { toggleMark(editor, 'color', e.target.value); }} 
          />
        </div>
        <div className="relative">
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Background color">
            <span className="text-base font-semibold bg-gray-100 px-1 rounded">A</span>
          </Button>
          <input 
            type="color" 
            title="Background color" 
            className="absolute inset-0 opacity-0 cursor-pointer" 
            onChange={e => { toggleMark(editor, 'backgroundColor', e.target.value); }} 
          />
        </div>
        
        {/* Font size with dropdown and custom input */}
        <div className="relative group">
          <Button variant="ghost" size="icon" className="h-8 w-8 flex items-center justify-center" title="Font size">
            <Type className="w-4 h-4" />
          </Button>
          <div className="absolute hidden group-hover:block top-full left-0 bg-white shadow-md rounded p-2 z-20 w-40">
            <div className="flex flex-col gap-1">
              <select 
                className="border rounded px-2 py-1 text-sm focus:outline-none" 
                onChange={e => { toggleMark(editor, 'fontSize', e.target.value); }}
                defaultValue="">
                <option value="">Default</option>
                <option value="12px">12px</option>
                <option value="14px">14px</option>
                <option value="16px">16px</option>
                <option value="20px">20px</option>
                <option value="24px">24px</option>
                <option value="32px">32px</option>
              </select>
              <div className="flex items-center gap-1 mt-1">
                <input
                  type="number"
                  placeholder="Custom size"
                  className="border rounded px-2 py-1 text-sm focus:outline-none w-full"
                  value={customSize}
                  onChange={handleCustomSizeChange}
                  min="8"
                  max="100"
                />
                <span className="text-xs">px</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SlateEditor = ({ value, onChange, readOnly = false }: { 
  value: Descendant[]; 
  onChange: (v: Descendant[]) => void; 
  readOnly?: boolean 
}) => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  
  // Instead of using the key-based remounting, update the editor value directly
  useEffect(() => {
    // Don't update if the editor already has this content
    const currentContent = JSON.stringify(editor.children);
    const newContent = JSON.stringify(value);
    
    if (currentContent !== newContent) {
      editor.children = value;
      editor.onChange();
    }
  }, [editor, value]);

  return (
    <div className="mx-auto bg-white rounded-lg shadow-sm relative" style={{ maxWidth: 700, padding: 0, minHeight: 400 }}>
      {readOnly && (
        <div className="absolute top-0 left-0 right-0 bg-amber-50 text-amber-700 text-xs px-3 py-1.5 text-center">
          Read only mode
        </div>
      )}
      <Slate editor={editor} initialValue={value} onChange={readOnly ? () => {} : onChange}>
        <Toolbar readOnly={readOnly} />
        <Editable
          renderElement={useCallback((props: RenderElementProps) => <Element {...props} />, [])}
          renderLeaf={useCallback((props: RenderLeafProps) => <Leaf {...props} />, [])}
          placeholder="Start writing..."
          spellCheck
          autoFocus
          readOnly={readOnly}
          className={`outline-none text-lg px-4 ${readOnly ? 'bg-amber-50/10' : ''}`}
          style={{ minHeight: "350px", paddingTop: readOnly ? "30px" : "inherit" }}
        />
      </Slate>
    </div>
  );
};