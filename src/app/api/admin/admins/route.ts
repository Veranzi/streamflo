import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, insert } from "@/lib/db";
import bcrypt from "bcryptjs";
function admin(s:unknown){return (s as {user?:{role?:string}}|null)?.user?.role==="admin";}
export async function GET() {
  const s = await getServerSession(authOptions); if(!admin(s)) return NextResponse.json({error:"Forbidden"},{status:403});
  const rows = await query("SELECT id,username,created_at FROM admins ORDER BY created_at DESC");
  return NextResponse.json(rows);
}
export async function POST(req:NextRequest) {
  const s = await getServerSession(authOptions); if(!admin(s)) return NextResponse.json({error:"Forbidden"},{status:403});
  const {username,password} = await req.json();
  if(!username?.trim()||!password||password.length<8) return NextResponse.json({error:"Username and password (min 8 chars) required"},{status:400});
  const hash = await bcrypt.hash(password,12);
  try {
    const id = await insert("INSERT INTO admins (username,password_hash) VALUES (?,?)",[username.trim(),hash]);
    return NextResponse.json({id});
  } catch(e:unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if(msg.includes("unique")||msg.includes("duplicate")) return NextResponse.json({error:"Username already exists"},{status:409});
    throw e;
  }
}
export async function DELETE(req:NextRequest) {
  const s = await getServerSession(authOptions); if(!admin(s)) return NextResponse.json({error:"Forbidden"},{status:403});
  const {id} = await req.json();
  await query("DELETE FROM admins WHERE id=$1",[id]);
  return NextResponse.json({ok:true});
}
