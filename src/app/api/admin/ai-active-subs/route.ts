import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
function admin(s:unknown){return (s as {user?:{role?:string}}|null)?.user?.role==="admin";}
export async function GET(req:NextRequest) {
  const s = await getServerSession(authOptions); if(!admin(s)) return NextResponse.json({error:"Forbidden"},{status:403});
  const {searchParams} = new URL(req.url);
  const status = searchParams.get("status")||"all";
  const page = Math.max(1,Number(searchParams.get("page")??1));
  const limit=30; const offset=(page-1)*limit;
  const where = status==="all"?"1=1":`sub.status='${status}'`;
  const rows = await query(`SELECT sub.id,sub.status,sub.starts_at,sub.expires_at,sub.created_at,u.email,u.name AS user_name,p.name AS plan_name,p.price_kes,p.billing_period FROM edutena.subscriptions sub JOIN edutena.users u ON u.id=sub.user_id JOIN edutena.subscription_plans p ON p.id=sub.plan_id WHERE ${where} ORDER BY sub.created_at DESC LIMIT $1 OFFSET $2`,[limit,offset]);
  const [counts] = await query<{total:number;active:number;expired:number;cancelled:number}>(`SELECT COUNT(*)::int AS total,COUNT(*) FILTER(WHERE status='active')::int AS active,COUNT(*) FILTER(WHERE status='expired')::int AS expired,COUNT(*) FILTER(WHERE status='cancelled')::int AS cancelled FROM edutena.subscriptions`);
  return NextResponse.json({rows,total:counts?.total??0,active:counts?.active??0,expired:counts?.expired??0,cancelled:counts?.cancelled??0,page,limit});
}
export async function PUT(req:NextRequest) {
  const s = await getServerSession(authOptions); if(!admin(s)) return NextResponse.json({error:"Forbidden"},{status:403});
  const {id,status} = await req.json();
  await query("UPDATE edutena.subscriptions SET status=$1 WHERE id=$2",[status,id]);
  return NextResponse.json({ok:true});
}
