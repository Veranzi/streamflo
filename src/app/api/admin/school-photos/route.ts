import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
function admin(s:unknown){return (s as {user?:{role?:string}}|null)?.user?.role==="admin";}
export async function GET(req:NextRequest) {
  const s = await getServerSession(authOptions); if(!admin(s)) return NextResponse.json({error:"Forbidden"},{status:403});
  const schoolId = new URL(req.url).searchParams.get("school_id");
  let sql = "SELECT p.*,s.name AS school_name FROM school_photos p JOIN schools s ON s.id=p.school_id";
  const params:unknown[] = [];
  if(schoolId){sql+=" WHERE p.school_id=$1"; params.push(schoolId);}
  sql+=" ORDER BY p.created_at DESC LIMIT 200";
  const rows = await query(sql,params);
  const [count] = await query<{total:number}>("SELECT COUNT(*)::int AS total FROM school_photos");
  return NextResponse.json({rows,total:count?.total??0});
}
export async function DELETE(req:NextRequest) {
  const s = await getServerSession(authOptions); if(!admin(s)) return NextResponse.json({error:"Forbidden"},{status:403});
  const {id} = await req.json();
  await query("DELETE FROM school_photos WHERE id=$1",[id]);
  return NextResponse.json({ok:true});
}
