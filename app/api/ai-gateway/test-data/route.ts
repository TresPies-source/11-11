import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    error: 'This endpoint must be called from the browser to insert data into IndexedDB' 
  }, { status: 400 });
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use the browser console to generate test data. Navigate to /admin/ai-gateway and run: await fetch("/api/ai-gateway/test-data/client").then(r => r.json())' 
  });
}
