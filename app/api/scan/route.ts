import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: "Image base64 is required" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is missing in environment variables" },
        { status: 500 }
      );
    }

    // Remove the data URL prefix (e.g. data:image/jpeg;base64,) if present
    const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
    // Extract mime type if needed, but usually we can assume jpeg if it comes from the camera
    const mediaType = imageBase64.includes("image/png") ? "image/png" : "image/jpeg";

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: "You are an assistant designed to extract expiry dates from product images. You must reply ONLY with a valid ISO 8601 date string (YYYY-MM-DD) or an empty string if no date can be found. No explanations, no markdown formatting.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType as any,
                data: base64Data,
              },
            },
            {
              type: "text",
              text: "Extract the expiry date from this image and format it as YYYY-MM-DD.",
            },
          ],
        },
      ],
    });

    // The response is expected to be a single string containing the date
    const messageContent = response.content[0];
    let dateStr = "";
    if (messageContent.type === "text") {
      dateStr = messageContent.text.trim();
    }

    // Validate if it looks like a date
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
      console.warn("Claude returned invalid date format:", dateStr);
      // Fallback: try to find a date string inside the text
      const match = dateStr.match(/\d{4}-\d{2}-\d{2}/);
      if (match) {
        dateStr = match[0];
      } else {
        dateStr = "";
      }
    }

    return NextResponse.json({ date: dateStr });
  } catch (error: any) {
    console.error("Error in OCR API:", error);
    return NextResponse.json(
      { error: "Failed to extract date: " + error.message },
      { status: 500 }
    );
  }
}
