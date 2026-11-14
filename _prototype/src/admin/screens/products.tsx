import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link, Outlet, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { ImagePlus, Link2, Package, Plus, Search, Trash2, X } from "lucide-react";
import { getCategories, type CategoryNode } from "@/data/admin/categories";
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  lowestPrice,
  newVariantId,
  previewSlug,
  updateProduct,
  updateProductAvailability,
  type ProductInput,
} from "@/data/admin/products";
import { ApiError } from "@/data/admin/db";
import type { AdminProduct, AdminSpiceLevel, AdminVariant } from "@/data/admin/types";
import { ImageSlot } from "@/components/ImageSlot";
import { Tag } from "@/admin/components/chips";
import { OverflowMenu } from "@/admin/components/menu";
import { ConfirmSheet, Sheet } from "@/admin/components/sheet";
import { SplitLayout } from "@/admin/components/SplitLayout";
import { useToast } from "@/admin/components/toast";
import {
  AppBar,
  buttonClass,
  Card,
  CardTitle,
  DetailPlaceholder,
  EmptyState,
  ErrorState,
  Fab,
  FilterChips,
  IconButton,
  ListSkeleton,
  NumberStepper,
  SaveBar,
  SearchRow,
  Segmented,
  SelectField,
  Skeleton,
  Switch,
  TextAreaField,
  TextField,
  Thumb,
} from "@/admin/components/ui";
import { useUnsavedChanges } from "@/admin/components/unsaved";
import { formatINR, plural } from "@/admin/lib/format";
import { errorMessage, useApi } from "@/admin/lib/useApi";
import { useImmersive } from "@/admin/shell/ShellContext";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------- Section

export function ProductsSection() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  // Opening "Add product" from an edit page first returns to the list URL.
  const createRequest = (location.state as { create?: number } | null)?.create;
  useEffect(() => {
    if (createRequest && !id) {
      setCreating(true);
      navigate(location.pathname + location.search, { replace: true, state: null });
    }
  }, [createRequest, id, navigate, location.pathname, location.search]);

  // Opening a product (from the list or a link) replaces the add form.
  useEffect(() => {
    if (id) setCreating(false);
  }, [id]);

  const startCreate = () => {
    if (id)
      navigate(
        { pathname: "/admin/products", search: location.search },
        { state: { create: Date.now() } },
      );
    else setCreating(true);
  };

  return (
    <>
      <title>Products · SSV Admin</title>
      <SplitLayout
        hasDetail={!!id || creating}
        list={<ProductsList selectedId={id} wide={!id && !creating} onAdd={startCreate} />}
        detail={
          creating ? <ProductForm mode="create" onDone={() => setCreating(false)} /> : <Outlet />
        }
        placeholder={
          <DetailPlaceholder icon={Package} text="Select a product to edit it, or add a new one." />
        }
      />
    </>
  );
}

// ---------------------------------------------------------------- List

function ProductsList({
  selectedId,
  wide,
  onAdd,
}: {
  selectedId?: string;
  wide: boolean;
  onAdd: () => void;
}) {
  const [params, setParams] = useSearchParams();
  const filter = params.get("filter") ?? "all";
  const query = params.get("q") ?? "";
  const [searchOpen, setSearchOpen] = useState(!!query);
  const search = params.toString() ? `?${params.toString()}` : "";
  const toast = useToast();
  const products = useApi(getProducts, []);
  const categories = useApi(getCategories, []);
  const navigate = useNavigate();

  const set = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    setParams(next, { replace: true });
  };

  const catName = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories.data ?? []) {
      map.set(c.id, c.name);
      for (const s of c.children) map.set(s.id, s.name);
    }
    return map;
  }, [categories.data]);

  const all = products.data ?? [];
  const searched = all.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()));
  const list = searched.filter((p) =>
    filter === "all" ? true : filter === "unavailable" ? !p.available : p.category_id === filter,
  );
  const chipOptions = [
    { value: "all", label: "All", count: searched.length },
    ...(categories.data ?? []).map((c) => ({
      value: c.id,
      label: c.name,
      count: searched.filter((p) => p.category_id === c.id).length,
    })),
    {
      value: "unavailable",
      label: "Unavailable",
      count: searched.filter((p) => !p.available).length,
    },
  ];

  const toggle = async (p: AdminProduct, available: boolean) => {
    try {
      await updateProductAvailability(p.id, available);
      toast({
        message: `${p.name} marked ${available ? "available" : "unavailable"}`,
        action: {
          label: "Undo",
          onClick: () => {
            updateProductAvailability(p.id, !available).catch((e) =>
              toast({ message: errorMessage(e), tone: "error" }),
            );
          },
        },
      });
    } catch (e) {
      toast({ message: errorMessage(e), tone: "error" });
    }
  };

  const path = (p: AdminProduct) =>
    [catName.get(p.category_id), p.subcategory_id ? catName.get(p.subcategory_id) : null]
      .filter(Boolean)
      .join(" › ");
  const priceLine = (p: AdminProduct) => {
    const from = lowestPrice(p);
    return `${from !== null ? `From ${formatINR(from)}` : "No price"} · ${plural(p.variants.length, "size")}`;
  };

  return (
    <>
      <AppBar
        title="Products"
        actions={
          <>
            <IconButton
              label={searchOpen ? "Close search" : "Search products"}
              aria-pressed={searchOpen}
              onClick={() => {
                if (searchOpen) set("q", null);
                setSearchOpen((v) => !v);
              }}
            >
              <Search size={22} />
            </IconButton>
            <button
              type="button"
              onClick={onAdd}
              className={buttonClass("primary", "mr-1 h-11 px-4 text-[15px] max-md:hidden")}
            >
              <Plus size={18} /> Add product
            </button>
          </>
        }
      >
        {searchOpen && (
          <SearchRow
            label="Search products by name"
            placeholder="Search by product name"
            value={query}
            onChange={(v) => set("q", v || null)}
          />
        )}
        <FilterChips
          label="Filter products"
          value={filter}
          onChange={(v) => set("filter", v === "all" ? null : v)}
          options={chipOptions}
        />
      </AppBar>

      <div className="p-4 pb-24 md:pb-4">
        {products.loading && !products.data ? (
          <ListSkeleton />
        ) : products.error && !products.data ? (
          <ErrorState message={errorMessage(products.error)} onRetry={products.retry} />
        ) : list.length === 0 ? (
          <EmptyState
            icon={query ? Search : Package}
            title={
              query
                ? `No products match “${query}”`
                : filter === "unavailable"
                  ? "Everything is available"
                  : "No products in this category"
            }
            text={
              query
                ? "Check the spelling or try a shorter name."
                : "Add a product to start selling here."
            }
            action={
              !query && filter !== "unavailable" ? (
                <button type="button" onClick={onAdd} className={buttonClass("primary")}>
                  <Plus size={18} /> Add product
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <Card className={cn("divide-y divide-sand overflow-hidden", wide && "lg:hidden")}>
              {list.map((p) => (
                <div
                  key={p.id}
                  className={cn(
                    "relative flex items-center gap-3 p-3",
                    p.id === selectedId && "bg-leaf/10",
                  )}
                >
                  <Link
                    to={`/admin/products/${p.id}${search}`}
                    aria-current={p.id === selectedId ? "true" : undefined}
                    className={cn(
                      "flex min-w-0 flex-1 items-center gap-3",
                      !p.available && "opacity-55",
                    )}
                  >
                    <Thumb src={p.image_url} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[16px] font-semibold">{p.name}</span>
                      <span className="block truncate text-[13px] text-deep/70">{path(p)}</span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[13px] tabular-nums text-deep/80">
                        {priceLine(p)}
                        {p.badge && <Tag tone="badge">{p.badge}</Tag>}
                      </span>
                    </span>
                  </Link>
                  <Switch
                    label={`${p.name} available`}
                    checked={p.available}
                    onChange={(v) => toggle(p, v)}
                  />
                </div>
              ))}
            </Card>

            {wide && (
              <Card className="hidden overflow-hidden lg:block">
                <table className="w-full text-left text-[14px]">
                  <thead className="border-b border-sand bg-sand/40 text-[12px] tracking-[0.04em] text-deep/70 uppercase">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Product</th>
                      <th className="px-4 py-3 font-semibold">Category</th>
                      <th className="px-4 py-3 font-semibold">Price</th>
                      <th className="px-4 py-3 font-semibold">Badge</th>
                      <th className="px-4 py-3 text-right font-semibold">Available</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand">
                    {list.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => navigate(`/admin/products/${p.id}${search}`)}
                        className="cursor-pointer hover:bg-sand/30"
                      >
                        <td className={cn("px-4 py-2", !p.available && "opacity-55")}>
                          <Link
                            to={`/admin/products/${p.id}${search}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-3 font-semibold hover:underline"
                          >
                            <Thumb src={p.image_url} size={44} />
                            {p.name}
                          </Link>
                        </td>
                        <td className={cn("px-4 py-2 text-deep/80", !p.available && "opacity-55")}>
                          {path(p)}
                        </td>
                        <td className={cn("px-4 py-2 tabular-nums", !p.available && "opacity-55")}>
                          {priceLine(p)}
                        </td>
                        <td className="px-4 py-2">
                          {p.badge ? (
                            <Tag tone="badge">{p.badge}</Tag>
                          ) : (
                            <span className="text-deep/40">–</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                          <Switch
                            label={`${p.name} available`}
                            checked={p.available}
                            onChange={(v) => toggle(p, v)}
                            className="ml-auto"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </>
        )}
      </div>
      <Fab label="Add product" onClick={onAdd} icon={<Plus size={26} />} />
    </>
  );
}

// ---------------------------------------------------------------- Form

export function ProductEditRoute() {
  const { id } = useParams();
  const { data, loading, error, retry } = useApi(() => getProductById(id!), [id]);
  const location = useLocation();
  // Load once per product so the form keeps its own state while editing.
  const [initial, setInitial] = useState<AdminProduct | null | undefined>(undefined);
  useEffect(() => {
    if (data !== undefined && initial === undefined) setInitial(data);
  }, [data, initial]);
  useImmersive();

  if (initial === undefined) {
    if (error && !loading) {
      return (
        <>
          <AppBar title="Edit product" backTo={`/admin/products${location.search}`} />
          <ErrorState message={errorMessage(error)} onRetry={retry} />
        </>
      );
    }
    return (
      <>
        <AppBar title="Edit product" backTo={`/admin/products${location.search}`} />
        <div className="space-y-3 p-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </>
    );
  }
  if (initial === null) {
    return (
      <>
        <AppBar title="Product not found" backTo={`/admin/products${location.search}`} />
        <EmptyState
          icon={Package}
          title="We couldn't find this product"
          text="It may have been deleted."
          action={
            <Link to="/admin/products" className={buttonClass("secondary")}>
              All products
            </Link>
          }
        />
      </>
    );
  }
  return <ProductForm key={initial.id} mode="edit" product={initial} />;
}

type BadgeMode = "none" | "New" | "Bestseller" | "custom";

interface ProductDraft {
  name: string;
  description: string;
  story: string;
  image_url: string;
  category_id: string;
  subcategory_id: string;
  badgeMode: BadgeMode;
  customBadge: string;
  spice_level: AdminSpiceLevel;
  shelf_life_months: number;
  ingredients: string[];
  available: boolean;
  variants: (Omit<AdminVariant, "price" | "weight_g"> & {
    price: string;
    weight_g: string;
    badge: string;
  })[];
}

function toDraft(p?: AdminProduct): ProductDraft {
  const badge = p?.badge ?? null;
  return {
    name: p?.name ?? "",
    description: p?.description ?? "",
    story: p?.story ?? "",
    image_url: p?.image_url ?? "",
    category_id: p?.category_id ?? "",
    subcategory_id: p?.subcategory_id ?? "",
    badgeMode: !badge ? "none" : badge === "New" || badge === "Bestseller" ? badge : "custom",
    customBadge: badge && badge !== "New" && badge !== "Bestseller" ? badge : "",
    spice_level: p?.spice_level ?? "none",
    shelf_life_months: p?.shelf_life_months ?? 12,
    ingredients: p?.ingredients ?? [],
    available: p?.available ?? true,
    variants: (
      p?.variants ?? [
        { id: newVariantId(), label: "", weight_g: 0, price: 0, badge: null, available: true },
      ]
    ).map((v) => ({
      ...v,
      price: v.price ? String(v.price) : "",
      weight_g: v.weight_g ? String(v.weight_g) : "",
      badge: v.badge ?? "",
    })),
  };
}

function validateDraft(d: ProductDraft) {
  const errors: Record<string, string> = {};
  if (!d.name.trim()) errors.name = "Enter a product name.";
  if (!d.category_id) errors.category_id = "Choose a category.";
  if (d.badgeMode === "custom" && !d.customBadge.trim())
    errors.customBadge = "Enter the badge text, or choose None.";
  if (!d.variants.length) errors.variants = "Add at least one size.";
  d.variants.forEach((v, i) => {
    if (!v.label.trim()) errors[`v${i}.label`] = "Enter a size label, e.g. 500 g.";
    if (!(Number(v.price) > 0)) errors[`v${i}.price`] = "Enter a price above ₹0.";
  });
  return errors;
}

function ProductForm({
  mode,
  product,
  onDone,
}: {
  mode: "create" | "edit";
  product?: AdminProduct;
  onDone?: () => void;
}) {
  useImmersive();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const categories = useApi(getCategories, []);
  const initial = useMemo(() => toDraft(product), [product]);
  const [d, setD] = useState<ProductDraft>(initial);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ingredient, setIngredient] = useState("");
  const [imageUrlInput, setImageUrlInput] = useState(
    /^https?:/.test(initial.image_url) ? initial.image_url : "",
  );
  const [imageError, setImageError] = useState("");
  const [discardOpen, setDiscardOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [blockedOpen, setBlockedOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const dirty = JSON.stringify(d) !== JSON.stringify(initial);
  const guard = useUnsavedChanges(dirty);
  const errors = validateDraft(d);
  const err = (k: string) => (submitted ? errors[k] : undefined);
  const set = <K extends keyof ProductDraft>(k: K, v: ProductDraft[K]) =>
    setD((s) => ({ ...s, [k]: v }));
  const listUrl = `/admin/products${location.search}`;

  const category: CategoryNode | undefined = categories.data?.find((c) => c.id === d.category_id);
  const slug = d.name.trim() ? previewSlug(d.name, product?.id) : "";
  const storePrice = lowestPrice({
    variants: d.variants.map((v) => ({
      ...v,
      price: Number(v.price) || 0,
      weight_g: Number(v.weight_g) || 0,
      badge: v.badge || null,
    })),
  });

  const close = () => {
    if (mode === "create") onDone?.();
    else navigate(listUrl);
  };
  const cancel = () => (dirty ? setDiscardOpen(true) : close());

  const updateVariant = (i: number, patch: Partial<ProductDraft["variants"][number]>) =>
    setD((s) => ({ ...s, variants: s.variants.map((v, j) => (j === i ? { ...v, ...patch } : v)) }));

  const addIngredient = () => {
    const value = ingredient.trim();
    if (value && !d.ingredients.some((x) => x.toLowerCase() === value.toLowerCase()))
      set("ingredients", [...d.ingredients, value]);
    setIngredient("");
  };

  const onFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return setImageError("Choose an image file (JPG, PNG or WebP).");
    if (file.size > 1_500_000)
      return setImageError("This image is over 1.5 MB. Choose a smaller one.");
    const reader = new FileReader();
    reader.onload = () => {
      set("image_url", String(reader.result));
      setImageUrlInput("");
      setImageError("");
    };
    reader.readAsDataURL(file);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const first = Object.keys(errors)[0];
    if (first) {
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      );
      return;
    }
    const input: ProductInput = {
      name: d.name.trim(),
      description: d.description.trim(),
      story: d.story.trim(),
      image_url: d.image_url,
      category_id: d.category_id,
      subcategory_id: d.subcategory_id || null,
      badge:
        d.badgeMode === "none"
          ? null
          : d.badgeMode === "custom"
            ? d.customBadge.trim()
            : d.badgeMode,
      spice_level: d.spice_level,
      shelf_life_months: d.shelf_life_months,
      ingredients: d.ingredients,
      available: d.available,
      variants: d.variants.map((v) => ({
        id: v.id,
        label: v.label.trim(),
        weight_g: Number(v.weight_g) || 0,
        price: Number(v.price),
        badge: v.badge.trim() || null,
        available: v.available,
      })),
    };
    setSaving(true);
    try {
      if (mode === "create") {
        const created = await createProduct(input);
        guard.allowLeave();
        toast({
          message: `${created.name} added`,
          action: { label: "View", onClick: () => navigate(`/admin/products/${created.id}`) },
        });
        onDone?.();
      } else {
        await updateProduct(product!.id, input);
        guard.allowLeave();
        toast({ message: "Product saved" });
        navigate(listUrl);
      }
    } catch (e2) {
      toast({ message: errorMessage(e2), tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await deleteProduct(product!.id);
      guard.allowLeave();
      setDeleteOpen(false);
      toast({ message: `${product!.name} deleted` });
      navigate(listUrl);
    } catch (e) {
      setDeleteOpen(false);
      if (e instanceof ApiError && e.code === "IN_PAST_ORDERS") setBlockedOpen(true);
      else toast({ message: errorMessage(e), tone: "error" });
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      noValidate
      className="flex min-h-svh flex-col md:min-h-full"
    >
      <AppBar
        title={mode === "create" ? "Add product" : "Edit product"}
        onBack={cancel}
        backLabel="Close form"
        backAlways
        actions={
          mode === "edit" ? (
            <OverflowMenu
              items={[
                { label: "Delete product", danger: true, onClick: () => setDeleteOpen(true) },
              ]}
            />
          ) : undefined
        }
      />

      <div className="flex-1 space-y-3 p-4">
        {/* Image */}
        <Card className="p-4">
          <CardTitle>Image</CardTitle>
          <div className="flex gap-4">
            <div className="aspect-[4/5] w-32 shrink-0 overflow-hidden rounded-[10px] border border-sand bg-sand sm:w-40">
              <ImageSlot
                src={d.image_url}
                alt={d.name ? `${d.name} photo` : "Product photo"}
                size="compact"
                className="bg-sand"
              />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                tabIndex={-1}
                onChange={(e) => onFile(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={buttonClass("secondary", "h-11 w-full text-[15px]")}
              >
                <ImagePlus size={18} /> Upload image
              </button>
              {d.image_url && (
                <button
                  type="button"
                  onClick={() => {
                    set("image_url", "");
                    setImageUrlInput("");
                  }}
                  className={buttonClass("ghost", "w-full text-brick")}
                >
                  <X size={18} /> Remove image
                </button>
              )}
              <p className="text-[13px] text-deep/65">4:5 photo, under 1.5 MB.</p>
            </div>
          </div>
          <TextField
            className="mt-4"
            label="Or paste image URL"
            optional
            type="url"
            inputMode="url"
            placeholder="https://…"
            value={imageUrlInput}
            error={imageError || undefined}
            suffix={<Link2 size={18} className="text-deep/50" />}
            onChange={(e) => {
              const value = e.target.value.trim();
              setImageUrlInput(e.target.value);
              if (!value) return setImageError("");
              if (/^https?:\/\/\S+\.\S+/.test(value)) {
                set("image_url", value);
                setImageError("");
              } else setImageError("Paste a full link starting with https://");
            }}
          />
        </Card>

        {/* Basics */}
        <Card className="space-y-4 p-4">
          <CardTitle>Basics</CardTitle>
          <div>
            <TextField
              label="Product name"
              value={d.name}
              error={err("name")}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Cold Pressed Sesame Oil"
            />
            <p className="mt-1.5 truncate text-[13px] text-deep/65">
              Slug: <span className="font-mono">{slug || "generated from the name"}</span>
            </p>
          </div>
          <TextAreaField
            label="Description"
            value={d.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
          />
          <TextAreaField
            label="Brand story"
            optional
            value={d.story}
            onChange={(e) => set("story", e.target.value)}
            rows={3}
          />
          <SelectField
            label="Category"
            value={d.category_id}
            error={err("category_id")}
            onChange={(e) =>
              setD((s) => ({ ...s, category_id: e.target.value, subcategory_id: "" }))
            }
          >
            <option value="">Choose a category</option>
            {(categories.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Subcategory"
            optional
            value={d.subcategory_id}
            disabled={!category || category.children.length === 0}
            hint={
              category && category.children.length === 0
                ? `${category.name} has no subcategories.`
                : undefined
            }
            onChange={(e) => set("subcategory_id", e.target.value)}
          >
            <option value="">None</option>
            {(category?.children ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </SelectField>
          <div>
            <p className="mb-1.5 flex justify-between text-[15px] font-semibold">
              Badge <span className="text-[13px] font-normal text-deep/60">Optional</span>
            </p>
            <Segmented
              label="Badge"
              value={d.badgeMode}
              onChange={(v) => set("badgeMode", v)}
              options={[
                { value: "none", label: "None" },
                { value: "New", label: "New" },
                { value: "Bestseller", label: "Bestseller" },
                { value: "custom", label: "Custom" },
              ]}
            />
            {d.badgeMode === "custom" && (
              <TextField
                className="mt-2"
                label="Badge text"
                value={d.customBadge}
                error={err("customBadge")}
                maxLength={20}
                onChange={(e) => set("customBadge", e.target.value)}
                placeholder="e.g. Seasonal"
              />
            )}
          </div>
          <div>
            <p className="mb-1.5 text-[15px] font-semibold">Spice level</p>
            <Segmented
              label="Spice level"
              value={d.spice_level}
              onChange={(v) => set("spice_level", v)}
              options={[
                { value: "none", label: "None" },
                { value: "mild", label: "Mild" },
                { value: "medium", label: "Medium" },
                { value: "hot", label: "Hot" },
              ]}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[15px] font-semibold">Shelf life</p>
            <NumberStepper
              label="shelf life in months"
              value={d.shelf_life_months}
              min={1}
              max={60}
              suffix="months"
              onChange={(v) => set("shelf_life_months", v)}
            />
          </div>
          <div>
            <TextField
              label="Ingredients"
              hint="Press Enter to add each ingredient."
              value={ingredient}
              placeholder="e.g. Sesame seeds"
              onChange={(e) => setIngredient(e.target.value)}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addIngredient();
                }
              }}
              suffix={
                <button
                  type="button"
                  onClick={addIngredient}
                  className="h-10 rounded-[8px] px-3 text-[14px] font-semibold text-forest hover:bg-sand/60"
                >
                  Add
                </button>
              }
            />
            {d.ingredients.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-2">
                {d.ingredients.map((x) => (
                  <li key={x}>
                    <button
                      type="button"
                      onClick={() =>
                        set(
                          "ingredients",
                          d.ingredients.filter((i) => i !== x),
                        )
                      }
                      aria-label={`Remove ${x}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-sand pr-2.5 pl-3.5 text-[14px] font-medium"
                    >
                      {x} <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-sand pt-3">
            <div>
              <p className="text-[15px] font-semibold">Available</p>
              <p className="text-[13px] text-deep/65">Customers can buy it in the store</p>
            </div>
            <Switch label="Available" checked={d.available} onChange={(v) => set("available", v)} />
          </div>
        </Card>

        {/* Variants */}
        <Card className="space-y-3 p-4">
          <CardTitle>Sizes</CardTitle>
          <p className="rounded-[10px] bg-sand/50 px-3 py-2 text-[14px]">
            Saving replaces the full list of sizes.
          </p>
          {err("variants") && (
            <p role="alert" className="text-[13px] font-medium text-brick">
              {err("variants")}
            </p>
          )}
          {d.variants.map((v, i) => (
            <fieldset key={v.id} className="space-y-3 rounded-[12px] border border-sand p-3">
              <legend className="sr-only">Size {i + 1}</legend>
              <div className="flex items-center justify-between">
                <p className="text-[14px] font-semibold text-deep/70">Size {i + 1}</p>
                <button
                  type="button"
                  disabled={d.variants.length === 1}
                  onClick={() =>
                    set(
                      "variants",
                      d.variants.filter((_, j) => j !== i),
                    )
                  }
                  className="inline-flex h-11 items-center gap-1.5 rounded-[10px] px-2 text-[14px] font-semibold text-brick hover:bg-brick/5 disabled:opacity-40"
                  title={d.variants.length === 1 ? "A product needs at least one size" : undefined}
                >
                  <Trash2 size={16} /> Remove
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <TextField
                  label="Label"
                  value={v.label}
                  error={err(`v${i}.label`)}
                  placeholder="500 g"
                  onChange={(e) => updateVariant(i, { label: e.target.value })}
                />
                <TextField
                  label="Weight"
                  inputMode="numeric"
                  value={v.weight_g}
                  placeholder="500"
                  suffix={<span className="pr-1.5 text-[14px] text-deep/60">g</span>}
                  onChange={(e) =>
                    updateVariant(i, { weight_g: e.target.value.replace(/\D/g, "").slice(0, 6) })
                  }
                />
                <TextField
                  label="Price"
                  prefix="₹"
                  inputMode="numeric"
                  value={v.price}
                  error={err(`v${i}.price`)}
                  placeholder="0"
                  onChange={(e) =>
                    updateVariant(i, { price: e.target.value.replace(/\D/g, "").slice(0, 6) })
                  }
                />
                <TextField
                  label="Badge"
                  optional
                  value={v.badge}
                  placeholder="Best Value"
                  maxLength={16}
                  onChange={(e) => updateVariant(i, { badge: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[15px] font-medium">Available</p>
                <Switch
                  label={`Size ${i + 1} available`}
                  checked={v.available}
                  onChange={(next) => updateVariant(i, { available: next })}
                />
              </div>
            </fieldset>
          ))}
          <button
            type="button"
            onClick={() =>
              set("variants", [
                ...d.variants,
                {
                  id: newVariantId(),
                  label: "",
                  weight_g: "",
                  price: "",
                  badge: "",
                  available: true,
                },
              ])
            }
            className={buttonClass("secondary", "h-11 w-full text-[15px]")}
          >
            <Plus size={18} /> Add size
          </button>
          <p aria-live="polite" className="text-[15px]">
            Shown in the store as:{" "}
            <strong className="tabular-nums">
              {storePrice !== null ? `From ${formatINR(storePrice)}` : "add a price"}
            </strong>
          </p>
          <p className="text-[13px] text-deep/60">
            Prices are final customer prices and include delivery.
          </p>
        </Card>
      </div>

      <SaveBar
        onCancel={cancel}
        saving={saving}
        saveLabel={mode === "create" ? "Add product" : "Save changes"}
      />

      {guard.sheet}
      <ConfirmSheet
        open={discardOpen}
        title="Discard unsaved changes?"
        message="Your changes to this product will be lost."
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        destructive
        onConfirm={() => {
          guard.allowLeave();
          setDiscardOpen(false);
          close();
        }}
        onClose={() => setDiscardOpen(false)}
      />
      <ConfirmSheet
        open={deleteOpen}
        title={`Delete ${product?.name}?`}
        message="It will be removed from the store. This can't be undone."
        confirmLabel="Delete product"
        destructive
        onConfirm={remove}
        onClose={() => setDeleteOpen(false)}
      />
      <Sheet
        open={blockedOpen}
        onClose={() => setBlockedOpen(false)}
        title="Can't delete this product"
      >
        <p className="text-[15px]">This product is part of past orders and can't be deleted</p>
        <p className="mt-1 text-[14px] text-deep/70">
          Mark it unavailable to hide it from the store while keeping order records.
        </p>
        <div className="mt-5 grid gap-2">
          <button
            type="button"
            onClick={async () => {
              try {
                await updateProductAvailability(product!.id, false);
                set("available", false);
                setBlockedOpen(false);
                toast({ message: `${product!.name} marked unavailable` });
              } catch (e) {
                toast({ message: errorMessage(e), tone: "error" });
              }
            }}
            className={buttonClass("primary", "w-full")}
          >
            Mark unavailable instead
          </button>
          <button
            type="button"
            onClick={() => setBlockedOpen(false)}
            className={buttonClass("secondary", "w-full")}
          >
            Keep product
          </button>
        </div>
      </Sheet>
    </form>
  );
}
