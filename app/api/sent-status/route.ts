import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB || "sales-assistant";

export async function POST(req: NextRequest) {
    try {
        const { ids } = await req.json();
        if (!Array.isArray(ids)) {
            return NextResponse.json({}, { status: 400 });
        }
        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection("notifications");
        const objectIds = ids.map((id: string) => {
            try {
                return new ObjectId(id);
            } catch {
                return null;
            }
        }).filter((id): id is ObjectId => id !== null);
        const docs = await collection.find({ _id: { $in: objectIds } }).toArray();
        const statusMap: Record<string, boolean> = {};
        for (const doc of docs) {
            statusMap[String(doc._id)] = !!doc.sent;
        }
        await client.close();
        return NextResponse.json(statusMap);
    } catch (err) {
        return NextResponse.json({}, { status: 500 });
    }
}
