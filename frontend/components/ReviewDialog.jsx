"use client";

import { useRef, useState } from "react";
import { Check, ImagePlus, X } from "lucide-react";
import { ImageSlot } from "@/components/ImageSlot";
import { TextAreaField, TextField } from "@/components/Field";
import { StarPicker } from "@/components/StarRating";
import { useModal } from "@/lib/hooks";
import { buttonStyles } from "@/lib/ui";
import { createProductReview } from "@/lib/api/public";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { useAuth } from "@/components/providers/AuthProvider";

export function ReviewDialog({
  open,
  onClose,
  product,
  variantLabel,
  orderId,
  initialReview,
  onSubmitted,
}) {
  const { firebaseUser, profile } = useAuth() || {};
  const currentUserName = firebaseUser?.displayName || profile?.name || "";
  const panelRef = useRef(null);

  const [rating, setRating] = useState(initialReview?.rating ?? 5);
  const [title, setTitle] = useState(initialReview?.title ?? "");
  const [comment, setComment] = useState(initialReview?.comment ?? "");
  const [userName, setUserName] = useState(initialReview?.user_name ?? currentUserName);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useModal(open, onClose, panelRef);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setErrors({});
    const nextErrors = {};
    if (rating < 1 || rating > 5) nextErrors.rating = "Please select a star rating.";
    if (!title.trim()) nextErrors.title = "Give your review a short headline.";
    if (!comment.trim()) nextErrors.comment = "Please write a few words about your experience.";
    if (!userName.trim()) nextErrors.name = "Enter your name.";
    if (photoFiles.length > 2) nextErrors.photos = "Choose no more than two photos.";
    if (photoFiles.some((file) => !file.type.startsWith("image/"))) {
      nextErrors.photos = "Choose image files only.";
    }
    if (photoFiles.some((file) => file.size > 10 * 1024 * 1024)) {
      nextErrors.photos = "Each photo must be under 10 MB.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    try {
      const token = await firebaseUser?.getIdToken();
      const images = await Promise.all(photoFiles.map(uploadToCloudinary));
      const reviewData = {
        product_id: product?.id,
        order_id: orderId,
        user_name: userName.trim(),
        rating,
        title: title.trim(),
        comment: comment.trim(),
        verified_buyer: Boolean(orderId || firebaseUser),
        variant_label: variantLabel,
        images,
      };
      const savedReview = await createProductReview(product?.id || "product", reviewData, token);
      setSaved(true);
      onSubmitted?.(savedReview || reviewData);
      setTimeout(() => {
        onClose();
        setSaved(false);
      }, 1200);
    } catch (error) {
      setErrors({ form: error.message || "Couldn't save your review. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="on-light fixed inset-0 z-50 grid place-items-center p-4">
      <div aria-hidden className="absolute inset-0 animate-fade-in bg-deep/60" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-dialog-title"
        className="relative w-full max-w-[540px] max-h-[92vh] overflow-y-auto animate-drop-in rounded-card border border-sand bg-cream p-5 text-deep sm:p-7 shadow-warm"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 grid size-10 place-items-center rounded-full hover:bg-sand/70 transition-colors"
        >
          <X aria-hidden size={22} />
        </button>

        {saved ? (
          <div role="status" className="py-8 text-center">
            <span className="inline-grid size-14 place-items-center rounded-full bg-forest text-cream">
              <Check aria-hidden size={28} />
            </span>
            <h2 className="mt-4 text-[26px]">Thank you for your review!</h2>
            <p className="mt-2 text-[15px] text-deep/80">
              Your feedback helps other families make informed, natural choices.
            </p>
          </div>
        ) : (
          <>
            <div className="pr-8">
              <p className="text-[13px] font-semibold tracking-[0.08em] text-clay uppercase">
                {orderId ? `Order ${orderId}` : "Customer feedback"}
              </p>
              <h2 id="review-dialog-title" className="mt-1 text-[26px] sm:text-[30px]">
                {initialReview ? "Edit your review" : "Rate & review"}
              </h2>
            </div>

            {/* Product context pill */}
            <div className="mt-4 flex items-center gap-3 rounded-[10px] border border-sand bg-sand/40 p-3">
              <span className="size-14 shrink-0 overflow-hidden rounded-[8px] bg-sand">
                <ImageSlot src={product.image_url} alt="" size="compact" className="bg-sand" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-[16px] text-deep">{product.name}</p>
                {variantLabel && <p className="text-[13px] text-deep/70">Size: {variantLabel}</p>}
                {orderId && (
                  <span className="inline-flex items-center gap-1 text-[12px] font-medium text-forest">
                    <Check size={13} /> Verified purchase from order
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
              <StarPicker
                value={rating}
                onChange={(val) => {
                  setRating(val);
                  setErrors((prev) => ({ ...prev, rating: undefined }));
                }}
                label="Overall rating"
                error={errors.rating}
              />

              <TextField
                label="Headline"
                name="headline"
                placeholder="e.g. Authentic aroma, pure quality"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setErrors((prev) => ({ ...prev, title: undefined }));
                }}
                error={errors.title}
                required
              />

              <TextAreaField
                label="Your review"
                name="comment"
                placeholder="What did you like about the quality, taste, freshness or packaging?"
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  setErrors((prev) => ({ ...prev, comment: undefined }));
                }}
                error={errors.comment}
                required
                rows={4}
              />

              <div>
                <label htmlFor="review-photos" className="mb-1.5 block text-[15px] font-semibold">
                  Add photos <span className="font-normal text-deep/65">(optional, up to 2)</span>
                </label>
                <label
                  htmlFor="review-photos"
                  className="flex min-h-12 cursor-pointer items-center gap-2 rounded-[10px] border border-sand bg-cream px-3 py-2 text-[14px] text-deep hover:bg-sand/40"
                >
                  <ImagePlus size={18} className="shrink-0 text-forest" />
                  <span>{photoFiles.length ? "Choose different photos" : "Choose photos"}</span>
                </label>
                <input
                  id="review-photos"
                  name="images"
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(event) => {
                    const files = Array.from(event.target.files || []);
                    setPhotoFiles(files);
                    setErrors((prev) => ({ ...prev, photos: undefined }));
                    if (files.length > 2) {
                      setErrors((prev) => ({ ...prev, photos: "Choose no more than two photos." }));
                    }
                  }}
                />
                {photoFiles.length > 0 && (
                  <ul className="mt-2 space-y-1 text-[13px] text-deep/75">
                    {photoFiles.map((file, index) => (
                      <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-2">
                        <span className="truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => setPhotoFiles((files) => files.filter((_, i) => i !== index))}
                          aria-label={`Remove ${file.name}`}
                          className="shrink-0 rounded-full p-1 hover:bg-sand"
                        >
                          <X size={15} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-1 text-[12px] text-deep/65">Image files; up to 10 MB each.</p>
                {errors.photos && (
                  <p role="alert" className="mt-1 text-[13px] text-clay">
                    {errors.photos}
                  </p>
                )}
              </div>

              <TextField
                label="Your name"
                name="userName"
                value={userName}
                onChange={(e) => {
                  setUserName(e.target.value);
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                placeholder="e.g. Priya S."
                hint="Displayed with your review on the product page."
                error={errors.name}
                required
              />

              {errors.form && <p role="alert" className="text-[14px] font-medium text-clay">{errors.form}</p>}

              <div className="mt-6 flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className={buttonStyles.forest("h-12 flex-1 min-w-[160px] text-[16px]")}
                >
                  {saving
                    ? photoFiles.length
                      ? "Uploading & saving…"
                      : "Saving…"
                    : initialReview
                      ? "Update review"
                      : "Submit review"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className={buttonStyles.outline("h-12 px-6 text-[16px]")}
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default ReviewDialog;
