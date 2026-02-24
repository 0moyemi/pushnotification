// app/api/save-token/route.ts
// In-memory token store (for demo only, resets on server restart)
let tokens: string[] = [];

export async function POST(req: Request) {
    try {
        const { token } = await req.json();
        if (token && !tokens.includes(token)) {
            tokens.push(token);
        }
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch {
        return new Response(JSON.stringify({ success: false }), { status: 400 });
    }
}

// For testing: GET returns all tokens
export async function GET() {
    return new Response(JSON.stringify(tokens), { status: 200 });
}
