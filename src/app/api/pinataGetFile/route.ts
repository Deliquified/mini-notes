import { NextResponse } from 'next/server';
import { pinata } from '@/app/pinata/config';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cid = searchParams.get('cid');

    if (!cid) {
      return NextResponse.json({ error: 'CID parameter is required' }, { status: 400 });
    }

    // console.log('📦 Fetching file from Pinata:', cid);
    
    const response = await pinata.gateways.private.get(cid);
    
    if (!response || !response.data) {
      return NextResponse.json({ error: 'Failed to retrieve file from Pinata' }, { status: 404 });
    }

    // console.log('✅ Successfully retrieved file from Pinata');
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('❌ Error in pinataGetFile:', error);
    return NextResponse.json({ error: 'Failed to retrieve file from Pinata' }, { status: 500 });
  }
}