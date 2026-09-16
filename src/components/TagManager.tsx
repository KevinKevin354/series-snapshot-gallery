import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tags: string[];
  usage: Record<string, number>;
  onAdd: (name: string) => void;
  onRename: (from: string, to: string) => void;
  onDelete: (tag: string) => void;
};

export function TagManager({ open, onOpenChange, tags, usage, onAdd, onRename, onDelete }: Props) {
  const [newTag, setNewTag] = useState("");
  const [editing, setEditing] = useState<string>();
  const [draft, setDraft] = useState("");

  const submitNew = () => {
    onAdd(newTag);
    setNewTag("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Kennzeichen verwalten</DialogTitle>
          <DialogDescription>
            Diese Liste pflegen Sie selbst. Am Foto wählen Sie daraus aus.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submitNew();
          }}
        >
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Neues Kennzeichen"
          />
          <Button type="submit" size="icon" aria-label="Kennzeichen hinzufügen">
            <Plus className="size-4" />
          </Button>
        </form>

        <ul className="max-h-72 space-y-1 overflow-y-auto">
          {tags.length === 0 && (
            <li className="py-4 text-center text-sm text-muted-foreground">Noch keine Kennzeichen.</li>
          )}
          {tags.map((tag) => (
            <li
              key={tag}
              className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5"
            >
              {editing === tag ? (
                <>
                  <Input
                    value={draft}
                    autoFocus
                    onChange={(e) => setDraft(e.target.value)}
                    className="h-8"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    aria-label="Speichern"
                    onClick={() => {
                      onRename(tag, draft);
                      setEditing(undefined);
                    }}
                  >
                    <Check className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    aria-label="Abbrechen"
                    onClick={() => setEditing(undefined)}
                  >
                    <X className="size-4" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 truncate text-sm">{tag}</span>
                  <span className="text-xs text-muted-foreground">{usage[tag] ?? 0}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    aria-label={`${tag} umbenennen`}
                    onClick={() => {
                      setEditing(tag);
                      setDraft(tag);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 text-destructive"
                    aria-label={`${tag} löschen`}
                    onClick={() => onDelete(tag)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
