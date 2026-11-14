import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AddressForm } from "@/components/AddressForm";
import { buttonStyles } from "@/lib/ui";
import { useStore } from "@/store/StoreProvider";

export default function AddressesPage() {
  const { addresses, saveAddress, deleteAddress, setDefaultAddress } = useStore();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const small =
    "inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-semibold transition-colors hover:bg-sand/70";

  return (
    <section aria-labelledby="addresses-heading">
      <title>Addresses · SSV</title>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="addresses-heading" className="text-[28px] lg:text-[32px]">
          Addresses
        </h2>
        {editing !== "new" && (
          <button
            type="button"
            onClick={() => setEditing("new")}
            className={buttonStyles.outline("h-11 px-5 text-[15px]")}
          >
            <Plus aria-hidden size={18} /> Add an address
          </button>
        )}
      </div>

      {editing === "new" && (
        <div className="mt-6 rounded-card border border-sand p-5 sm:p-6">
          <h3 className="mb-4 font-display text-[20px] font-semibold">New address</h3>
          <AddressForm
            submitLabel="Save address"
            onSubmit={(value) => {
              saveAddress(value);
              setEditing(null);
            }}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {addresses.length === 0 && editing !== "new" ? (
        <div className="mt-6 rounded-card border border-sand bg-sand/40 px-6 py-12">
          <p className="font-display text-[22px] font-semibold">No saved addresses</p>
          <p className="mt-2 text-deep/80">Add one now and it will be ready at checkout.</p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className={editing === a.id ? "md:col-span-2" : undefined}>
              <div className="h-full rounded-card border border-sand p-5 sm:p-6">
                {editing === a.id ? (
                  <>
                    <h3 className="mb-4 font-display text-[20px] font-semibold">Edit address</h3>
                    <AddressForm
                      initial={a}
                      submitLabel="Save changes"
                      onSubmit={(value) => {
                        saveAddress(value, a.id);
                        setEditing(null);
                      }}
                      onCancel={() => setEditing(null)}
                    />
                  </>
                ) : (
                  <>
                    <p className="flex flex-wrap items-center gap-2 font-semibold">
                      {a.name}
                      {a.is_default && (
                        <span className="rounded-full bg-marigold px-2.5 py-0.5 text-[12px] font-semibold">
                          Default
                        </span>
                      )}
                    </p>
                    <p className="mt-2 text-[15px] text-deep/90">
                      {a.door_no}, {a.street}
                      <br />
                      {a.city}, {a.state} {a.pincode}
                      <span className="mt-1 block tabular-nums">+91 {a.phone}</span>
                    </p>

                    {deleting === a.id ? (
                      <div
                        role="alertdialog"
                        aria-label="Confirm delete"
                        className="mt-4 border-t border-sand pt-4"
                      >
                        <p className="text-[15px] font-semibold">Delete this address?</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              deleteAddress(a.id);
                              setDeleting(null);
                            }}
                            className={buttonStyles.forest("h-10 px-4 text-[14px]")}
                          >
                            Yes, delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleting(null)}
                            className={buttonStyles.outline("h-10 px-4 text-[14px]")}
                          >
                            Keep it
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 -ml-3.5 flex flex-wrap gap-1 border-t border-sand pt-3">
                        <button type="button" onClick={() => setEditing(a.id)} className={small}>
                          <Pencil aria-hidden size={16} /> Edit
                          <span className="sr-only"> address for {a.name}</span>
                        </button>
                        {!a.is_default && (
                          <button
                            type="button"
                            onClick={() => setDefaultAddress(a.id)}
                            className={small}
                          >
                            Set as default<span className="sr-only">: {a.name}</span>
                          </button>
                        )}
                        <button type="button" onClick={() => setDeleting(a.id)} className={small}>
                          <Trash2 aria-hidden size={16} /> Delete
                          <span className="sr-only"> address for {a.name}</span>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
