export interface School {
  id: number;
  name: string;
  type?: string;
  ownership?: string;
  curriculum?: string;
  boarding?: string;
  gender?: string;
  county?: string;
  subcounty?: string;
  lat?: number;
  lng?: number;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  featured: boolean;
  approved: boolean;
  package?: string;
  facilities?: string;
  created_at: string;
}

export interface SchoolPhoto {
  id: number;
  school_id: number;
  filename: string;
  caption?: string;
  created_at: string;
}

export interface BlogPost {
  id: number;
  title: string;
  content: string;
  featured_image?: string;
  school_id?: number;
  school_name?: string;
  featured: boolean;
  created_at: string;
}

export interface BlogComment {
  id: number;
  post_id: number;
  author_name: string;
  content: string;
  created_at: string;
}

export interface Announcement {
  id: number;
  message: string;
  active: boolean;
}

export interface Event {
  id: number;
  title: string;
  description?: string;
  school_id?: number;
  active: boolean;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  phone?: string;
  school_id?: number;
  role: "institution" | "admin" | "agent";
  created_at: string;
}

export interface Agent {
  id: number;
  name: string;
  email: string;
  phone?: string;
  agent_code: string;
  commission_rate?: number;
  created_at: string;
}

export interface Package {
  id: number;
  name: string;
  price: number;
  features: string;
}

export interface SearchFilters {
  name?: string;
  type?: string;
  ownership?: string;
  curriculum?: string;
  boarding?: string;
  gender?: string;
  county?: string;
  subcounty?: string;
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  results: Pick<School, "id" | "name" | "county" | "subcounty" | "package" | "lat" | "lng">[];
  total: number;
}

export interface CountiesData {
  [county: string]: string[];
}
