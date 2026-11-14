"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AddressForm } from "@/components/AddressForm";
import { buttonStyles } from "@/lib/ui";
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress as apiDeleteAddress,
  setDefaultAddress as apiSetDefaultAddress,
} from "@/lib/api/user";
import { useAuth } from "@/components/providers/AuthProvider";

export default function AddressesPage() {
  const { firebaseUser, loading: authLoading } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!firebaseUser) {
      setAddresses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = await firebaseUser.getIdToken();
      const data = await getAddresses(token);
      const list = Array.isArray(data) ? data : [];
      setAddresses(list);
      return list;
    } catch (e) {
      setError(e.message || "Couldn't load your addresses.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    if (!authLoading) {
      load();
    }
  }, [load, authLoading]);

  const saveAddress = async (value, id) => {
    try {
      const token = await firebaseUser?.getIdToken();
      const saved = id
        ? await updateAddress(id, value, token)
        : await addAddress(value, token);
      setAddresses((current) => id
        ? current.map((address) => address.id === id ? { ...address, ...saved } : address)
        : [...current, saved]);
      setError("");
      return true;
    } catch (e) {
      setError(e.message || "Couldn't save the address.");
      return false;
    }
  };

  const deleteAddress = async (id) => {
    try {
      const token = await firebaseUser?.getIdToken();
      await apiDeleteAddress(id, token);
      const list = await load();
      return list !== null;
    } catch (e) {
      setError(e.message || "Couldn't delete the address.");
      return false;
    }
  };

  const setDefaultAddress = async (id) => {
    try {
      const token = await firebaseUser?.getIdToken();
      const updated = await apiSetDefaultAddress(id, token);
      setAddresses((current) => current.map((address) => ({
        ...address,
        is_default: address.id === updated.id,
      })));
      setError("");
    } catch (e) {
      setError(e.message || "Couldn't update the default address.");
    }
  };

  const small =
    "inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-semibold transition-colors hover:bg-sand/70";

  return (
    <section aria-labelledby="addresses-heading">
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

      {error && <p role="alert" className="mt-4 rounded-[10px] bg-clay/10 px-4 py-3 text-[15px] text-clay">{error}</p>}

      {editing === "new" && (
        <div className="mt-6 rounded-card border border-sand p-5 sm:p-6">
          <h3 className="mb-4 font-display text-[20px] font-semibold">New address</h3>
          <AddressForm
            submitLabel="Save address"
            onSubmit={async (value) => {
              if (await saveAddress(value)) setEditing(null);
            }}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {loading || authLoading ? (
        <div className="mt-6 py-12 text-center text-[16px] text-deep/70">
          Loading addresses…
        </div>
      ) : addresses.length === 0 && editing !== "new" ? (
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
                      onSubmit={async (value) => {
                        if (await saveAddress(value, a.id)) setEditing(null);
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
                            onClick={async () => {
                              if (await deleteAddress(a.id)) setDeleting(null);
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
