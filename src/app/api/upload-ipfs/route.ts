import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

const PINATA_JWT = process.env.PINATA_JWT;

export async function POST(request: NextRequest) {
  try {
    if (!PINATA_JWT) {
      return NextResponse.json(
        { error: "Pinata JWT not configured" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const uuid = formData.get("uuid") as string || "unknown";

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    const cids: string[] = [];

    for (const file of files) {
      // Create new FormData for each file to send to Pinata
      const pinataFormData = new FormData();
      pinataFormData.append("file", file);

      // Add metadata with UUID prefix in filename for organization
      pinataFormData.append(
        "pinataMetadata",
        JSON.stringify({
          name: `${uuid}_${file.name}`,
        })
      );

      // Simple options without wrapWithDirectory
      pinataFormData.append(
        "pinataOptions",
        JSON.stringify({
          cidVersion: 1
        })
      );

      const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
        },
        body: pinataFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Pinata upload error:", errorData);
        return NextResponse.json(
          { error: "Failed to upload to IPFS", details: errorData },
          { status: 500 }
        );
      }

      const data = await response.json();
      cids.push(data.IpfsHash);
    }

    return NextResponse.json({ cids });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST to upload files" });
}
