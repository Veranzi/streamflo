import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, insert } from "@/lib/db";
function admin(s:unknown){return (s as {user?:{role?:string}}|null)?.user?.role==="admin";}
export async function GET() {
  const s = await getServerSession(authOptions); if(!admin(s)) return NextResponse.json({error:"Forbidden"},{status:403});
  const rows = await query("SELECT * FROM agents ORDER BY created_at DESC");
  return NextResponse.json(rows);
}
export async function POST(req:NextRequest) {
  const s = await getServerSession(authOptions); if(!admin(s)) return NextResponse.json({error:"Forbidden"},{status:403});
  const {name,email,phone,agent_code,commission_rate} = await req.json();
  if(!name?.trim()||!agent_code?.trim()) return NextResponse.json({error:"Name and agent code required"},{status:400});
  try {
    const id = await insert("INSERT INTO agents (name,email,phone,agent_code,commission_rate) VALUES (?,?,?,?,?)",[name.trim(),email||null,phone||null,agent_code.trim(),commission_rate||20]);
    return NextResponse.json({id});
  } catch(e:unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if(msg.includes("unique")||msg.includes("duplicate")) return NextResponse.json({error:"Agent code already exists"},{status:409});
    throw e;
  }
}
export async function PUT(req:NextRequest) {
  const s = await getServerSession(authOptions); if(!admin(s)) return NextResponse.json({error:"Forbidden"},{status:403});
  const {id,name,email,phone,agent_code,commission_rate} = await req.json();
  await query("UPDATE agents SET name=$1,email=$2,phone=$3,agent_code=$4,commission_rate=$5 WHERE id=$6",[name,email||null,phone||null,agent_code,commission_rate,id]);
  return NextResponse.json({ok:true});
}
export async function DELETE(req:NextRequest) {
  const s = await getServerSession(authOptions); if(!admin(s)) return NextResponse.json({error:"Forbidden"},{status:403});
  const {id} = await req.json();
  await query("DELETE FROM agents WHERE id=$1",[id]);
  return NextResponse.json({ok:true});
}
