import React, { useState, useRef, useEffect } from "react";
import { getFirebaseMessaging, getToken, VAPID_PUBLIC_KEY } from "../../lib/firebaseClient";
import { Plus, Calendar } from "lucide-react";
import { saveMedia, getMedia, deleteMedia } from "../../lib/scheduleDb";

// MediaPreview component for displaying media from IndexedDB
function MediaPreview({ mediaId, mediaType }: { mediaId: string, mediaType: string }) {
    const [url, setUrl] = useState<string | null>(null);
    useEffect(() => {
        let revoked = false;
        (async () => {
            const blob = await getMedia(mediaId);
            if (blob && !revoked) {
                setUrl(URL.createObjectURL(blob));
            }
        })();
        return () => {
            revoked = true;
            if (url) URL.revokeObjectURL(url);
        };
    }, [mediaId]);
    if (!url) return <div className="w-24 h-24 bg-blue-950 rounded-lg flex items-center justify-center text-blue-400">...</div>;
    if (mediaType.startsWith("video")) {
        return <video src={url} className="w-24 h-24 rounded-lg object-cover" controls />;
    }
    return <img src={url} alt="Media" className="w-24 h-24 rounded-lg object-cover" />;
}

export default function ScheduleSection() {
    // Helper for datetime-local min value
    function getMinDateTime() {
        const now = new Date();
        now.setSeconds(0, 0);
        return now.toISOString().slice(0, 16);
    }

    // Calendar state
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectedDate, setSelectedDate] = useState(today);

    // Get month name
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    function getDaysInMonth(year: number, month: number): number {
        return new Date(year, month + 1, 0).getDate();
    }
    function getFirstDayOfWeek(year: number, month: number): number {
        return new Date(year, month, 1).getDay();
    }
    function goToPrevMonth() {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    }
    function goToNextMonth() {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    }
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDayOfWeek = getFirstDayOfWeek(currentYear, currentMonth);
    const calendarDays = [];
    for (let i = 0; i < firstDayOfWeek; i++) calendarDays.push(null);
    for (let day = 1; day <= daysInMonth; day++) calendarDays.push(new Date(currentYear, currentMonth, day));

    // State
    const [status, setStatus] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [token, setToken] = useState("");
    const [pushEnabled, setPushEnabled] = useState(false);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isScheduling, setIsScheduling] = useState(false);
    const [sentInfo, setSentInfo] = useState<string | null>(null);

    // Load posts from localStorage on mount
    useEffect(() => {
        let loaded: any[] = [];
        try {
            loaded = JSON.parse(localStorage.getItem("scheduledPosts") || "[]");
        } catch { }
        setPosts(loaded);
    }, []);
    useEffect(() => {
        const sent = localStorage.getItem("sentPostInfo");
        if (sent) setSentInfo(sent);
    }, []);
    useEffect(() => {
        const stored = localStorage.getItem("fcmToken");
        if (stored) {
            setToken(stored);
            setPushEnabled(true);
        } else {
            setShowPermissionModal(true);
        }
    }, []);

    // Permission
    async function handleGrantPermission() {
        setStatus("Requesting notification permission...");
        try {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                setStatus("Permission denied. Notifications will not work.");
                setShowPermissionModal(false);
                return;
            }
            setStatus("Registering service worker...");
            const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
            setStatus("Getting FCM token...");
            const messaging = getFirebaseMessaging();
            const fcmToken = await getToken(messaging, {
                vapidKey: VAPID_PUBLIC_KEY,
                serviceWorkerRegistration: reg,
            });
            if (fcmToken) {
                setToken(fcmToken);
                setPushEnabled(true);
                setStatus("");
                localStorage.setItem("fcmToken", fcmToken);
            } else {
                setStatus("Failed to get FCM token.");
            }
            setShowPermissionModal(false);
        } catch (err) {
            setStatus("Error: " + (err as any)?.message);
            setShowPermissionModal(false);
        }
    }

    // Scheduling
    async function handleSchedule(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsScheduling(true);
        setStatus("");
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        let sendAt = formData.get("sendAt") as string;
        const title = formData.get("title") as string;
        const bodyText = formData.get("body") as string;
        let file = mediaFile;
        let fileType = mediaType;
        if (sendAt) {
            const date = new Date(sendAt);
            sendAt = date.toISOString();
        }
        let fcmToken = token;
        if (!fcmToken) {
            fcmToken = prompt("Enter your FCM token (for demo)") || "";
            setToken(fcmToken);
            localStorage.setItem("fcmToken", fcmToken);
        }
        let mediaId = undefined;
        if (file) {
            mediaId = `${Date.now()}-${file.name}`;
            await saveMedia(mediaId, file);
        }
        const post = {
            id: `${Date.now()}`,
            date: sendAt,
            title,
            body: bodyText,
            mediaId,
            mediaType: fileType,
            sent: false,
        };
        let postsArr = [];
        try {
            postsArr = JSON.parse(localStorage.getItem("scheduledPosts") || "[]");
        } catch { }
        postsArr.push(post);
        localStorage.setItem("scheduledPosts", JSON.stringify(postsArr));
        setPosts(postsArr);
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
        setIsScheduling(false);
        if (res.ok) {
            setShowForm(false);
            setSuccessMessage("Your post has been scheduled!");
            setTimeout(() => setSuccessMessage(null), 3500);
        } else {
            setStatus("Failed to schedule notification.");
        }
        setMediaFile(null);
        setMediaPreview(null);
        setMediaType(null);
    }

    // Render
    return (
        <div className="min-h-screen bg-[#050e23] lg:pl-72 py-8 flex flex-col items-center">
            {/* Permission Modal */}
            {showPermissionModal && (
                <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
                    <div className="bg-[#081f44] border border-blue-900 rounded-2xl shadow-2xl p-8 w-full max-w-sm flex flex-col items-center gap-4 animate-fadeIn">
                        <span className="text-4xl">🔔</span>
                        <h3 className="text-xl font-bold text-white text-center">Enable Notifications</h3>
                        <p className="text-blue-200 text-center text-sm">To schedule and receive reminders, please allow notifications. You can change this anytime in your browser settings.</p>
                        {status && <div className="text-center text-blue-300 text-sm">{status}</div>}
                        <button
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-6 rounded-xl mt-2 shadow text-lg"
                            onClick={handleGrantPermission}
                        >
                            Allow Notifications
                        </button>
                    </div>
                </div>
            )}
            <div className="container mx-auto px-4">
                <div className="w-full max-w-3xl mx-auto bg-[#081f44] rounded-3xl shadow-2xl border border-blue-900 px-0 sm:px-8 py-8 flex flex-col gap-6">
                    <div className="flex items-center gap-4 px-6">
                        <div className="flex items-center justify-center bg-blue-900 rounded-2xl p-2">
                            <Calendar size={32} className="text-blue-400" strokeWidth={2.5} />
                        </div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">Schedule</h2>
                    </div>
                    {pushEnabled && (
                        <>
                            {/* Month/Quick Picker */}
                            <div className="flex items-center gap-2 px-6 mb-4">
                                <button className="px-2 py-1 rounded bg-blue-900 text-blue-200 hover:bg-blue-800" onClick={goToPrevMonth}>◀</button>
                                <span className="font-semibold text-white">{monthNames[currentMonth]} {currentYear}</span>
                                <button className="px-2 py-1 rounded bg-blue-900 text-blue-200 hover:bg-blue-800" onClick={goToNextMonth}>▶</button>
                                <button className="ml-2 px-3 py-1 rounded bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow" onClick={() => { setCurrentMonth(today.getMonth()); setCurrentYear(today.getFullYear()); setSelectedDate(today); }}>Today</button>
                            </div>
                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1 px-6 mb-6">
                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                                    <div key={d} className="text-xs text-center text-blue-200 pb-1 font-semibold uppercase tracking-wide">{d}</div>
                                ))}
                                {calendarDays.map((date, idx) => {
                                    if (!date) return <div key={"empty-" + idx} className="" />;
                                    const day = date.getDate();
                                    const isToday = date.toDateString() === today.toDateString();
                                    const isSelected = date.toDateString() === selectedDate.toDateString();
                                    const isDisabled = date < today && (date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear());
                                    return (
                                        <button
                                            key={date.toISOString()}
                                            disabled={isDisabled}
                                            className={[
                                                "aspect-square w-full flex flex-col items-center justify-center rounded-xl font-semibold text-sm transition-all border",
                                                isToday ? "border-blue-400 bg-blue-950 text-blue-200 shadow-md" :
                                                    isSelected ? "border-blue-600 bg-blue-800 text-white shadow-lg" :
                                                        isDisabled ? "border-blue-900 bg-[#050e23] text-blue-900 opacity-40 cursor-not-allowed" :
                                                            "border-blue-900 bg-blue-950 text-blue-100 hover:bg-blue-900 hover:text-white cursor-pointer"
                                            ].join(" ")}
                                            onClick={() => setSelectedDate(date)}
                                        >
                                            <span>{day}</span>
                                        </button>
                                    );
                                })}
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
                                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-2 sm:px-0 py-6 sm:py-0">
                                    <form
                                        className="relative w-full max-w-md bg-[#081f44] border border-blue-900 rounded-2xl p-4 sm:p-8 flex flex-col gap-6 shadow-2xl animate-fadeIn mx-auto"
                                        onSubmit={handleSchedule}
                                    >
                                        <button type="button" onClick={() => { setShowForm(false); setMediaFile(null); setMediaPreview(null); setMediaType(null); }} className="absolute top-3 right-3 text-blue-200 hover:text-white text-xl font-bold rounded-full w-8 h-8 flex items-center justify-center bg-blue-900/60 hover:bg-blue-900 transition-all focus:outline-none" aria-label="Close">×</button>
                                        <h3 className="text-2xl font-bold text-white mb-2">Add Scheduled Post</h3>
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-32 h-32 bg-blue-950 border-2 border-dashed border-blue-700 rounded-xl flex items-center justify-center text-blue-400 text-4xl mb-2 overflow-hidden">
                                                {mediaPreview ? (
                                                    mediaType && mediaType.startsWith("video") ? (
                                                        <video src={mediaPreview} className="w-full h-full object-cover" controls />
                                                    ) : (
                                                        <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                                                    )
                                                ) : (
                                                    <span>📷</span>
                                                )}
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*,video/*"
                                                ref={fileInputRef}
                                                style={{ display: "none" }}
                                                onChange={e => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setMediaFile(file);
                                                        setMediaType(file.type);
                                                        const url = URL.createObjectURL(file);
                                                        setMediaPreview(url);
                                                    }
                                                }}
                                            />
                                            <button
                                                type="button"
                                                className="text-blue-400 underline text-xs"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                {mediaFile ? "Change Media" : "Select Image or Video"}
                                            </button>
                                            {mediaFile && (
                                                <button
                                                    type="button"
                                                    className="text-red-400 underline text-xs mt-1"
                                                    onClick={() => { setMediaFile(null); setMediaPreview(null); setMediaType(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                                                >
                                                    Remove Media
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-white text-sm font-medium" htmlFor="sendAt">Pick date & time:</label>
                                            <input
                                                type="datetime-local"
                                                name="sendAt"
                                                id="sendAt"
                                                required
                                                min={getMinDateTime()}
                                                className="rounded px-3 py-2 text-black border border-blue-300 focus:ring-2 focus:ring-blue-500"
                                                style={{ background: '#fff' }}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-white text-sm font-medium" htmlFor="title">Caption:</label>
                                            <input
                                                type="text"
                                                name="title"
                                                id="title"
                                                placeholder="Enter caption"
                                                className="rounded px-3 py-2 text-black border border-blue-300 focus:ring-2 focus:ring-blue-500"
                                                style={{ background: '#fff' }}
                                            />
                                        </div>
                                        {status && <div className="text-center text-blue-300 mt-2 text-sm">{status}</div>}
                                        <button
                                            type="submit"
                                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-6 rounded-xl mt-2 shadow text-lg flex items-center justify-center gap-2"
                                            disabled={isScheduling}
                                        >
                                            {isScheduling && (
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                                            )}
                                            {isScheduling ? "Scheduling..." : "Schedule Notification"}
                                        </button>
                                    </form>
                                </div>
                            )}
                            {/* Daily View */}
                            <div className="mt-8 px-6">
                                <h4 className="text-lg font-bold text-white mb-3">Scheduled Posts for {selectedDate.toLocaleDateString()}</h4>
                                {successMessage && (
                                    <div className="mb-4 p-3 rounded-xl bg-green-700/80 text-white text-center font-semibold animate-fadeIn">
                                        {successMessage}
                                    </div>
                                )}
                                {sentInfo && (
                                    <div className="mb-4 p-3 rounded-xl bg-blue-800/80 text-blue-100 text-center text-sm animate-fadeIn">
                                        <span className="mr-2">✅</span>{sentInfo}
                                    </div>
                                )}
                                <div className="bg-blue-950 border border-blue-900 rounded-2xl p-8 text-center text-blue-200 flex flex-col items-center">
                                    <div className="mb-4">
                                        <span className="text-4xl">📅</span>
                                    </div>
                                    {posts.filter(post => post.date && new Date(post.date).toDateString() === selectedDate.toDateString()).length === 0 ? (
                                        <div className="mb-4">No posts scheduled for this day.</div>
                                    ) : (
                                        <div className="w-full flex flex-col gap-4">
                                            {posts.filter(post => post.date && new Date(post.date).toDateString() === selectedDate.toDateString()).map(post => (
                                                <div key={post.id} className="bg-blue-900/60 rounded-xl p-4 flex flex-col items-center gap-2 border border-blue-800">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-white">{post.title}</span>
                                                        {post.sent && <span className="ml-2 text-green-400 text-xs">Sent</span>}
                                                    </div>
                                                    <div className="text-blue-200 text-xs mb-1">{post.date ? new Date(post.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                                                    {post.mediaId && post.mediaType && (
                                                        <MediaPreview mediaId={post.mediaId} mediaType={post.mediaType} />
                                                    )}
                                                    <div className="text-blue-300 text-xs mt-1">{post.body}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <button
                                        className="py-3 px-6 rounded-xl font-bold transition-all bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-lg mt-2 shadow"
                                        onClick={() => setShowForm(true)}
                                    >
                                        + Add Scheduled Post
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}