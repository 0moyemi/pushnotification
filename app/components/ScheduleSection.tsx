import React, { useState } from "react";
import { Plus, Calendar } from "lucide-react";

export default function ScheduleSection() {
    const [status, setStatus] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [token, setToken] = useState("");

    // Get FCM token on mount (simulate push enabled)
    React.useEffect(() => {
        // In a real app, get the token from auth/user context or push logic
        // For demo, use localStorage or prompt user
        const stored = localStorage.getItem("fcmToken");
        if (stored) setToken(stored);
    }, []);

    function getMinDateTime() {
        const now = new Date();
        now.setSeconds(0, 0);
        return now.toISOString().slice(0, 16);
    }

    return (
        <div className="min-h-screen bg-[#081f44] lg:pl-72 pt-4">
            <div className="p-4 max-w-2xl mx-auto">
                <div className="mb-6 flex items-center gap-3">
                    <Calendar size={28} className="text-blue-400" strokeWidth={2.5} />
                    <h2 className="text-3xl font-bold text-white tracking-tight">Schedule</h2>
                </div>
                {/* FCM Token Display */}
                <div className="mb-4">
                    <span className="text-xs text-blue-200">Current FCM Token:</span>
                    <div className="break-all text-xs text-blue-300 bg-blue-950 border border-blue-900 rounded p-2 mt-1 select-all">
                        {token ? token : <span className="text-red-400">No token found</span>}
                    </div>
                </div>
                {/* Month/Quick Picker */}
                <div className="flex items-center gap-2 mb-4">
                    <button className="px-2 py-1 rounded bg-blue-900 text-blue-200 hover:bg-blue-800">◀</button>
                    <span className="font-semibold text-white">Month Year</span>
                    <button className="px-2 py-1 rounded bg-blue-900 text-blue-200 hover:bg-blue-800">▶</button>
                    <button className="ml-2 px-3 py-1 rounded bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow">Today</button>
                </div>
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-6">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                        <div key={d} className="text-xs text-center text-blue-200 pb-1 font-semibold">{d}</div>
                    ))}
                    {/* ...calendar days go here... */}
                </div>
                {/* Add Post Button */}
                <button
                    className="w-full mb-6 py-4 px-6 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl active:scale-98 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                    onClick={() => setShowForm((v) => !v)}
                >
                    <Plus size={24} strokeWidth={2.5} />
                    {showForm ? "Close" : "Add Scheduled Post"}
                </button>
                {showForm && (
                    <form
                        className="bg-blue-950 border border-blue-900 rounded-2xl p-6 mb-8 flex flex-col gap-4"
                        onSubmit={async (e) => {
                            e.preventDefault();
                            setStatus("Scheduling notification...");
                            const form = e.target as HTMLFormElement;
                            const formData = new FormData(form);
                            let sendAt = formData.get("sendAt") as string;
                            const title = formData.get("title") as string;
                            const bodyText = formData.get("body") as string;
                            // Convert to full ISO string with seconds and ms
                            if (sendAt) {
                                const date = new Date(sendAt);
                                sendAt = date.toISOString();
                            }
                            // Use token from state or prompt
                            let fcmToken = token;
                            if (!fcmToken) {
                                fcmToken = prompt("Enter your FCM token (for demo)") || "";
                                setToken(fcmToken);
                                localStorage.setItem("fcmToken", fcmToken);
                            }
                            const res = await fetch("/api/schedule", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    token: fcmToken,
                                    sendAt,
                                    title: title || "Scheduled Test",
                                    body: bodyText || "This notification was scheduled by you.",
                                }),
                            });
                            if (res.ok) setStatus("Scheduled notification!");
                            else setStatus("Failed to schedule notification.");
                        }}
                    >
                        <div className="flex flex-col gap-1">
                            <label className="text-white text-sm" htmlFor="sendAt">Pick date & time:</label>
                            <input
                                type="datetime-local"
                                name="sendAt"
                                id="sendAt"
                                required
                                min={getMinDateTime()}
                                className="rounded px-2 py-2 text-black"
                                style={{ background: '#fff' }}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-white text-sm" htmlFor="title">Title:</label>
                            <input
                                type="text"
                                name="title"
                                id="title"
                                placeholder="Notification Title"
                                className="rounded px-2 py-2 text-black"
                                style={{ background: '#fff' }}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-white text-sm" htmlFor="body">Body:</label>
                            <input
                                type="text"
                                name="body"
                                id="body"
                                placeholder="Notification Body"
                                className="rounded px-2 py-2 text-black"
                                style={{ background: '#fff' }}
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-6 rounded-xl mt-2 shadow"
                        >
                            Schedule Notification
                        </button>
                        {status && <div className="text-center text-blue-300 mt-2">{status}</div>}
                    </form>
                )}
                {/* Daily View */}
                <div className="mt-8">
                    <h4 className="text-lg font-bold text-white mb-3">Scheduled Posts for [Selected Date]</h4>
                    <div className="bg-blue-950 border border-blue-900 rounded-2xl p-8 text-center text-blue-200 flex flex-col items-center">
                        <div className="mb-4">
                            <span className="text-4xl">📅</span>
                        </div>
                        <div className="mb-4">No posts scheduled for this day.</div>
                        <button
                            className="py-3 px-6 rounded-xl font-bold transition-all bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-lg mt-2 shadow"
                            onClick={() => setShowForm(true)}
                        >
                            + Add Scheduled Post
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
