"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { Placeholder } from "@tiptap/extensions";
import "./editor.css";
import {
  BoldIcon,
  ChevronDownIcon,
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  ListTodoIcon,
  Loader2Icon,
  StrikethroughIcon,
} from "lucide-react";
import { saveDocument } from "@/app/actions/documents";
import { ShareModal } from "@/components/documents/share-modal";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { cn } from "@/lib/cn";

const ICON_CHOICES = [
  "📄", "📝", "📌", "📚", "🚀", "💡", "🎯", "🔥",
  "⭐", "✅", "⚠️", "🌊", "🧭", "🗓️", "🧪", "🏆",
];

type SaveStatus = "idle" | "dirty" | "saving" | "saved";

export function DocumentEditor({
  id,
  initialTitle,
  initialIcon,
  initialContent,
  canEdit,
}: {
  id: string;
  initialTitle: string;
  initialIcon: string | null;
  initialContent: unknown;
  canEdit: boolean;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [icon, setIcon] = useState(initialIcon);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [shareOpen, setShareOpen] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestState = useRef<{ title: string; icon: string | null; content?: unknown }>({
    title,
    icon,
  });

  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        TaskList,
        TaskItem.configure({ nested: true }),
        Placeholder.configure({ placeholder: "Write something…" }),
      ],
      content: (initialContent ?? undefined) as never,
      editable: canEdit,
      // Avoid hydration mismatches in App Router SSR.
      immediatelyRender: false,
      onUpdate({ editor }) {
        if (!canEdit) return;
        setStatus("dirty");
        latestState.current.content = editor.getJSON();
        scheduleSave();
      },
    },
    [id],
  );

  const scheduleSave = useCallback(() => {
    if (!canEdit) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setStatus("saving");
      const patch: Parameters<typeof saveDocument>[1] = {};
      const state = latestState.current;
      if (state.title !== initialTitle || state.icon !== initialIcon) {
        patch.title = state.title.trim() === "" ? "Untitled" : state.title;
      }
      if ("icon" in state) patch.icon = state.icon;
      if (state.content) patch.content = state.content as never;

      await saveDocument(id, patch);
      setStatus("saved");
    }, 700);
  }, [canEdit, id, initialTitle, initialIcon]);

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    [],
  );

  function onTitleChange(value: string) {
    setTitle(value);
    latestState.current.title = value;
    setStatus("dirty");
    scheduleSave();
  }

  function onPickIcon(emoji: string) {
    const next = icon === emoji ? null : emoji;
    setIcon(next);
    latestState.current.icon = next;
    setStatus("dirty");
    scheduleSave();
  }

  return (
    <div className="flex h-dvh flex-col">
      {/* Breadcrumb bar */}
      <div className="flex items-center justify-between border-b border-divider px-4 py-2">
        <span className="truncate text-sm text-text-secondary">
          {icon ? `${icon} ` : ""}
          {title || "Untitled"}
        </span>
        <div className="flex items-center gap-3">
          <SaveIndicator status={canEdit ? status : "idle"} readOnly={!canEdit} />
          <Button variant="outline" size="sm" onClick={() => setShareOpen(true)}>
            Share
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <article className="mx-auto flex w-full max-w-[720px] flex-col px-12 pt-12 pb-24">
          {/* Page icon */}
          {canEdit ? (
            <Dropdown trigger={<PageIconButton icon={icon} />}>
              {(close) => (
                <div className="grid w-56 grid-cols-8 gap-0.5 p-1" role="menu">
                  {ICON_CHOICES.map((emoji) => (
                    <button
                      key={emoji}
                      role="menuitem"
                      onClick={() => {
                        onPickIcon(emoji);
                        close();
                      }}
                      aria-label={`Set page icon ${emoji}`}
                      aria-pressed={icon === emoji}
                      className={cn(
                        "flex size-6 cursor-pointer items-center justify-center rounded hover:bg-hover",
                        "focus-visible:bg-hover focus-visible:outline-none",
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </Dropdown>
          ) : icon ? (
            <span className="text-5xl leading-tight" aria-hidden="true">
              {icon}
            </span>
          ) : null}

          {/* Page title */}
          {canEdit ? (
            <textarea
              rows={1}
              value={title === "Untitled" ? "" : title}
              placeholder="Untitled"
              aria-label="Page title"
              onChange={(e) => onTitleChange(e.target.value.replace(/\n/g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.preventDefault();
              }}
              className="mt-2 resize-none overflow-hidden bg-transparent text-3xl font-bold tracking-tight text-text placeholder:text-text-placeholder focus-visible:outline-none"
            />
          ) : (
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-text">
              {title || "Untitled"}
            </h1>
          )}

          {/* Toolbar — only when editing */}
          {editor && canEdit ? (
            <Toolbar editor={editor} />
          ) : null}
          {!canEdit ? (
            <p className="mt-6 rounded-md border border-border bg-sidebar px-3 py-2 text-sm text-text-secondary">
              This page is read-only for you.
            </p>
          ) : null}

          <EditorContent
            editor={editor}
            className="prosemirror-host mt-4"
            aria-readonly={!canEdit}
          />
        </article>
      </div>

      <ShareModal
        documentId={id}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </div>
  );
}

function SaveIndicator({
  status,
  readOnly,
}: {
  status: SaveStatus;
  readOnly: boolean;
}) {
  return (
    <span className="min-w-16 text-right text-xs text-text-secondary" role="status">
      {readOnly ? (
        "Read-only"
      ) : status === "saving" ? (
        <span className="inline-flex items-center gap-1">
          <Loader2Icon className="size-3 animate-spin" /> Saving…
        </span>
      ) : status === "dirty" ? (
        "Unsaved"
      ) : status === "saved" ? (
        "Saved"
      ) : null}
    </span>
  );
}

function PageIconButton({ icon }: { icon: string | null }) {
  return (
    <button
      type="button"
      className="group flex cursor-pointer items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      aria-label={icon ? "Change page icon" : "Add page icon"}
    >
      {icon ? (
        <span className="text-5xl leading-tight" aria-hidden="true">
          {icon}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-sm text-text-placeholder opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          Add icon <ChevronDownIcon className="size-3.5" />
        </span>
      )}
    </button>
  );
}

type ToolbarButtonProps = {
  active?: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
};

function ToolbarButton({ active, label, onClick, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex size-7 cursor-pointer items-center justify-center rounded-md",
        active ? "bg-active text-text" : "text-text-secondary hover:bg-hover hover:text-text",
      )}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: NonNullable<ReturnType<typeof useEditor>> }) {
  const toggle = (fn: () => void) => fn();

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="sticky top-0 z-10 mt-4 flex flex-wrap items-center gap-0.5 self-start rounded-md border border-border bg-page p-1"
    >
      <ToolbarButton
        label="Heading 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => toggle(() => editor.chain().focus().toggleHeading({ level: 1 }).run())}
      >
        <Heading1Icon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2Icon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <BoldIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <ItalicIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Strikethrough"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <StrikethroughIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Code"
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <CodeIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Bulleted list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <ListIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrderedIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="To-do list"
        active={editor.isActive("taskList")}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      >
        <ListTodoIcon className="size-4" />
      </ToolbarButton>
    </div>
  );
}
