import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, insert } from "@/lib/db";
function admin(s:unknown){return (s as {user?:{role?:string}}|null)?.user?.role==="admin";}
export async function GET() {
  const s = await getServerSession(authOptions); if(!admin(s)) return NextResponse.json({error:"Forbidden"},{status:403});
  const rows = await query("SELECT * FROM edutena.subscription_plans ORDER BY subscriber_type,price_kes");
  return NextResponse.json(rows);
}
export async function POST(req:NextRequest) {
  const s = await getServerSession(authOptions); if(!admin(s)) return NextResponse.json({error:"Forbidden"},{status:403});
  const {name,subscriber_type,price_kes,billing_period} = await req.json();
  if(!name?.trim()) return NextResponse.json({error:"Name required"},{status:400});
  const id = await insert("INSERT INTO edutena.subscription_plans (name,subscriber_type,price_kes,billing_period,features) VALUES (?,?,?,?,?)",[name.trim(),subscriber_type||"parent",Number(price_kes),billing_period||"monthly",JSON.stringify({tier:name.toLowerCase()})]);
  return NextResponse.json({id});
}
export async function PUT(req:NextRequest) {
  const s = await getServerSession(authOptions); if(!admin(s)) return NextResponse.json({error:"Forbidden"},{status:403});
  const {id,name,subscriber_type,price_kes,billing_period,active} = await req.json();
  await query("UPDATE edutena.subscription_plans SET name=$1,subscriber_type=$2,price_kes=$3,billing_period=$4,active=$5 WHERE id=$6",[name,subscriber_type,Number(price_kes),billing_period,!!active,id]);
  return NextResponse.json({ok:true});
}
export async function DELETE(req:NextRequest) {
  const s = await getServerSession(authOptions); if(!admin(s)) return NextResponse.json({error:"Forbidden"},{status:403});
  const {id} = await req.json();
  await query("UPDATE edutena.subscription_plans SET active=FALSE WHERE id=$1",[id]);
  return NextResponse.json({ok:true});
}
