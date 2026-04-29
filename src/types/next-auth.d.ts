import "next-auth";
import "next-auth/jwt";

type AppRole = "parent" | "student" | "institution" | "admin";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: AppRole;
      schoolId?: number;
    };
  }

  interface User {
    role?: AppRole;
    schoolId?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: AppRole;
    schoolId?: number;
  }
}
