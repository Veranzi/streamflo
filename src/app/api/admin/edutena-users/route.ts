import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
function admin(s:unknown){return (s as {user?:{role?:string}}|null)?.user?.role==="admin";}
export async function GET(req:NextRequest) {
  const s = await getServerSession(authOptions); if(!admin(s)) return NextResponse.json({error:"Forbidden"},{status:403});
  const {searchParams} = new URL(req.url);
  const search = (searchParams.get("search")||"").trim();
  const page = Math.max(1,Number(searchParams.get("page")??1));
  const limit=40; const offset=(page-1)*limit;
  let where="1=1"; const params:unknown[]=[];
  if(search){where=`LOWER(email) LIKE $1 OR LOWER(name) LIKE $1`;params.push(`%${search.toLowerCase()}%`);}
  params.push(limit,offset);
  const i=params.length;
  const rows = await query(`SELECT id,email,name,role,phone,email_verified,created_at FROM edutena.users WHERE ${where} ORDER BY created_at DESC LIMIT $${i-1} OFFSET $${i}`,params);
  const [count] = await query<{total:number}>(`SELECT COUNT(*)::int AS total FROM edutena.users WHERE ${where}`,params.slice(0,-2));
  return NextResponse.json({rows,total:count?.total??0,page,limit});
}
