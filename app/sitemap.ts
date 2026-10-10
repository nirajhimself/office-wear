export const dynamic = "force-dynamic";
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
export default async function sitemap():Promise<MetadataRoute.Sitemap>{const base=process.env.NEXT_PUBLIC_APP_URL||'http://localhost:3000';const products=await prisma.product.findMany({where:{status:'ACTIVE'},select:{slug:true,updatedAt:true}});return [{url:base,lastModified:new Date()},{url:`${base}/shop`,lastModified:new Date()},{url:`${base}/about`,lastModified:new Date()},{url:`${base}/journal`,lastModified:new Date()},{url:`${base}/privacy`,lastModified:new Date()},{url:`${base}/terms`,lastModified:new Date()},...products.map(p=>({url:`${base}/product/${p.slug}`,lastModified:p.updatedAt}))];}
