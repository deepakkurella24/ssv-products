"use client";
import StatusPanel from "@/components/layout/StatusPanel";
export default function ProductLoadError({ message }) {
  return (
    <div className="shell py-20">
      <StatusPanel
        kind="error"
        title="We couldn’t load this product"
        message={message}
      />
    </div>
  );
}
