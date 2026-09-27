import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
function admin(s:unknown){return (s as {user?:{role?:string}}|null)?.user?.role==="admin";}
export async function GET(req:NextRequest) {
  const s = await getServerSession(authOptions); if(!admin(s)) return NextResponse.json({error:"Forbidden"},{status:403});
  const postId = new URL(req.url).searchParams.get("post_id");
  let sql = "SELECT c.*,b.title AS post_title FROM blog_comments c JOIN blog_posts b ON b.id=c.post_id";
  const params:unknown[] = [];
  if(postId){sql+=" WHERE c.post_id=$1"; params.push(postId);}
  sql+=" ORDER BY c.created_at DESC LIMIT 100";
  const rows = await query(sql,params);
  const [count] = await query<{total:number}>("SELECT COUNT(*)::int AS total FROM blog_comments");
  return NextResponse.json({rows,total:count?.total??0});
}
export async function DELETE(req:NextRequest) {
  const s = await getServerSession(authOptions); if(!admin(s)) return NextResponse.json({error:"Forbidden"},{status:403});
  const {id} = await req.json();
  await query("DELETE FROM blog_comments WHERE id=$1",[id]);
  return NextResponse.json({ok:true});
}
