import { notFound } from "next/navigation";
import { curriculumLabel } from "@/lib/curriculum";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ChevronLeft, MapPin, Phone, Mail, Globe, Star, Check, Image as ImageIcon,
  Newspaper, School as SchoolIcon, BadgeCheck, ArrowRight, Info,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFab from "@/components/WhatsAppFab";
import { queryOne, query } from "@/lib/db";
import { School, SchoolPhoto, BlogPost } from "@/lib/types";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props) {
  const s = await queryOne<School>("SELECT name, county FROM schools WHERE id = ? AND approved = TRUE", [params.id]).catch(() => null);
  return { title: s ? `${s.name} | Streamflo` : "School Profile | Streamflo" };
}

export default async function ProfilePage({ params }: Props) {
  const school = await queryOne<School & { facilities?: string }>(
    "SELECT * FROM schools WHERE id = ? AND approved = TRUE",
    [params.id]
  ).catch(() => null);

  if (!school) notFound();

  const [photos, posts] = await Promise.all([
    query<SchoolPhoto>("SELECT * FROM school_photos WHERE school_id = ? LIMIT 12", [school.id]).catch(() => []),
    query<BlogPost>("SELECT id, title, featured_image, created_at FROM blog_posts WHERE school_id = ? ORDER BY created_at DESC LIMIT 5", [school.id]).catch(() => []),
  ]);

  const facilitiesList = school.facilities ? school.facilities.split(",").map((f) => f.trim()).filter(Boolean) : [];
  const location = [school.subcounty, school.county].filter(Boolean).join(", ");
  const hasContact = Boolean(school.phone || school.email || school.website);

  const facts: { label: string; value?: string }[] = [
    { label: "Type", value: school.type },
    { label: "Ownership", value: school.ownership },
    { label: "Curriculum", value: curriculumLabel(school.curriculum) },
    { label: "Gender", value: school.gender },
    { label: "Boarding", value: school.boarding },
    { label: "County", value: school.county },
    { label: "Sub county", value: school.subcounty },
  ];

  return (
    <>
      <Navbar />

      {/* Header band */}
      <section className="page-band">
        <div className="container-page py-6 sm:py-8">
          <Link href="/directory" className="inline-flex items-center gap-1 text-sm font-medium text-ink-soft hover:text-primary-700">
            <ChevronLeft className="h-4 w-4" /> Back to directory
          </Link>

          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 ring-1 ring-primary-100">
              <SchoolIcon className="h-8 w-8" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="page-title break-words">{school.name}</h1>
                {school.featured && (
                  <span className="badge badge-amber">
                    <Star className="h-3 w-3 fill-current" /> Featured
                  </span>
                )}
              </div>
              {location && (
                <p className="mt-1.5 flex items-center gap-1.5 text-ink-soft">
                  <MapPin className="h-4 w-4 shrink-0" /> {location}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {school.type && <span className="badge badge-blue">{school.type}</span>}
                {school.curriculum && <span className="badge badge-green">{curriculumLabel(school.curriculum)}</span>}
                {school.ownership && <span className="badge badge-gray">{school.ownership}</span>}
                {school.gender && <span className="badge badge-purple">{school.gender}</span>}
                {school.boarding && <span className="badge badge-amber">Boarding: {school.boarding}</span>}
              </div>
            </div>
            {school.phone && (
              <a href={`tel:${school.phone}`} className="btn btn-primary shrink-0">
                <Phone className="h-4 w-4" /> Call school
              </a>
            )}
          </div>
        </div>
      </section>

      <div className="container-page py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main column */}
          <div className="min-w-0 space-y-6 lg:col-span-2">
            {/* Description */}
            <div className="card card-pad">
              <h2 className="section-title mb-3 text-lg sm:text-xl">About the school</h2>
              {school.description ? (
                <p className="whitespace-pre-wrap leading-relaxed text-slate-700">{school.description}</p>
              ) : (
                <p className="text-sm text-ink-soft">This school has not added a description yet.</p>
              )}
            </div>

            {/* Facilities */}
            {facilitiesList.length > 0 && (
              <div className="card card-pad">
                <h2 className="section-title mb-4 text-lg sm:text-xl">Facilities</h2>
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {facilitiesList.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent-600">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Photos gallery */}
            {photos.length > 0 && (
              <div className="card card-pad">
                <h2 className="section-title mb-4 flex items-center gap-2 text-lg sm:text-xl">
                  <ImageIcon className="h-5 w-5 text-primary-700" /> Photos
                </h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {photos.map((p) => (
                    <figure key={p.id} className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/uploads/schools/${school.id}/${p.filename}`}
                        alt={p.caption ?? school.name}
                        className="aspect-[4/3] w-full object-cover transition duration-300 hover:scale-105"
                      />
                      {p.caption && (
                        <figcaption className="truncate bg-white px-2.5 py-1.5 text-xs text-ink-soft">{p.caption}</figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              </div>
            )}

            {/* Map */}
            {school.lat && school.lng && (
              <div className="card overflow-hidden">
                <div className="card-header">
                  <h2 className="flex items-center gap-2 font-display text-base font-semibold">
                    <MapPin className="h-4 w-4 text-primary-700" /> Location
                  </h2>
                  {location && <span className="text-xs text-ink-soft">{location}</span>}
                </div>
                <div className="p-2 sm:p-3">
                  <Map
                    markers={[{ id: school.id, name: school.name, county: school.county ?? "", lat: Number(school.lat), lng: Number(school.lng) }]}
                  />
                </div>
              </div>
            )}

            {/* Blog posts */}
            {posts.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h2 className="flex items-center gap-2 font-display text-base font-semibold">
                    <Newspaper className="h-4 w-4 text-primary-700" /> News from this school
                  </h2>
                </div>
                <ul className="divide-y divide-slate-100">
                  {posts.map((p) => (
                    <li key={p.id}>
                      <Link href={`/blog/${p.id}`} className="flex items-center gap-4 px-5 py-3 transition hover:bg-slate-50 sm:px-6">
                        {p.featured_image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={`/uploads/blog/${p.featured_image}`} alt={p.title} className="h-12 w-16 shrink-0 rounded-md object-cover" />
                        ) : (
                          <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-400">
                            <Newspaper className="h-5 w-5" />
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-sm font-semibold text-ink">{p.title}</p>
                          <p className="text-xs text-ink-soft">
                            {new Date(p.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Contact */}
            <div className="card">
              <div className="card-header">
                <h2 className="font-display text-base font-semibold">Contact details</h2>
              </div>
              <div className="card-pad space-y-3">
                {hasContact ? (
                  <>
                    {school.phone && (
                      <ContactRow icon={Phone} label="Phone">
                        <a href={`tel:${school.phone}`} className="link">{school.phone}</a>
                      </ContactRow>
                    )}
                    {school.email && (
                      <ContactRow icon={Mail} label="Email">
                        <a href={`mailto:${school.email}`} className="link break-all">{school.email}</a>
                      </ContactRow>
                    )}
                    {school.website && (
                      <ContactRow icon={Globe} label="Website">
                        <a href={school.website} target="_blank" rel="noreferrer" className="link break-all">{school.website}</a>
                      </ContactRow>
                    )}
                  </>
                ) : (
                  <p className="flex items-start gap-2 text-sm text-ink-soft">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" /> Contact details have not been added yet.
                  </p>
                )}
              </div>
            </div>

            {/* Quick facts */}
            <div className="card">
              <div className="card-header">
                <h2 className="font-display text-base font-semibold">At a glance</h2>
              </div>
              <dl className="divide-y divide-slate-100">
                {facts.map((f) => (
                  <div key={f.label} className="flex items-center justify-between gap-4 px-5 py-2.5 text-sm sm:px-6">
                    <dt className="text-ink-soft">{f.label}</dt>
                    <dd className={f.value ? "text-right font-medium text-ink" : "text-right text-slate-400"}>
                      {f.value || "Not set"}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Claim CTA */}
            <div className="card card-pad border-primary-200 bg-primary-50">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-primary-700 ring-1 ring-primary-200">
                  <BadgeCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-primary-900">Is this your school?</p>
                  <p className="mt-1 text-sm text-slate-600">Claim and manage your profile with a Premium account.</p>
                </div>
              </div>
              <Link href="/register?package=premium" className="btn btn-primary mt-4 w-full">
                Claim profile
              </Link>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
      <WhatsAppFab />
    </>
  );
}

function ContactRow({
  icon: Icon, label, children,
}: {
  icon: typeof Phone;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 text-sm">
        <p className="text-xs text-ink-soft">{label}</p>
        {children}
      </div>
    </div>
  );
}
