"use client";

import { useState } from "react";
import { Check, ChevronDown, MapPin, Pencil, Star, Trash2 } from "lucide-react";
import {
  deleteAddress,
  setDefaultAddress,
  updateAddress,
} from "@/lib/account/actions";

type Address = {
  id: string;
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
};

export function AddressCard({ address }: { address: Address }) {
  const [editing, setEditing] = useState(false);

  return (
    <article className="address-card">
      <div className="address-card-top">
        <div className="address-label-wrap">
          <span className="address-icon">
            <MapPin size={17} />
          </span>
          <div>
            <h3>{address.label}</h3>
            {address.isDefault && (
              <span className="address-default">
                <Check size={11} /> Default address
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          className="address-action"
          onClick={() => setEditing((value) => !value)}
          aria-expanded={editing}
        >
          <Pencil size={14} />
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>

      <div className="address-details">
        <strong>{address.name}</strong>
        <span>{address.line1}</span>
        {address.line2 && <span>{address.line2}</span>}
        <span>
          {address.city}, {address.state} — {address.postalCode}
        </span>
        <span>{address.phone}</span>
      </div>

      <div className="address-card-actions">
        {!address.isDefault && (
          <form action={setDefaultAddress}>
            <input type="hidden" name="id" value={address.id} />
            <button className="address-action" type="submit">
              <Star size={14} /> Set as default
            </button>
          </form>
        )}

        <form
          action={deleteAddress}
          onSubmit={(event) => {
            if (!window.confirm(`Delete your "${address.label}" address?`)) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="id" value={address.id} />
          <button className="address-action address-delete" type="submit">
            <Trash2 size={14} /> Delete
          </button>
        </form>
      </div>

      {editing && (
        <form action={updateAddress} className="address-edit-form">
          <input type="hidden" name="id" value={address.id} />

          <label>
            Address label
            <input
              name="label"
              defaultValue={address.label}
              required
              maxLength={40}
              placeholder="Home, Work, Parents' Home"
            />
          </label>

          <label>
            Recipient name
            <input
              name="name"
              defaultValue={address.name}
              required
              minLength={2}
              maxLength={100}
            />
          </label>

          <label>
            Phone number
            <input
              name="phone"
              defaultValue={address.phone}
              required
              minLength={10}
              maxLength={15}
            />
          </label>

          <label>
            Address
            <input
              name="line1"
              defaultValue={address.line1}
              required
              minLength={3}
              maxLength={150}
            />
          </label>

          <label>
            Apartment / area (optional)
            <input
              name="line2"
              defaultValue={address.line2 ?? ""}
              maxLength={150}
            />
          </label>

          <div className="address-edit-grid">
            <label>
              City
              <input name="city" defaultValue={address.city} required />
            </label>
            <label>
              State
              <input name="state" defaultValue={address.state} required />
            </label>
          </div>

          <label>
            PIN code
            <input
              name="postalCode"
              defaultValue={address.postalCode}
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
            />
          </label>

          <button className="button button-dark address-save" type="submit">
            Save address <ChevronDown size={14} className="address-save-icon" />
          </button>
        </form>
      )}
    </article>
  );
}
