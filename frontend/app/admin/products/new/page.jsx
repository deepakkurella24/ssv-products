"use client";
import { ProductForm } from "@/components/admin/screens/products";
import { useRouter } from "next/navigation";

export default function NewProductPage() {
  const router = useRouter();
  return <ProductForm mode="create" onDone={() => router.push("/admin/products")} />;
}
