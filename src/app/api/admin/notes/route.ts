import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
function admin(s:unknown){return (s as {user?:{role?:string}}|null)?.user?.role==="admin";}
export async function GET(req:NextRequest) {
  const s = await getServerSession(authOptions); if(!admin(s)) return NextResponse.json({error:"Forbidden"},{status:403});
  const {searchParams} = new URL(req.url);
  const type = searchParams.get("type")||"all";
  const page = Math.max(1,Number(searchParams.get("page")??1));
  const limit=40; const offset=(page-1)*limit;
  const where = type==="all"?"1=1":`type='${type}'`;
  const rows = await query(`SELECT id,title,grade,subject,type,published,author,created_at FROM edutena.content_notes WHERE ${where} ORDER BY grade,subject,created_at DESC LIMIT $1 OFFSET $2`,[limit,offset]);
  const [counts] = await query<{total:number;published:number;notes:number;guides:number}>(
    `SELECT COUNT(*)::int AS total, COUNT(*) FILTER(WHERE published=TRUE)::int AS published, COUNT(*) FILTER(WHERE type='note')::int AS notes, COUNT(*) FILTER(WHERE type='guide')::int AS guides FROM edutena.content_notes`
  );
  return NextResponse.json({rows,total:counts?.total??0,published:counts?.published??0,notes:counts?.notes??0,guides:counts?.guides??0,page,limit});
}
export async function PUT(req:NextRequest) {
  const s = await getServerSession(authOptions); if(!admin(s)) return NextResponse.json({error:"Forbidden"},{status:403});
  const {id,published,type,title} = await req.json();
  const sets:string[] = []; const params:unknown[] = [];
  if(published!==undefined){sets.push(`published=$${params.length+1}`);params.push(!!published);}
  if(type!==undefined){sets.push(`type=$${params.length+1}`);params.push(type);}
  if(title!==undefined){sets.push(`title=$${params.length+1}`);params.push(title);}
  if(!sets.length) return NextResponse.json({error:"Nothing to update"},{status:400});
  sets.push(`updated_at=NOW()`);
  params.push(id);
  await query(`UPDATE edutena.content_notes SET ${sets.join(",")} WHERE id=$${params.length}`,params);
  return NextResponse.json({ok:true});
}
export async function DELETE(req:NextRequest) {
  const s = await getServerSession(authOptions); if(!admin(s)) return NextResponse.json({error:"Forbidden"},{status:403});
  const {id} = await req.json();
  await query("DELETE FROM edutena.content_notes WHERE id=$1",[id]);
  return NextResponse.json({ok:true});
}
