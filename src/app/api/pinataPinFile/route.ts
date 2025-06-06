import { NextResponse, type NextRequest } from "next/server";
import { pinata } from "@/app/pinata/config"

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;
    const uploadData = await pinata.upload.private.file(file);
    const url = uploadData.cid;
    return NextResponse.json(url, { status: 200 });
  } catch (e) {
    // console.log(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}