import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  try {
    const body = await request.json();
    
    let endpoint = '';
    if (action === 'start') endpoint = '/ppd/start';
    else if (action === 'respond') endpoint = '/ppd/respond';
    else if (action === 'complete') endpoint = '/ppd/complete';
    else return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('PPD API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get('patientId');
  
  if (!patientId) {
    return NextResponse.json({ error: 'patientId required' }, { status: 400 });
  }

  try {
    const response = await fetch(`${BACKEND_URL}/ppd/should-show-full-chat/${patientId}`);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('PPD API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
