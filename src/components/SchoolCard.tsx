import Link from "next/link";
import { MapPin, ArrowRight, School as SchoolIcon, LocateFixed } from "lucide-react";
import { School } from "@/lib/types";

interface Props {
  school: Pick<School, "id" | "name" | "county" | "subcounty" | "type">;
  onMapClick?: (id: number) => void;
}

export default function SchoolCard({ school, onMapClick }: Props) {
  const location = [school.county, school.subcounty].filter(Boolean).join(", ");

  return (
    <div className="card card-hover flex flex-col p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
          <SchoolIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="break-words font-display text-base font-semibold leading-snug text-ink">
            <Link href={`/profile/${school.id}`} className="hover:text-primary-700">
              {school.name}
            </Link>
          </h4>
          {location && (
            <p className="mt-1 flex items-center gap-1 text-sm text-ink-soft">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{location}</span>
            </p>
          )}
          {school.type && (
            <span className="badge badge-gray mt-2">{school.type}</span>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
        <Link href={`/profile/${school.id}`} className="btn btn-primary btn-sm">
          View profile <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        {onMapClick && (
          <button
            className="btn btn-ghost btn-sm ml-auto"
            onClick={() => onMapClick(school.id)}
            title="Show this school on the map"
          >
            <LocateFixed className="h-3.5 w-3.5" /> Show on map
          </button>
        )}
      </div>
    </div>
  );
}
