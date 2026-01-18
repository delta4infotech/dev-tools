import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return new NextResponse('Missing URL parameter', { status: 400 });
    }

    try {
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
            return new NextResponse(`Failed to fetch image: ${response.statusText}`, { status: response.status });
        }

        const contentType = response.headers.get('content-type');
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const headers = new Headers();
        if (contentType) {
            headers.set('Content-Type', contentType);
        }

        // Set CORS headers
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');

        return new NextResponse(buffer, {
            status: 200,
            headers: headers,
        });
    } catch (error) {
        console.error('Error fetching image:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
