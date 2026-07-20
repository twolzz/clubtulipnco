import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/SiteLayout";
import {
  checkIsAdmin,
  createPopUp,
  deletePopUp,
  listAllPopUps,
  type PopUp,
} from "@/lib/pop-ups.functions";

const searchSchema = z.object({}).optional();

export const Route = createFileRoute("/_authenticated/admin/pop-ups")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [{ title: "Admin — Pop-ups" }],
  }),
  component: AdminPopUps,
});

const ACCENTS = ["poppy", "sun", "sage", "denim"] as const;

function AdminPopUps() {
  const navigate = useNavigate();
  const checkFn = useServerFn(checkIsAdmin);
  const listFn = useServerFn(listAllPopUps);
  const createFn = useServerFn(createPopUp);
  const deleteFn = useServerFn(deletePopUp);
  const qc = useQueryClient();

  const { data: adminCheck, isPending: checking } = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => checkFn({}),
  });

  const { data: popUps } = useQuery<PopUp[]>({
    queryKey: ["pop-ups", "all"],
    queryFn: () => listFn({}),
    enabled: Boolean(adminCheck?.isAdmin),
  });

  const create = useMutation({
    mutationFn: (data: {
      name: string;
      location: string;
      event_date: string;
      start_time: string | null;
      end_time: string | null;
      tag: string;
      accent: (typeof ACCENTS)[number];
      is_published: boolean;
      send_announcement: boolean;
    }) => createFn({ data }),
    onSuccess: (res) => {
      const a = res.announce;
      if (a?.empty) {
        toast.warning("Pop-up added — 0 subscribers, no emails sent.");
      } else if (a && a.attempted > 0 && a.failed === 0) {
        toast.success(
          `Pop-up added — ${a.succeeded} subscriber${a.succeeded === 1 ? "" : "s"} notified.`,
        );
      } else if (a && a.failed > 0) {
        toast.error(
          `Pop-up added — sent ${a.succeeded}/${a.attempted} (${a.failed} failed, see server logs).`,
        );
      } else {
        toast.success("Pop-up added.");
      }
      qc.invalidateQueries({ queryKey: ["pop-ups"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Pop-up removed.");
      qc.invalidateQueries({ queryKey: ["pop-ups"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (checking) {
    return (
      <SiteLayout>
        <section className="px-5 md:px-8 py-24 text-center text-ink/70">
          Checking access…
        </section>
      </SiteLayout>
    );
  }

  if (!adminCheck?.isAdmin) {
    return (
      <SiteLayout>
        <section className="px-5 md:px-8 py-24">
          <div className="max-w-md mx-auto tc-card tc-card-poppy p-8 md:p-10 bg-cream text-center">
            <h1 className="font-display text-3xl font-extrabold mb-3">
              You don't have access.
            </h1>
            <p className="text-ink/70 mb-6">
              This page is for Tulip &amp; Co. admins only.
            </p>
            <Link to="/" className="tc-btn tc-btn-sun inline-flex">Back Home</Link>
          </div>
        </section>
      </SiteLayout>
    );
  }

  function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    create.mutate({
      name: String(fd.get("name") || ""),
      location: String(fd.get("location") || ""),
      event_date: String(fd.get("event_date") || ""),
      start_time: (fd.get("start_time") as string) || null,
      end_time: (fd.get("end_time") as string) || null,
      tag: String(fd.get("tag") || "Featured"),
      accent: (fd.get("accent") as (typeof ACCENTS)[number]) || "poppy",
      is_published: fd.get("is_published") === "on",
      send_announcement: fd.get("send_announcement") === "on",
    });
    e.currentTarget.reset();
  }

  return (
    <SiteLayout>
      <section className="px-5 md:px-8 py-14 md:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-10">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              Admin — Pop-ups.
            </h1>
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/" });
              }}
              className="tc-btn tc-btn-cream text-sm"
            >
              Sign Out
            </button>
          </div>

          {/* Create form */}
          <form
            onSubmit={handleCreate}
            className="tc-card tc-card-sun p-6 md:p-8 bg-cream space-y-4 mb-12"
          >
            <h2 className="font-display text-2xl font-extrabold mb-2">
              Add new pop-up.
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Name" name="name" required placeholder="Mercato Centrale" />
              <Field
                label="Location"
                name="location"
                required
                placeholder="Little Italy, San Diego"
              />
              <Field label="Date" name="event_date" type="date" required />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start time" name="start_time" type="time" />
                <Field label="End time" name="end_time" type="time" />
              </div>
              <Field label="Tag" name="tag" defaultValue="Featured" />
              <div>
                <label className="block text-sm font-semibold mb-2">Accent</label>
                <select
                  name="accent"
                  defaultValue="poppy"
                  className="w-full rounded-full border-[3px] border-ink bg-white px-5 py-3 font-medium"
                >
                  {ACCENTS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6 pt-2">
              <label className="inline-flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  name="is_published"
                  defaultChecked
                  className="w-4 h-4 accent-poppy"
                />
                Publish immediately
              </label>
              <label className="inline-flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  name="send_announcement"
                  defaultChecked
                  className="w-4 h-4 accent-poppy"
                />
                Email subscribers
              </label>
              <button
                type="submit"
                disabled={create.isPending}
                className="tc-btn tc-btn-poppy ml-auto disabled:opacity-60"
              >
                {create.isPending ? "Adding…" : "Add Pop-up"}
              </button>
            </div>
          </form>

          {/* List */}
          <h2 className="font-display text-2xl font-extrabold mb-4">
            All pop-ups.
          </h2>
          <ul className="space-y-4">
            {(popUps ?? []).map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-4 rounded-2xl border-4 border-ink bg-white p-5 shadow-[6px_6px_0_var(--ink)]"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-widest text-ink/60">
                      {p.event_date}
                    </span>
                    {!p.is_published && (
                      <span className="text-xs font-bold uppercase tracking-widest text-poppy">
                        Unpublished
                      </span>
                    )}
                  </div>
                  <p className="font-extrabold text-lg leading-tight">{p.name}</p>
                  <p className="text-ink/70 text-sm">{p.location}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Delete "${p.name}"?`)) remove.mutate(p.id);
                  }}
                  className="tc-btn tc-btn-cream text-sm py-2 px-4"
                >
                  Delete
                </button>
              </li>
            ))}
            {popUps?.length === 0 && (
              <li className="text-ink/60">No pop-ups yet — add one above.</li>
            )}
          </ul>
        </div>
      </section>
    </SiteLayout>
  );
}

function Field(props: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2">{props.label}</label>
      <input
        name={props.name}
        type={props.type ?? "text"}
        required={props.required}
        placeholder={props.placeholder}
        defaultValue={props.defaultValue}
        className="w-full rounded-full border-[3px] border-ink bg-white px-5 py-3 font-medium"
      />
    </div>
  );
}
