import { NextResponse } from "next/server";
import Stripe from "stripe";
export const dynamic = 'force-dynamic'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { 
  apiVersion: "2026-05-27.dahlia" 
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Convert File to Uint8Array
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload to Stripe
    const uploadedFile = await stripe.files.create({
      file: {
        data: uint8Array,
        name: file.name,
        type: file.type,
      },
      purpose: 'identity_document',
    });

    return NextResponse.json({ 
      success: true, 
      fileId: uploadedFile.id 
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    );
  }
}