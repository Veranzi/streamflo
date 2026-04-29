import Link from "next/link";
import { School } from "@/lib/types";

interface Props {
  school: Pick<School, "id" | "name" | "county" | "subcounty" | "type">;
  onMapClick?: (id: number) => void;
}

export default function SchoolCard({ school, onMapClick }: Props) {
  return (
    <div className="result-card bg-white p-4 rounded shadow">
      <h4 className="font-bold break-words leading-snug">{school.name}</h4>
      <p className="text-xs text-slate-500 mt-1">
        {school.county ?? ""}
        {school.subcounty ? ` • ${school.subcounty}` : ""}
      </p>
      {school.type && (
        <p className="text-xs text-slate-400 mt-0.5 uppercase tracking-wide">{school.type}</p>
      )}
      <div className="mt-2 flex gap-2 items-center">
        <Link href={`/profile/${school.id}`} className="text-blue-600 text-sm underline">
          View Profile
        </Link>
        {onMapClick && (
          <button
            className="text-xs text-slate-600 ml-auto"
            onClick={() => onMapClick(school.id)}
          >
            Open on map
          </button>
        )}
      </div>
    </div>
  );
}
