import { useRef, useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, ChevronDown, FolderTree, ImagePlus, Pencil, Plus } from "lucide-react";
import {
  categoryDeleteBlocker,
  createCategory,
  deleteCategory,
  getCategories,
  reorderCategories,
  slugify,
  updateCategory,
  type CategoryLeaf,
  type CategoryNode,
} from "@/data/admin/categories";
import { ApiError } from "@/data/admin/db";
import { ConfirmSheet, Sheet } from "@/admin/components/sheet";
import { useToast } from "@/admin/components/toast";
import {
  AppBar,
  buttonClass,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  ListSkeleton,
  TextAreaField,
  TextField,
  Thumb,
} from "@/admin/components/ui";
import { plural } from "@/admin/lib/format";
import { errorMessage, useApi } from "@/admin/lib/useApi";
import { cn } from "@/lib/utils";

type Editing =
  | { kind: "create"; parent: CategoryNode | null }
  | {
      kind: "edit";
      category: CategoryLeaf & { children?: CategoryLeaf[] };
      parent: CategoryNode | null;
    };

export function CategoriesPage() {
  const { data, error, loading, retry } = useApi(getCategories, []);
  const toast = useToast();
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["cat-oils"]));
  const [reorder, setReorder] = useState(false);
  const [editing, setEditing] = useState<Editing | null>(null);

  const toggle = (id: string) =>
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const move = async (
    siblings: CategoryLeaf[],
    index: number,
    dir: -1 | 1,
    parentId: string | null,
  ) => {
    const target = index + dir;
    if (target < 0 || target >= siblings.length) return;
    const ids = siblings.map((s) => s.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    try {
      await reorderCategories(parentId, ids);
    } catch (e) {
      toast({ message: errorMessage(e), tone: "error" });
    }
  };

  return (
    <>
      <title>Categories · SSV Admin</title>
      <AppBar
        title="Categories"
        backTo="/admin/more"
        backLabel="Back to More"
        actions={
          reorder ? (
            <button
              type="button"
              onClick={() => {
                setReorder(false);
                toast({ message: "Display order saved" });
              }}
              className={buttonClass("primary", "mr-1 h-11 px-4 text-[15px]")}
            >
              Done
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setReorder(true)}
                disabled={!data?.length}
                className={buttonClass("ghost")}
              >
                Reorder
              </button>
              <IconButton
                label="Add category"
                onClick={() => setEditing({ kind: "create", parent: null })}
              >
                <Plus size={24} />
              </IconButton>
            </>
          )
        }
      />

      <div className="mx-auto max-w-[760px] p-4">
        {reorder && (
          <p className="mb-3 rounded-[10px] bg-sand/60 px-3 py-2 text-[14px]">
            Use the arrows to change the order customers see. Changes save as you go.
          </p>
        )}
        {loading && !data ? (
          <ListSkeleton rows={5} />
        ) : error && !data ? (
          <ErrorState message={errorMessage(error)} onRetry={retry} />
        ) : !data?.length ? (
          <EmptyState
            icon={FolderTree}
            title="No categories yet"
            text="Add a category so customers can browse your products."
            action={
              <button
                type="button"
                onClick={() => setEditing({ kind: "create", parent: null })}
                className={buttonClass("primary")}
              >
                <Plus size={18} /> Add category
              </button>
            }
          />
        ) : (
          <ul className="space-y-3">
            {data.map((c, i) => {
              const open = expanded.has(c.id) || reorder;
              return (
                <li key={c.id}>
                  <Card className="overflow-hidden">
                    <div className="flex items-center gap-1 p-3 pr-1">
                      <button
                        type="button"
                        onClick={() => !reorder && toggle(c.id)}
                        aria-expanded={open}
                        disabled={reorder}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:cursor-default"
                      >
                        <Thumb src={c.image_url} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[16px] font-semibold">{c.name}</span>
                          <span className="block text-[13px] text-deep/70">
                            {plural(c.product_count, "product")}
                            {c.children.length > 0 &&
                              ` · ${plural(c.children.length, "subcategory", "subcategories")}`}
                          </span>
                        </span>
                      </button>
                      {reorder ? (
                        <ReorderButtons
                          name={c.name}
                          first={i === 0}
                          last={i === data.length - 1}
                          onMove={(dir) => move(data, i, dir, null)}
                        />
                      ) : (
                        <>
                          <IconButton
                            label={`Edit ${c.name}`}
                            onClick={() => setEditing({ kind: "edit", category: c, parent: null })}
                          >
                            <Pencil size={18} />
                          </IconButton>
                          <IconButton
                            label={open ? `Collapse ${c.name}` : `Expand ${c.name}`}
                            aria-expanded={open}
                            onClick={() => toggle(c.id)}
                          >
                            <ChevronDown
                              size={22}
                              className={cn("transition-transform", open && "rotate-180")}
                            />
                          </IconButton>
                        </>
                      )}
                    </div>
                    {open && (
                      <ul className="border-t border-sand bg-cream/40">
                        {c.children.map((s, j) => (
                          <li
                            key={s.id}
                            className="flex items-center gap-2 border-b border-sand py-1 pr-1 pl-6 last:border-b-0 sm:pl-[84px]"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[15px] font-medium">
                                {s.name}
                              </span>
                              <span className="block text-[13px] text-deep/65">
                                {plural(s.product_count, "product")}
                              </span>
                            </span>
                            {reorder ? (
                              <ReorderButtons
                                name={s.name}
                                first={j === 0}
                                last={j === c.children.length - 1}
                                onMove={(dir) => move(c.children, j, dir, c.id)}
                              />
                            ) : (
                              <IconButton
                                label={`Edit ${s.name}`}
                                onClick={() => setEditing({ kind: "edit", category: s, parent: c })}
                              >
                                <Pencil size={18} />
                              </IconButton>
                            )}
                          </li>
                        ))}
                        {!reorder && (
                          <li>
                            <button
                              type="button"
                              onClick={() => setEditing({ kind: "create", parent: c })}
                              className="flex min-h-12 w-full items-center gap-2 py-2 pr-4 pl-6 text-left text-[15px] font-semibold text-forest hover:bg-sand/40 sm:pl-[84px]"
                            >
                              <Plus size={18} /> Add subcategory
                            </button>
                          </li>
                        )}
                      </ul>
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {editing && data && (
        <CategorySheet
          editing={editing}
          siblingsCount={(editing.parent ? editing.parent.children : data).length}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function ReorderButtons({
  name,
  first,
  last,
  onMove,
}: {
  name: string;
  first: boolean;
  last: boolean;
  onMove: (dir: -1 | 1) => void;
}) {
  return (
    <span className="flex shrink-0">
      <IconButton label={`Move ${name} up`} disabled={first} onClick={() => onMove(-1)}>
        <ArrowUp size={20} />
      </IconButton>
      <IconButton label={`Move ${name} down`} disabled={last} onClick={() => onMove(1)}>
        <ArrowDown size={20} />
      </IconButton>
    </span>
  );
}

function CategorySheet({
  editing,
  siblingsCount,
  onClose,
}: {
  editing: Editing;
  siblingsCount: number;
  onClose: () => void;
}) {
  const toast = useToast();
  const isEdit = editing.kind === "edit";
  const source = isEdit ? editing.category : null;
  const parent = editing.parent;
  const initial = {
    name: source?.name ?? "",
    slug: source?.slug ?? "",
    description: source?.description ?? "",
    image_url: source?.image_url ?? "",
    display_order: String(source?.display_order ?? siblingsCount + 1),
  };
  const [v, setV] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<{
    field: "slug" | "form";
    message: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState("");

  const dirty = JSON.stringify(v) !== JSON.stringify(initial);
  const maxOrder = isEdit ? siblingsCount : siblingsCount + 1;
  const errors: Record<string, string> = {};
  if (!v.name.trim()) errors.name = "Enter a name.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v.slug))
    errors.slug = "Use lowercase letters, numbers and hyphens.";
  const order = Number(v.display_order);
  if (!Number.isInteger(order) || order < 1 || order > maxOrder)
    errors.display_order = `Enter a number from 1 to ${maxOrder}.`;
  const err = (k: string) =>
    (submitted ? errors[k] : undefined) ??
    (serverError?.field === k ? serverError.message : undefined);

  const blocker = isEdit ? categoryDeleteBlocker(editing.category) : null;
  const label = parent ? "subcategory" : "category";

  const requestClose = () => (dirty ? setConfirmDiscard(true) : onClose());

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError(null);
    if (Object.keys(errors).length) return;
    const input = {
      name: v.name.trim(),
      slug: v.slug,
      description: v.description.trim(),
      image_url: v.image_url,
      display_order: order,
      parent_id: parent?.id ?? null,
    };
    setSaving(true);
    try {
      if (isEdit) await updateCategory(editing.category.id, input);
      else await createCategory(input);
      toast({ message: isEdit ? `${input.name} saved` : `${input.name} added` });
      onClose();
    } catch (e2) {
      if (e2 instanceof ApiError && e2.code.includes("SLUG"))
        setServerError({ field: "slug", message: e2.message });
      else setServerError({ field: "form", message: errorMessage(e2) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Sheet
        open={!confirmDelete && !confirmDiscard}
        onClose={requestClose}
        title={isEdit ? `Edit ${label}` : `Add ${label}`}
        description={
          parent ? (
            <>
              Parent category: <strong>{parent.name}</strong>
            </>
          ) : undefined
        }
      >
        <form onSubmit={submit} noValidate className="space-y-4">
          <TextField
            label="Name"
            data-autofocus
            value={v.name}
            error={err("name")}
            onChange={(e) => {
              const name = e.target.value;
              setV((s) => ({ ...s, name, slug: slugTouched ? s.slug : slugify(name) }));
            }}
          />
          <TextField
            label="Slug"
            value={v.slug}
            error={err("slug")}
            hint="Used in the store link. Generated from the name; you can edit it."
            className="font-mono"
            onChange={(e) => {
              setSlugTouched(true);
              setV((s) => ({ ...s, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }));
            }}
          />
          <TextAreaField
            label="Description"
            optional
            rows={2}
            value={v.description}
            onChange={(e) => setV((s) => ({ ...s, description: e.target.value }))}
          />
          <div>
            <p className="mb-1.5 text-[15px] font-semibold">Image</p>
            <div className="flex items-center gap-3">
              <Thumb src={v.image_url} />
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                tabIndex={-1}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 1_000_000) return setImageError("Choose an image under 1 MB.");
                  const reader = new FileReader();
                  reader.onload = () => {
                    setV((s) => ({ ...s, image_url: String(reader.result) }));
                    setImageError("");
                  };
                  reader.readAsDataURL(file);
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={buttonClass("secondary", "h-11 flex-1 text-[15px]")}
              >
                <ImagePlus size={18} /> Upload
              </button>
            </div>
            <TextField
              className="mt-3"
              label="Or image URL"
              optional
              type="url"
              placeholder="https://…"
              value={/^https?:/.test(v.image_url) ? v.image_url : ""}
              error={imageError || undefined}
              onChange={(e) => setV((s) => ({ ...s, image_url: e.target.value.trim() }))}
            />
          </div>
          <TextField
            label="Display order"
            inputMode="numeric"
            value={v.display_order}
            error={err("display_order")}
            hint={`1 shows first. ${maxOrder} is last.`}
            onChange={(e) =>
              setV((s) => ({ ...s, display_order: e.target.value.replace(/\D/g, "").slice(0, 3) }))
            }
          />
          {serverError?.field === "form" && (
            <p role="alert" className="text-[14px] font-medium text-brick">
              {serverError.message}
            </p>
          )}
          <button type="submit" disabled={saving} className={buttonClass("primary", "w-full")}>
            {saving ? "Saving…" : isEdit ? "Save changes" : `Add ${label}`}
          </button>

          {isEdit && (
            <div className="border-t border-sand pt-4">
              <button
                type="button"
                disabled={!!blocker}
                onClick={() => setConfirmDelete(true)}
                className={buttonClass(
                  "secondary",
                  "w-full border-brick/40 text-brick disabled:text-deep/50",
                )}
              >
                Delete {label}
              </button>
              {blocker && <p className="mt-2 text-[14px] text-deep/75">{blocker}</p>}
            </div>
          )}
        </form>
      </Sheet>

      <ConfirmSheet
        open={confirmDelete}
        title={`Delete ${source?.name}?`}
        message={`This ${label} will be removed from the store menu. This can't be undone.`}
        confirmLabel={`Delete ${label}`}
        destructive
        onConfirm={async () => {
          try {
            await deleteCategory(source!.id);
            toast({ message: `${source!.name} deleted` });
            onClose();
          } catch (e) {
            toast({ message: errorMessage(e), tone: "error" });
            setConfirmDelete(false);
          }
        }}
        onClose={() => setConfirmDelete(false)}
      />
      <ConfirmSheet
        open={confirmDiscard}
        title="Discard unsaved changes?"
        message="Your changes will be lost."
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        destructive
        onConfirm={onClose}
        onClose={() => setConfirmDiscard(false)}
      />
    </>
  );
}
