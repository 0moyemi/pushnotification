// app/api/schedule/route.ts

import { NextRequest } from "next/server";
import { MongoClient } from "mongodb";
const dbName = "pushnotiftest";

export async function POST(req: NextRequest) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        return new Response("Missing MONGODB_URI", { status: 500 });
    }
    const client = new MongoClient(uri);
    try {
        const { token, sendAt, title, body } = await req.json();
        if (!token || !sendAt || !title || !body) {
            return new Response("Missing fields", { status: 400 });
        }
        await client.connect();
        const db = client.db(dbName);
        const jobs = db.collection("jobs");
        await jobs.insertOne({ token, sendAt: new Date(sendAt), title, body, sent: false });
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    } finally {
        await client.close();
    }
}
