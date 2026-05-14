"use client";

import { useActionState } from "react";
import { updateVendorProfile, type VendorProfileFormState } from "@/lib/vendor-profile/actions";
import type { VendorProfileRow } from "@/lib/vendor-profile/types";

const initialState: VendorProfileFormState = {
  error: null,
  success: null,
};

type VendorProfileFormProps = {
  profile: VendorProfileRow;
};

export function VendorProfileForm({ profile }: VendorProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateVendorProfile, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <section className="space-y-4 rounded-2xl border border-border-subtle bg-white p-5">
        <h3 className="text-base font-semibold text-brand-navy">Business basics</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="business_name" className="block text-sm font-semibold text-brand-navy">
              Business name
            </label>
            <input
              id="business_name"
              name="business_name"
              defaultValue={profile.business_name ?? ""}
              required
              className="mt-2 w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="slug" className="block text-sm font-semibold text-brand-navy">
              Public profile URL slug
            </label>
            <input
              id="slug"
              name="slug"
              defaultValue={profile.slug ?? ""}
              placeholder="example: brooklyn-party-djs"
              className="mt-2 w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
            />
            <p className="mt-2 text-xs text-brand-navy-muted">Your page will be visible at /vendors/[slug].</p>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="bio" className="block text-sm font-semibold text-brand-navy">
              Business bio
            </label>
            <textarea
              id="bio"
              name="bio"
              defaultValue={profile.bio ?? ""}
              rows={5}
              className="mt-2 w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
              placeholder="Describe your services, style, and what makes your team stand out."
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border-subtle bg-white p-5">
        <h3 className="text-base font-semibold text-brand-navy">Contact and service area</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="business_phone" className="block text-sm font-semibold text-brand-navy">
              Business phone
            </label>
            <input
              id="business_phone"
              name="business_phone"
              defaultValue={profile.business_phone ?? ""}
              className="mt-2 w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
            />
          </div>
          <div>
            <label htmlFor="service_areas" className="block text-sm font-semibold text-brand-navy">
              Service areas
            </label>
            <input
              id="service_areas"
              name="service_areas"
              defaultValue={profile.service_areas ?? ""}
              placeholder="Brooklyn, Queens, Manhattan"
              className="mt-2 w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border-subtle bg-white p-5">
        <h3 className="text-base font-semibold text-brand-navy">Website and social links</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="website" className="block text-sm font-semibold text-brand-navy">
              Website
            </label>
            <input
              id="website"
              name="website"
              defaultValue={profile.website ?? ""}
              placeholder="https://example.com"
              className="mt-2 w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
            />
          </div>
          <div>
            <label htmlFor="instagram" className="block text-sm font-semibold text-brand-navy">
              Instagram
            </label>
            <input
              id="instagram"
              name="instagram"
              defaultValue={profile.instagram ?? ""}
              placeholder="@yourhandle"
              className="mt-2 w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
            />
          </div>
          <div>
            <label htmlFor="facebook" className="block text-sm font-semibold text-brand-navy">
              Facebook
            </label>
            <input
              id="facebook"
              name="facebook"
              defaultValue={profile.facebook ?? ""}
              placeholder="business-page"
              className="mt-2 w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
            />
          </div>
          <div>
            <label htmlFor="tiktok" className="block text-sm font-semibold text-brand-navy">
              TikTok
            </label>
            <input
              id="tiktok"
              name="tiktok"
              defaultValue={profile.tiktok ?? ""}
              placeholder="@yourhandle"
              className="mt-2 w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border-subtle bg-white p-5">
        <h3 className="text-base font-semibold text-brand-navy">Brand images</h3>
        <p className="text-sm text-brand-navy-muted">
          Upload a square logo and a wide cover image (max 5MB each). Strong visuals help your listing stand out in the
          vendor directory.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="logo" className="block text-sm font-semibold text-brand-navy">
              Logo image
            </label>
            <input
              id="logo"
              name="logo"
              type="file"
              accept="image/*"
              className="mt-2 w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
            />
            {profile.logo_url ? (
              <p className="mt-2 text-xs text-brand-navy-muted">Current logo is set.</p>
            ) : (
              <p className="mt-2 text-xs text-brand-navy-muted">No logo yet — add one so your cards look polished in the marketplace.</p>
            )}
          </div>
          <div>
            <label htmlFor="cover_image" className="block text-sm font-semibold text-brand-navy">
              Cover image
            </label>
            <input
              id="cover_image"
              name="cover_image"
              type="file"
              accept="image/*"
              className="mt-2 w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
            />
            {profile.cover_image_url ? (
              <p className="mt-2 text-xs text-brand-navy-muted">Current cover is set.</p>
            ) : (
              <p className="mt-2 text-xs text-brand-navy-muted">A cover image gives your public page a premium first impression.</p>
            )}
          </div>
        </div>
      </section>

      {state.error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{state.error}</p> : null}
      {state.success ? (
        <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
          {state.success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-brand-navy px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
