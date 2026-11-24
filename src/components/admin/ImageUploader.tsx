"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import {
  deleteProductImage,
  setProductImagePrimary,
  uploadProductImage,
} from "@/server/actions/admin";
import { initialImageActionState } from "@/lib/auth/admin-action-state";

type ImageRow = {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  is_primary: boolean;
};

export function ImageUploader({
  productId,
  images,
}: {
  productId: string;
  images: readonly ImageRow[];
}) {
  const [uploadState, uploadAction, uploadPending] = useActionState(
    uploadProductImage,
    initialImageActionState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteProductImage,
    initialImageActionState,
  );
  const [primaryState, primaryAction, primaryPending] = useActionState(
    setProductImagePrimary,
    initialImageActionState,
  );
  const [dimensionError, setDimensionError] = useState<string | null>(null);
  const widthRef = useRef<HTMLInputElement>(null);
  const heightRef = useRef<HTMLInputElement>(null);

  async function prepareImage(formData: FormData) {
    setDimensionError(null);
    const file = formData.get("image");
    if (!(file instanceof File)) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setDimensionError("PNG, JPEG ou WebP uniquement.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setDimensionError("Le fichier source dépasse 2 Mo.");
      return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 900 / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        setDimensionError("Le navigateur ne peut pas convertir cette image.");
        return;
      }
      context.drawImage(bitmap, 0, 0, width, height);
      bitmap.close();
      const webp = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", 0.82),
      );
      if (!webp) {
        setDimensionError("Conversion WebP impossible.");
        return;
      }
      formData.set("image", new File([webp], "product.webp", { type: "image/webp" }));
      formData.set("width", String(width));
      formData.set("height", String(height));
      if (!formData.get("alt")) {
        setDimensionError("Ajoutez une description de l’image.");
        return;
      }
      await uploadAction(formData);
    } catch {
      setDimensionError("Cette image ne peut pas être convertie.");
    }
  }

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">Images</h2>
      {images.length ? (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {images.map((image) => (
            <li
              key={image.id}
              aria-label={`Image ${image.alt}`}
              className="rounded-card border border-line-soft p-4"
            >
              {/* L’URL peut être locale ou Supabase Storage ; aucun effet sur le formulaire. */}
              <Image
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                className="h-40 w-full rounded-control object-contain"
              />
              <p className="mt-2 text-sm text-muted">
                {image.is_primary ? "Image principale" : "Image secondaire"}
              </p>
              <div className="mt-3 flex flex-wrap gap-4">
                {!image.is_primary ? (
                  <form action={primaryAction}>
                    <input type="hidden" name="image_id" value={image.id} />
                    <input type="hidden" name="product_id" value={productId} />
                    <button
                      type="submit"
                      disabled={primaryPending}
                      className="min-h-11 text-sm font-semibold underline"
                    >
                      Choisir comme image principale
                    </button>
                  </form>
                ) : null}
                <form action={deleteAction}>
                  <input type="hidden" name="id" value={image.id} />
                  <button
                    type="submit"
                    disabled={deletePending}
                    className="min-h-11 text-sm font-semibold text-danger underline"
                  >
                    Supprimer
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-muted">Aucune image téléversée.</p>
      )}
      <form action={prepareImage} className="mt-5 grid max-w-xl gap-3">
        <input type="hidden" name="product_id" value={productId} />
        <input ref={widthRef} type="hidden" name="width" />
        <input ref={heightRef} type="hidden" name="height" />
        <label className="grid gap-1 text-sm">
          Fichier JPEG, PNG ou WebP
          <input
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            className="min-h-11"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Texte alternatif
          <input
            name="alt"
            required
            maxLength={300}
            className="min-h-11 rounded-option border border-line px-3"
          />
        </label>
        {dimensionError ? (
          <p role="alert" className="text-sm text-danger">
            {dimensionError}
          </p>
        ) : null}
        {uploadState.error ? (
          <p role="alert" className="text-sm text-danger">
            {uploadState.error}
          </p>
        ) : null}
        {uploadState.success ? (
          <p role="status" className="text-sm">
            {uploadState.success}
          </p>
        ) : null}
        {deleteState.error ? (
          <p role="alert" className="text-sm text-danger">
            {deleteState.error}
          </p>
        ) : null}
        {deleteState.success ? (
          <p role="status" className="text-sm">
            {deleteState.success}
          </p>
        ) : null}
        {primaryState.error ? (
          <p role="alert" className="text-sm text-danger">
            {primaryState.error}
          </p>
        ) : null}
        {primaryState.success ? (
          <p role="status" className="text-sm">
            {primaryState.success}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={uploadPending}
          className="min-h-11 rounded-option border border-line px-4 font-semibold"
        >
          {uploadPending ? "Téléversement…" : "Téléverser"}
        </button>
      </form>
    </section>
  );
}
