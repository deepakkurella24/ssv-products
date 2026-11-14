"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate, useParams, useSearchParams } from "@/components/admin/router-compat";
import { ImagePlus, Link2, Package, Plus, Search, Trash2, X, Loader2 } from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinary";
import {
  lowestPrice,
  newVariantId,
  previewSlug,
} from "@/lib/admin/helpers";
import {
  adminGetCategories as getCategories,
  adminGetProducts as getProducts,
  adminGetProduct as getProductById,
  adminCreateProduct as createProduct,
  adminUpdateProduct as updateProduct,
  adminDeleteProduct as deleteProduct,
} from "@/lib/api/admin";
import { ImageSlot } from "@/components/ImageSlot";
import { Tag } from "@/components/admin/chips";
import { OverflowMenu } from "@/components/admin/menu";
import { ConfirmSheet, FormModal, Sheet } from "@/components/admin/sheet";
import { useToast } from "@/components/admin/toast";
import {
  AppBar,
  buttonClass,
  Card,
  CardTitle,
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
  Thumb
} from "@/components/admin/ui";
import { useUnsavedChanges } from "@/components/admin/unsaved";
import { formatINR, plural } from "@/lib/admin/format";
import { errorMessage, useApi } from "@/lib/admin/useApi";
import { useImmersive } from "@/components/admin/shell/ShellContext";
import { cn } from "@/lib/utils";

const updateProductAvailability = (id, available) =>
  updateProduct(id, { available });
export function ProductsSection() {
  const location = useLocation();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const cancelFormRef = useRef(null);
  const startCreate = () => {
    cancelFormRef.current = null;
    setEditingId(null);
    setCreating(true);
  };
  const startEdit = (product) => {
    cancelFormRef.current = null;
    setCreating(false);
    setEditingId(product.id);
  };
  const closeForm = () => {
    cancelFormRef.current = null;
    setCreating(false);
    setEditingId(null);
    setRefreshKey((key) => key + 1);
  };
  useEffect(() => {
    if (location.pathname === "/admin/products/new") {
      setCreating(true);
      navigate("/admin/products", { replace: true });
    }
  }, [location.pathname, navigate]);
  return <>
      <title>Products · SSV Admin</title>
      <ProductsList key={refreshKey} onAdd={startCreate} onEdit={startEdit} />
      <FormModal
        open={creating || !!editingId}
        onClose={() => {
          if (cancelFormRef.current) cancelFormRef.current();
          else {
            setCreating(false);
            setEditingId(null);
          }
        }}
      >
        {creating && (
          <ProductForm
            mode="create"
            onDone={() => {
              closeForm();
            }}
            onCancelRef={cancelFormRef}
          />
        )}
        {editingId && <ProductEditForm key={editingId} id={editingId} onDone={closeForm} onCancelRef={cancelFormRef} />}
      </FormModal>
      <Outlet />
    </>;
}
function ProductsList({ onAdd, onEdit }) {
  const [params, setParams] = useSearchParams();
  const filter = params.get("filter") ?? "all";
  const query = params.get("q") ?? "";
  const [searchOpen, setSearchOpen] = useState(!!query);
  const toast = useToast();
  const products = useApi(getProducts, []);
  const categories = useApi(getCategories, []);
  const set = (k, v) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    setParams(next, { replace: true });
  };
  const catName = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const c of categories.data ?? []) {
      map.set(c.id, c.name);
      for (const s of c.children ?? []) map.set(s.id, s.name);
    }
    return map;
  }, [categories.data]);
  const all = products.data ?? [];
  const searched = all.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()));
  const list = searched.filter(
    (p) => filter === "all" ? true : filter === "unavailable" ? !p.available : p.category_id === filter
  );
  const chipOptions = [
    { value: "all", label: "All", count: searched.length },
    ...(categories.data ?? []).map((c) => ({
      value: c.id,
      label: c.name,
      count: searched.filter((p) => p.category_id === c.id).length
    })),
    {
      value: "unavailable",
      label: "Unavailable",
      count: searched.filter((p) => !p.available).length
    }
  ];
  const toggle = async (p, available) => {
    try {
      const updated = await updateProductAvailability(p.id, available);
      products.mutate((current) => current?.map((item) =>
        item.id === p.id ? { ...item, available: updated?.available ?? available } : item
      ));
      toast({
        message: `${p.name} marked ${available ? "available" : "unavailable"}`,
        action: {
          label: "Undo",
          onClick: () => {
            updateProductAvailability(p.id, !available)
              .then((result) => products.mutate((current) => current?.map((item) =>
                item.id === p.id ? { ...item, available: result?.available ?? !available } : item
              )))
              .catch((e) => toast({ message: errorMessage(e), tone: "error" }));
          }
        }
      });
    } catch (e) {
      toast({ message: errorMessage(e), tone: "error" });
    }
  };
  const path = (p) => [catName.get(p.category_id), p.subcategory_id ? catName.get(p.subcategory_id) : null].filter(Boolean).join(" \u203A ");
  const priceLine = (p) => {
    const from = lowestPrice(p);
    return `${from !== null ? `From ${formatINR(from)}` : "No price"} \xB7 ${plural(p.variants.length, "size")}`;
  };
  return <>
      <AppBar
    title="Products"
    actions={<>
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
          </>}
  >
        {searchOpen && <SearchRow
    label="Search products by name"
    placeholder="Search by product name"
    value={query}
    onChange={(v) => set("q", v || null)}
  />}
        <FilterChips
    label="Filter products"
    value={filter}
    onChange={(v) => set("filter", v === "all" ? null : v)}
    options={chipOptions}
  />
      </AppBar>

      <div className="p-4 pb-24 md:pb-4">
        {products.loading && !products.data ? <ListSkeleton /> : products.error && !products.data ? <ErrorState message={errorMessage(products.error)} onRetry={products.retry} /> : list.length === 0 ? <EmptyState
    icon={query ? Search : Package}
    title={query ? `No products match \u201C${query}\u201D` : filter === "unavailable" ? "Everything is available" : "No products in this category"}
    text={query ? "Check the spelling or try a shorter name." : "Add a product to start selling here."}
    action={!query && filter !== "unavailable" ? <button type="button" onClick={onAdd} className={buttonClass("primary")}>
                  <Plus size={18} /> Add product
                </button> : void 0}
  /> : <>
            <Card className="divide-y divide-sand overflow-hidden lg:hidden">
              {list.map((p) => <div
    key={p.id}
    className="relative flex items-center gap-3 p-3"
  >
                  <button
    type="button"
    onClick={() => onEdit(p)}
    className={cn(
      "flex min-w-0 flex-1 items-center gap-3 text-left",
      !p.available && "opacity-55"
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
                  </button>
                  <Switch
    label={`${p.name} available`}
    checked={p.available}
    onChange={(v) => toggle(p, v)}
  />
                </div>)}
            </Card>

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
                    {list.map((p) => <tr
    key={p.id}
    onClick={() => onEdit(p)}
    className="cursor-pointer hover:bg-sand/30"
  >
                        <td className={cn("px-4 py-2", !p.available && "opacity-55")}>
                          <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onEdit(p);
    }}
    className="flex items-center gap-3 font-semibold hover:underline"
  >
                            <Thumb src={p.image_url} size={44} />
                            {p.name}
                          </button>
                        </td>
                        <td className={cn("px-4 py-2 text-deep/80", !p.available && "opacity-55")}>
                          {path(p)}
                        </td>
                        <td className={cn("px-4 py-2 tabular-nums", !p.available && "opacity-55")}>
                          {priceLine(p)}
                        </td>
                        <td className="px-4 py-2">
                          {p.badge ? <Tag tone="badge">{p.badge}</Tag> : <span className="text-deep/40">–</span>}
                        </td>
                        <td className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                          <Switch
    label={`${p.name} available`}
    checked={p.available}
    onChange={(v) => toggle(p, v)}
    className="ml-auto"
  />
                        </td>
                      </tr>)}
                  </tbody>
                </table>
              </Card>
          </>}
      </div>
      <Fab label="Add product" onClick={onAdd} icon={<Plus size={26} />} />
    </>;
}
function ProductEditForm({ id, onDone, onCancelRef }) {
  const { data, loading, error, retry } = useApi(() => getProductById(id), [id]);
  if (loading && data === undefined) {
    return <>
      <AppBar title="Edit product" onBack={onDone} backLabel="Close form" backAlways />
      <div className="space-y-3 p-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
      </>;
  }
  if (error) return <><AppBar title="Edit product" onBack={onDone} backLabel="Close form" backAlways /><div className="p-4"><ErrorState message={errorMessage(error)} onRetry={retry} /></div></>;
  if (data === null) {
    return <>
        <AppBar title="Edit product" onBack={onDone} backLabel="Close form" backAlways />
        <EmptyState
      icon={Package}
      title="We couldn't find this product"
      text="It may have been deleted."
    />
      </>;
  }
  if (!data) return null;
  return <ProductForm key={data.id} mode="edit" product={data} onDone={onDone} onCancelRef={onCancelRef} />;
}
export function ProductEditRoute() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const cancelRef = useRef(null);
  const close = () => navigate(`/admin/products${location.search}`);
  return <FormModal open onClose={() => (cancelRef.current ? cancelRef.current() : close())}>
    <ProductEditForm id={id} onDone={close} onCancelRef={cancelRef} />
  </FormModal>;
}
function toDraft(p) {
  const badge = p?.badge ?? null;
  return {
    name: p?.name ?? "",
    description: p?.description ?? "",
    story: p?.story ?? "",
    image_url: p?.image_url ?? "",
    gallery: Array.isArray(p?.gallery) ? p.gallery.slice(0, 3) : [],
    category_id: p?.category_id ?? "",
    subcategory_id: p?.subcategory_id ?? "",
    badgeMode: !badge ? "none" : badge === "New" || badge === "Bestseller" ? badge : "custom",
    customBadge: badge && badge !== "New" && badge !== "Bestseller" ? badge : "",
    shelf_life_months: p?.shelf_life_months ?? 12,
    ingredients: p?.ingredients ?? [],
    available: p?.available ?? true,
    variants: (p?.variants ?? [
      { id: newVariantId(), label: "", weight_g: 0, price: 0, badge: null, available: true }
    ]).map((v) => ({
      ...v,
      price: v.price ? String(v.price) : "",
      weight_g: v.weight_g ? String(v.weight_g) : "",
      badge: v.badge ?? ""
    }))
  };
}
function validateDraft(d) {
  const errors = {};
  if (!d.name.trim()) errors.name = "Enter a product name.";
  if (!d.category_id) errors.category_id = "Choose a category.";
  if (d.badgeMode === "custom" && !d.customBadge.trim())
    errors.customBadge = "Enter the badge text, or choose None.";
  if (!d.variants.length) errors.variants = "Add at least one size.";
  d.variants.forEach((v, i) => {
    if (!v.label.trim()) errors[`v${i}.label`] = "Enter a size label, e.g. 500 g.";
    if (!(Number(v.price) > 0)) errors[`v${i}.price`] = "Enter a price above \u20B90.";
  });
  return errors;
}
export function ProductForm({
  mode,
  product,
  onDone,
  onCancelRef
}) {
  useImmersive();
  const toast = useToast();
  const categories = useApi(getCategories, []);
  const initial = useMemo(() => toDraft(product), [product]);
  const [d, setD] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ingredient, setIngredient] = useState("");
  const [imageUrlInput, setImageUrlInput] = useState(
    /^https?:/.test(initial.image_url) ? initial.image_url : ""
  );
  const [imageError, setImageError] = useState("");
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [galleryUrlInput, setGalleryUrlInput] = useState("");
  const [galleryError, setGalleryError] = useState("");
  const [discardOpen, setDiscardOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [blockedOpen, setBlockedOpen] = useState(false);
  const fileRef = useRef(null);
  const galleryFileRef = useRef(null);
  const formRef = useRef(null);
  const dirty = JSON.stringify(d) !== JSON.stringify(initial);
  const guard = useUnsavedChanges(dirty);
  const errors = validateDraft(d);
  const err = (k) => submitted ? errors[k] : void 0;
  const set = (k, v) => setD((s) => ({ ...s, [k]: v }));
  const category = categories.data?.find((c) => c.id === d.category_id);
  const slug = d.name.trim() ? previewSlug(d.name, product?.id) : "";
  const storePrice = lowestPrice({
    variants: d.variants.map((v) => ({
      ...v,
      price: Number(v.price) || 0,
      weight_g: Number(v.weight_g) || 0,
      badge: v.badge || null
    }))
  });
  const close = () => onDone?.();
  const cancel = () => dirty ? setDiscardOpen(true) : close();

  useEffect(() => {
    if (onCancelRef) onCancelRef.current = cancel;
  });
  const updateVariant = (i, patch) => setD((s) => ({ ...s, variants: s.variants.map((v, j) => j === i ? { ...v, ...patch } : v) }));
  const addIngredient = () => {
    const value = ingredient.trim();
    if (value && !d.ingredients.some((x) => x.toLowerCase() === value.toLowerCase()))
      set("ingredients", [...d.ingredients, value]);
    setIngredient("");
  };
  const onFile = async (file) => {
    if (!file) return;
    setImageError("");
    setUploadingMain(true);
    try {
      const url = await uploadToCloudinary(file);
      set("image_url", url);
      setImageUrlInput(url);
      toast({ message: "Main image uploaded" });
    } catch (err) {
      setImageError(err.message || "Failed to upload image.");
      toast({ message: err.message || "Failed to upload image.", tone: "error" });
    } finally {
      setUploadingMain(false);
    }
  };
  const onGalleryFile = async (file) => {
    if (!file) return;
    const current = d.gallery || [];
    if (current.length >= 3) {
      toast({ message: "You can add up to 3 gallery images.", tone: "error" });
      return;
    }
    setGalleryError("");
    setUploadingGallery(true);
    try {
      const url = await uploadToCloudinary(file);
      set("gallery", [...current, url].slice(0, 3));
      toast({ message: "Gallery image uploaded" });
    } catch (err) {
      setGalleryError(err.message || "Failed to upload gallery image.");
      toast({ message: err.message || "Failed to upload gallery image.", tone: "error" });
    } finally {
      setUploadingGallery(false);
    }
  };
  const addGalleryUrl = () => {
    const val = galleryUrlInput.trim();
    if (!val) return;
    const current = d.gallery || [];
    if (current.length >= 3) {
      setGalleryError("Maximum 3 gallery images allowed.");
      return;
    }
    if (!/^https?:\/\/\S+\.\S+/.test(val)) {
      setGalleryError("Paste a full link starting with https://");
      return;
    }
    set("gallery", [...current, val].slice(0, 3));
    setGalleryUrlInput("");
    setGalleryError("");
  };
  const removeGalleryImage = (idx) => {
    set("gallery", (d.gallery || []).filter((_, i) => i !== idx));
  };
  const submit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    const first = Object.keys(errors)[0];
    if (first) {
      requestAnimationFrame(
        () => formRef.current?.querySelector('[aria-invalid="true"]')?.focus()
      );
      return;
    }
    const input = {
      name: d.name.trim(),
      description: d.description.trim(),
      story: d.story.trim(),
      image_url: d.image_url,
      gallery: (d.gallery || []).slice(0, 3),
      category_id: d.category_id,
      subcategory_id: d.subcategory_id || null,
      badge: d.badgeMode === "none" ? null : d.badgeMode === "custom" ? d.customBadge.trim() : d.badgeMode,
      shelf_life_months: d.shelf_life_months,
      ingredients: d.ingredients,
      available: d.available,
      variants: d.variants.map((v) => {
        const item = {
          label: v.label.trim(),
          weight_g: Number(v.weight_g) || 0,
          price: Number(v.price),
          badge: v.badge?.trim() || null,
          available: v.available,
        };
        if (mode === "edit" && v.id) {
          item.id = v.id;
        }
        return item;
      })
    };
    setSaving(true);
    try {
      if (mode === "create") {
        const created = await createProduct(input);
        guard.allowLeave();
        toast({ message: `${created.name} added` });
        onDone?.();
      } else {
        await updateProduct(product.id, input);
        guard.allowLeave();
        toast({ message: "Product saved" });
        onDone?.();
      }
    } catch (e2) {
      toast({ message: errorMessage(e2), tone: "error" });
    } finally {
      setSaving(false);
    }
  };
  const remove = async () => {
    try {
      await deleteProduct(product.id);
      guard.allowLeave();
      setDeleteOpen(false);
      toast({ message: `${product.name} deleted` });
      onDone?.();
    } catch (e) {
      setDeleteOpen(false);
      if (e?.code === "IN_PAST_ORDERS" || e?.status === 409 || String(e?.message).includes("past")) setBlockedOpen(true);
      else toast({ message: errorMessage(e), tone: "error" });
    }
  };
  return <form
    ref={formRef}
    onSubmit={submit}
    noValidate
    className="flex min-h-0 flex-1 flex-col overflow-y-auto"
  >
      <AppBar
    title={mode === "create" ? "Add product" : "Edit product"}
    onBack={mode === "create" ? undefined : cancel}
    backLabel="Close form"
    backAlways={mode !== "create"}
    actions={mode === "edit" ? <OverflowMenu
      items={[
        { label: "Delete product", danger: true, onClick: () => setDeleteOpen(true) }
      ]}
    /> : <IconButton label="Close" onClick={cancel}><X size={22} /></IconButton>}
  />

      <div className="flex-1 space-y-3 p-4">
        {
    /* Main Image */
  }
        <Card className="p-4">
          <CardTitle>Main image</CardTitle>
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
    onChange={(e) => {
      onFile(e.target.files?.[0]);
      e.target.value = "";
    }}
  />
              <button
    type="button"
    disabled={uploadingMain}
    onClick={() => fileRef.current?.click()}
    className={buttonClass("secondary", "h-11 w-full text-[15px]")}
  >
                {uploadingMain ? (
                  <><Loader2 size={18} className="animate-spin" /> Uploading to Cloudinary…</>
                ) : (
                  <><ImagePlus size={18} /> Upload image</>
                )}
              </button>
              {d.image_url && <button
    type="button"
    onClick={() => {
      set("image_url", "");
      setImageUrlInput("");
    }}
    className={buttonClass("ghost", "w-full text-brick")}
  >
                  <X size={18} /> Remove image
                </button>}
              <p className="text-[13px] text-deep/65">4:5 photo, uploaded directly via Cloudinary.</p>
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
    error={imageError || void 0}
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

        {
    /* Gallery Images */
  }
        <Card className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <CardTitle>Gallery images (up to 3)</CardTitle>
            <span className="text-[13px] font-medium text-deep/65">
              {(d.gallery || []).length} / 3 added
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((idx) => {
              const url = (d.gallery || [])[idx];
              return (
                <div
                  key={idx}
                  className="relative aspect-square overflow-hidden rounded-[10px] border border-sand bg-sand"
                >
                  {url ? (
                    <>
                      <ImageSlot
                        src={url}
                        alt={`Gallery ${idx + 1}`}
                        size="compact"
                        className="bg-sand"
                      />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(idx)}
                        aria-label={`Remove gallery image ${idx + 1}`}
                        className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-full bg-deep/80 text-cream hover:bg-brick"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={uploadingGallery}
                      onClick={() => galleryFileRef.current?.click()}
                      className="grid size-full place-items-center text-center p-2 text-deep/50 hover:bg-sand/60 hover:text-forest transition-colors"
                    >
                      <div className="flex flex-col items-center gap-1">
                        {uploadingGallery ? (
                          <Loader2 size={20} className="animate-spin text-forest" />
                        ) : (
                          <ImagePlus size={20} />
                        )}
                        <span className="text-[12px] font-semibold">Slot {idx + 1}</span>
                      </div>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <input
            ref={galleryFileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              onGalleryFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />

          {(d.gallery || []).length < 3 && (
            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled={uploadingGallery}
                onClick={() => galleryFileRef.current?.click()}
                className={buttonClass("secondary", "h-10 text-[14px] w-full")}
              >
                {uploadingGallery ? (
                  <><Loader2 size={16} className="animate-spin" /> Uploading to Cloudinary…</>
                ) : (
                  <><ImagePlus size={16} /> Upload gallery photo</>
                )}
              </button>

              <div className="flex gap-2">
                <div className="flex-1">
                  <TextField
                    placeholder="Or paste gallery image URL (https://…)"
                    value={galleryUrlInput}
                    error={galleryError || void 0}
                    suffix={<Link2 size={18} className="text-deep/50" />}
                    onChange={(e) => {
                      setGalleryUrlInput(e.target.value);
                      if (galleryError) setGalleryError("");
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={addGalleryUrl}
                  disabled={!galleryUrlInput.trim()}
                  className={buttonClass("secondary", "h-11 px-4 text-[14px]")}
                >
                  Add URL
                </button>
              </div>
            </div>
          )}
        </Card>

        {
    /* Basics */
  }
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
    onChange={(e) => setD((s) => ({ ...s, category_id: e.target.value, subcategory_id: "" }))}
  >
            <option value="">Choose a category</option>
            {(categories.data ?? []).map((c) => <option key={c.id} value={c.id}>
                {c.name}
              </option>)}
          </SelectField>
          <SelectField
    label="Subcategory"
    optional
    value={d.subcategory_id}
    disabled={!category || (category.children?.length ?? 0) === 0}
    hint={category && (category.children?.length ?? 0) === 0 ? `${category.name} has no subcategories.` : void 0}
    onChange={(e) => set("subcategory_id", e.target.value)}
  >
            <option value="">None</option>
            {(category?.children ?? []).map((s) => <option key={s.id} value={s.id}>
                {s.name}
              </option>)}
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
      { value: "custom", label: "Custom" }
    ]}
  />
            {d.badgeMode === "custom" && <TextField
    className="mt-2"
    label="Badge text"
    value={d.customBadge}
    error={err("customBadge")}
    maxLength={20}
    onChange={(e) => set("customBadge", e.target.value)}
    placeholder="e.g. Seasonal"
  />}
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
    onKeyDown={(e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addIngredient();
      }
    }}
    suffix={<button
      type="button"
      onClick={addIngredient}
      className="h-10 rounded-[8px] px-3 text-[14px] font-semibold text-forest hover:bg-sand/60"
    >
                  Add
                </button>}
  />
            {d.ingredients.length > 0 && <ul className="mt-2 flex flex-wrap gap-2">
                {d.ingredients.map((x) => <li key={x}>
                    <button
    type="button"
    onClick={() => set(
      "ingredients",
      d.ingredients.filter((i) => i !== x)
    )}
    aria-label={`Remove ${x}`}
    className="inline-flex h-9 items-center gap-1.5 rounded-full bg-sand pr-2.5 pl-3.5 text-[14px] font-medium"
  >
                      {x} <X size={14} />
                    </button>
                  </li>)}
              </ul>}
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-sand pt-3">
            <div>
              <p className="text-[15px] font-semibold">Available</p>
              <p className="text-[13px] text-deep/65">Customers can buy it in the store</p>
            </div>
            <Switch label="Available" checked={d.available} onChange={(v) => set("available", v)} />
          </div>
        </Card>

        {
    /* Variants */
  }
        <Card className="space-y-3 p-4">
          <CardTitle>Sizes</CardTitle>
          <p className="rounded-[10px] bg-sand/50 px-3 py-2 text-[14px]">
            Saving replaces the full list of sizes.
          </p>
          {err("variants") && <p role="alert" className="text-[13px] font-medium text-brick">
              {err("variants")}
            </p>}
          {d.variants.map((v, i) => <fieldset key={v.id} className="space-y-3 rounded-[12px] border border-sand p-3">
              <legend className="sr-only">Size {i + 1}</legend>
              <div className="flex items-center justify-between">
                <p className="text-[14px] font-semibold text-deep/70">Size {i + 1}</p>
                <button
    type="button"
    disabled={d.variants.length === 1}
    onClick={() => set(
      "variants",
      d.variants.filter((_, j) => j !== i)
    )}
    className="inline-flex h-11 items-center gap-1.5 rounded-[10px] px-2 text-[14px] font-semibold text-brick hover:bg-brick/5 disabled:opacity-40"
    title={d.variants.length === 1 ? "A product needs at least one size" : void 0}
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
    onChange={(e) => updateVariant(i, { weight_g: e.target.value.replace(/\D/g, "").slice(0, 6) })}
  />
                <TextField
    label="Price"
    prefix="₹"
    inputMode="numeric"
    value={v.price}
    error={err(`v${i}.price`)}
    placeholder="0"
    onChange={(e) => updateVariant(i, { price: e.target.value.replace(/\D/g, "").slice(0, 6) })}
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
            </fieldset>)}
          <button
    type="button"
    onClick={() => set("variants", [
      ...d.variants,
      {
        id: newVariantId(),
        label: "",
        weight_g: "",
        price: "",
        badge: "",
        available: true
      }
    ])}
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
        const updated = await updateProductAvailability(product.id, false);
        set("available", updated?.available ?? false);
        setBlockedOpen(false);
        toast({ message: `${product.name} marked unavailable` });
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
    </form>;
}
