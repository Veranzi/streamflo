import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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
  sql+=" ORDER BY c.created_at DESC LIMIT 500";
  const rows = await query(sql,params);
  let counts = {total:0,pending:0,approved:0};
  let moderation = true;
  try {
    const [c] = await query<{total:number;pending:number;approved:number}>(
      "SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE approved=FALSE)::int AS pending, COUNT(*) FILTER (WHERE approved=TRUE)::int AS approved FROM blog_comments"
    );
    if(c) counts = c;
  } catch(err) {
    // Moderation migration not run yet: every comment is visible.
    if((err as {code?:string})?.code!=="42703") throw err;
    moderation = false;
    const [c] = await query<{total:number}>("SELECT COUNT(*)::int AS total FROM blog_comments");
    counts = {total:c?.total??0,pending:0,approved:c?.total??0};
  }
  return NextResponse.json({rows,...counts,moderation});
}
export async function DELETE(req:NextRequest) {
  const s = await getServerSession(authOptions); if(!admin(s)) return NextResponse.json({error:"Forbidden"},{status:403});
  const {id} = await req.json();
  await query("DELETE FROM blog_comments WHERE id=$1",[id]);
  refreshBlog();
  return NextResponse.json({ok:true});
}

/** Refresh cached public blog pages after a change. */
function refreshBlog() {
  try {
    revalidatePath("/blog");
    revalidatePath("/blog/[id]", "page");
    revalidatePath("/");
  } catch (err) {
    console.error("revalidatePath failed", err);
  }
}
