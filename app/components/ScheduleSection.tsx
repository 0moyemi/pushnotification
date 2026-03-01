"use client"
import React, { useState, useRef, useEffect } from "react";
// ...existing code...
// Helper to fetch sent status from backend
async function fetchSentStatus(postIds: string[]): Promise<Record<string, boolean>> {
    // Replace with your actual API endpoint
    const res = await fetch("/api/sent-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: postIds }),
    });
    if (!res.ok) return {};
    return await res.json(); // { [id]: true/false }
}
import { getFirebaseMessaging, getToken, VAPID_PUBLIC_KEY } from "../../lib/firebaseClient";
import { Plus, Calendar, ChevronDown, Trash2, Share2 } from "lucide-react";
import { saveMedia, getMedia, deleteMedia } from "../../lib/scheduleDb";

// Helper: get next 15-min slot
function getNext15MinISO() {
    const now = new Date();
    now.setSeconds(0, 0);
    now.setMinutes(now.getMinutes() + 15 - (now.getMinutes() % 15));
    return now.toISOString().slice(0, 16);
}

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
    const [accordionOpen, setAccordionOpen] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
            // Only show the modal if we haven't asked before
            const alreadyAsked = localStorage.getItem("notificationAsked");
            if (!alreadyAsked) {
                setShowPermissionModal(true);
            }
        }
    }, []);

    // Permission
    function handleGrantPermission() {
        // Mark as asked so we never show the modal again
        localStorage.setItem("notificationAsked", "true");
        setShowPermissionModal(false);

        // Must call requestPermission synchronously from a user gesture for iOS
        if (typeof Notification === "undefined") {
            setStatus("Notifications are not supported on this device/browser.");
            return;
        }

        Notification.requestPermission().then(async (permission) => {
            if (permission !== "granted") {
                setStatus("Notification permission denied.");
                return;
            }
            setStatus("Setting up notifications...");
            try {
                const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
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
                    setStatus("Could not get notification token.");
                }
            } catch (err) {
                setStatus("Notification setup failed: " + (err as any)?.message);
            }
        }).catch((err) => {
            setStatus("Permission request failed: " + (err as any)?.message);
        });
    }

    function handleDismissPermission() {
        localStorage.setItem("notificationAsked", "true");
        setShowPermissionModal(false);
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
        // If backend returns an _id, use it; otherwise, fallback to Date.now()
        let backendId = undefined;
        try {
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
            if (res.ok) {
                const data = await res.json();
                backendId = data._id || data.id;
            }
        } catch { }
        const post = {
            id: backendId || `${Date.now()}`,
            date: sendAt,
            title,
            body: bodyText,
            mediaId,
            mediaType: fileType,
            sent: false,
            created: Date.now(),
        };
        let postsArr = [];
        try {
            postsArr = JSON.parse(localStorage.getItem("scheduledPosts") || "[]");
        } catch { }
        postsArr.push(post);
        localStorage.setItem("scheduledPosts", JSON.stringify(postsArr));
        setPosts(postsArr);
        setIsScheduling(false);
        setShowForm(false);
        setSuccessMessage("Your post has been scheduled!");
        setTimeout(() => setSuccessMessage(null), 3500);
        setMediaFile(null);
        setMediaPreview(null);
        setMediaType(null);
    }

    // Auto-delete sent posts after 3 days
    useEffect(() => {
        const now = Date.now();
        const updated = posts.filter(post => !(post.sent && post.created && now - post.created > 3 * 24 * 60 * 60 * 1000));
        if (updated.length !== posts.length) {
            setPosts(updated);
            localStorage.setItem("scheduledPosts", JSON.stringify(updated));
        }
    }, [posts]);

    // Fix cursor bug: force pointer-events on modal overlay
    useEffect(() => {
        if (showForm) {
            document.body.style.cursor = "auto";
        }
    }, [showForm]);

    // Periodically check sent status from backend (MongoDB)
    useEffect(() => {
        const interval = setInterval(async () => {
            let postsArr: any[] = [];
            try {
                postsArr = JSON.parse(localStorage.getItem("scheduledPosts") || "[]");
            } catch { }
            const now = Date.now();
            // Only check posts that are not sent and are due
            const duePosts = postsArr.filter(post => !post.sent && post.date && now > new Date(post.date).getTime() + 60 * 1000 && post.id);
            if (duePosts.length > 0) {
                const statusMap = await fetchSentStatus(duePosts.map(p => p.id));
                let changed = false;
                const newPosts = postsArr.map(post => {
                    if (statusMap[post.id] === true && !post.sent) {
                        changed = true;
                        return { ...post, sent: true };
                    }
                    return post;
                });
                if (changed) {
                    localStorage.setItem("scheduledPosts", JSON.stringify(newPosts));
                    setPosts(newPosts);
                }
            }
        }, 15000); // Check every 15 seconds
        return () => clearInterval(interval);
    }, [posts]);

    // Share to WhatsApp (caption + media)
    async function shareToWhatsApp(post: any) {
        const caption = post.title || '';
        // Copy caption to clipboard
        try {
            await navigator.clipboard.writeText(caption);
            setSuccessMessage('Caption copied to clipboard!');
            setTimeout(() => setSuccessMessage(null), 2000);
        } catch {
            alert('Failed to copy caption to clipboard.');
        }
        // Try to get media from IndexedDB
        if (post.mediaId && post.mediaType) {
            try {
                const blob = await getMedia(post.mediaId);
                if (blob) {
                    // Try Web Share API with files
                    if (navigator.canShare && navigator.canShare({ files: [new File([blob], 'media', { type: post.mediaType })] })) {
                        try {
                            await navigator.share({
                                files: [new File([blob], 'media', { type: post.mediaType })],
                                text: caption,
                                title: 'Share to WhatsApp',
                            });
                            return;
                        } catch (err: any) {
                            const msg = typeof err === 'object' && err && 'message' in err ? (err as any).message : String(err);
                            alert('Sharing failed: ' + msg);
                            return;
                        }
                    } else {
                        alert('Sharing media is not supported on this device/browser.');
                        return;
                    }
                } else {
                    alert('Could not retrieve media for sharing.');
                    return;
                }
            } catch {
                alert('Could not retrieve media for sharing.');
                return;
            }
        } else {
            alert('No media found for this post. Only caption copied.');
        }
    }

    // Render
    // Split posts
    const unsentPosts = posts.filter(p => !p.sent && p.date && new Date(p.date).toDateString() === selectedDate.toDateString());
    const sentPosts = posts.filter(p => p.sent && p.date && new Date(p.date).toDateString() === selectedDate.toDateString());
    return (
        <div className="min-h-screen bg-[#050e23] lg:pl-72 py-8 flex flex-col items-center">
            {/* Permission Modal */}
            {showPermissionModal && (
                <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
                    <div className="bg-[#081f44] border border-blue-900 rounded-2xl shadow-2xl p-8 w-full max-w-sm flex flex-col items-center gap-4 animate-fadeIn">
                        <span className="text-4xl">🔔</span>
                        <h3 className="text-xl font-bold text-white text-center">Enable Notifications</h3>
                        <p className="text-blue-200 text-center text-sm">To receive reminders for your scheduled posts, allow notifications. You can change this anytime in your device settings.</p>
                        {status && <div className="text-center text-blue-300 text-sm">{status}</div>}
                        <button
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-6 rounded-xl mt-2 shadow text-lg"
                            onClick={handleGrantPermission}
                        >
                            Allow Notifications
                        </button>
                        <button
                            className="w-full text-blue-400 hover:text-blue-200 text-sm py-2 transition-colors"
                            onClick={handleDismissPermission}
                        >
                            Maybe Later
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
                    {/* Schedule content always visible regardless of notification permission */}
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
                                const hasPost = posts.some(p => p.date && new Date(p.date).toDateString() === date.toDateString());
                                // Past = strictly before today at midnight
                                const todayMid = new Date(today); todayMid.setHours(0, 0, 0, 0);
                                const dateMid = new Date(date); dateMid.setHours(0, 0, 0, 0);
                                const isPast = dateMid < todayMid;
                                // Muted = past AND no posts (nothing to review, can't schedule there)
                                const isMuted = isPast && !hasPost;
                                return (
                                    <button
                                        key={date.toISOString()}
                                        disabled={isMuted}
                                        className={[
                                            "aspect-square w-full flex flex-col items-center justify-center rounded-xl font-semibold text-sm transition-all duration-150 border relative",
                                            isSelected && isToday ? "border-blue-400 ring-2 ring-blue-400 bg-blue-800 text-white shadow-lg" :
                                                isToday ? "border-blue-400 bg-blue-950 text-blue-200 shadow-md" :
                                                    isSelected ? "border-blue-600 bg-blue-800 text-white shadow-lg" :
                                                        isMuted ? "border-transparent bg-transparent text-blue-900 opacity-25 cursor-not-allowed" :
                                                            isPast ? "border-blue-900/50 bg-blue-950/40 text-blue-500 opacity-60 hover:bg-blue-900 hover:text-white cursor-pointer" :
                                                                "border-blue-900 bg-blue-950 text-blue-100 hover:bg-blue-800 hover:text-white cursor-pointer"
                                        ].join(" ")}
                                        onClick={() => !isMuted && setSelectedDate(date)}
                                    >
                                        <span>{day}</span>
                                        {hasPost && (
                                            <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-green-500 border border-white"></span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        {/* Add Post Button */}
                        {/* Only enable scheduling for today/future */}
                        <button
                            className="w-full mb-6 py-4 px-6 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl active:scale-98 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                            onClick={() => setShowForm(true)}
                            disabled={selectedDate.setHours(0, 0, 0, 0) < today.setHours(0, 0, 0, 0)}
                        >
                            <Plus size={24} strokeWidth={2.5} />
                            Add Scheduled Post
                        </button>
                        {showForm && (
                            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-2 sm:px-0 py-6 sm:py-0">
                                <form
                                    className="relative w-full max-w-md bg-[#081f44] border border-blue-900 rounded-2xl p-4 sm:p-8 flex flex-col gap-6 shadow-2xl animate-fadeIn mx-auto"
                                    onSubmit={handleSchedule}
                                >
                                    <button type="button" onClick={() => { setShowForm(false); setMediaFile(null); setMediaPreview(null); setMediaType(null); }} className="absolute top-3 right-3 text-blue-200 hover:text-white text-xl font-bold rounded-full w-8 h-8 flex items-center justify-center bg-blue-900/60 hover:bg-blue-900 transition-all focus:outline-none" aria-label="Close">×</button>
                                    <h3 className="text-2xl font-bold text-white mb-2">Add Scheduled Post</h3>
                                    {/* Clickable Media Box - Centered */}
                                    <div className="flex justify-center w-full">
                                        <div
                                            className="w-32 h-32 bg-blue-950 border-2 border-dashed border-blue-700 rounded-xl flex items-center justify-center text-blue-400 text-4xl mb-2 overflow-hidden cursor-pointer"
                                            tabIndex={0}
                                            onClick={() => fileInputRef.current?.click()}
                                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                                        >
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
                                    <div className="flex flex-col gap-2">
                                        <label className="text-white text-sm font-medium" htmlFor="sendAt">Pick date & time:</label>
                                        <input
                                            type="datetime-local"
                                            name="sendAt"
                                            id="sendAt"
                                            required
                                            min={getMinDateTime()}
                                            defaultValue={getNext15MinISO()}
                                            className="rounded px-3 py-2 text-black border border-blue-300 focus:ring-2 focus:ring-blue-500"
                                            style={{ background: '#fff' }}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-white text-sm font-medium" htmlFor="title">Caption:</label>
                                        <textarea
                                            name="title"
                                            id="title"
                                            placeholder="Enter caption"
                                            className="rounded px-3 py-2 text-black border border-blue-300 focus:ring-2 focus:ring-blue-500 min-h-[48px]"
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
                        <div className="mt-8 px-2 sm:px-6">
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
                            {/* Unsent posts */}
                            <div className="flex flex-col gap-4">
                                {unsentPosts.length === 0 && (
                                    <div className="mb-4 flex flex-col items-center gap-2 py-6 text-blue-200">
                                        <Calendar size={36} className="text-blue-700 opacity-60" />
                                        <span>No posts scheduled for this day.</span>
                                    </div>
                                )}
                                {unsentPosts.map(post => (
                                    <div key={post.id} className="animate-fadeIn bg-blue-900/60 rounded-xl p-4 flex flex-col items-center gap-2 border border-blue-800 w-full">
                                        {post.mediaId && post.mediaType && (
                                            <MediaPreview mediaId={post.mediaId} mediaType={post.mediaType} />
                                        )}
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-xs px-2 py-1 rounded bg-blue-700 text-white font-semibold">
                                                {post.date ? new Date(post.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </span>
                                            <span className="text-xs px-2 py-1 rounded bg-yellow-600 text-white font-semibold">Not Sent</span>
                                        </div>
                                        <div className="text-white text-sm text-center mt-1 break-words max-w-full leading-snug">
                                            {post.title || "No caption"}
                                        </div>
                                        <div className="flex w-full gap-2 mt-2 justify-center">
                                            <button
                                                className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium flex items-center gap-1 text-sm shadow-sm transition-all"
                                                style={{ minWidth: 0 }}
                                                onClick={() => shareToWhatsApp(post)}
                                                type="button"
                                            >
                                                <Share2 size={14} /> Share to WhatsApp
                                            </button>
                                            {confirmDeleteId === post.id ? (
                                                <div className="animate-popIn flex gap-1 items-center">
                                                    <button
                                                        className="px-2 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all"
                                                        onClick={async () => {
                                                            const updated = posts.filter(p => p.id !== post.id);
                                                            setPosts(updated);
                                                            localStorage.setItem("scheduledPosts", JSON.stringify(updated));
                                                            if (post.mediaId) await deleteMedia(post.mediaId);
                                                            setConfirmDeleteId(null);
                                                        }}
                                                        type="button"
                                                    >Yes, delete</button>
                                                    <button
                                                        className="px-2 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs transition-all"
                                                        onClick={() => setConfirmDeleteId(null)}
                                                        type="button"
                                                    >Cancel</button>
                                                </div>
                                            ) : (
                                                <button
                                                    className="px-3 py-1.5 rounded-lg bg-transparent text-red-400 font-medium flex items-center gap-1 text-sm border border-red-400 hover:bg-red-900/20 shadow-sm transition-all"
                                                    style={{ minWidth: 0 }}
                                                    onClick={() => setConfirmDeleteId(post.id)}
                                                    type="button"
                                                >
                                                    <Trash2 size={14} /> Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Sent posts accordion */}
                            <div className="mt-6">
                                <button
                                    className="w-full flex items-center justify-between py-3 px-4 rounded-xl bg-blue-800/60 text-white font-bold text-base mb-2 hover:bg-blue-700/70 transition-colors duration-150"
                                    onClick={() => setAccordionOpen(v => !v)}
                                    type="button"
                                >
                                    Sent Posts ({sentPosts.length})
                                    <span className={`transition-transform duration-200 ${accordionOpen ? 'rotate-180' : 'rotate-0'}`}>
                                        <ChevronDown size={20} />
                                    </span>
                                </button>
                                {accordionOpen && (
                                    <div className="animate-slideDown flex flex-col gap-4">
                                        {sentPosts.length === 0 && <div className="text-blue-200">No sent posts.</div>}
                                        {sentPosts.map(post => (
                                            <div key={post.id} className="animate-fadeIn bg-blue-900/40 rounded-xl p-4 flex flex-col items-center gap-2 border border-blue-800 w-full">
                                                {post.mediaId && post.mediaType && (
                                                    <MediaPreview mediaId={post.mediaId} mediaType={post.mediaType} />
                                                )}
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-xs px-2 py-1 rounded bg-blue-700 text-white font-semibold">
                                                        {post.date ? new Date(post.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                    </span>
                                                    <span className="text-xs px-2 py-1 rounded bg-green-600 text-white font-semibold">Sent</span>
                                                </div>
                                                <div className="text-white text-sm text-center mt-1 break-words max-w-full leading-snug">
                                                    {post.title || "No caption"}
                                                </div>
                                                <div className="flex w-full gap-2 mt-2 justify-center">
                                                    <button
                                                        className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium flex items-center gap-1 text-sm shadow-sm transition-all"
                                                        style={{ minWidth: 0 }}
                                                        onClick={() => shareToWhatsApp(post)}
                                                        type="button"
                                                    >
                                                        <Share2 size={14} /> WhatsApp
                                                    </button>
                                                    {confirmDeleteId === post.id ? (
                                                        <div className="animate-popIn flex gap-1 items-center">
                                                            <button
                                                                className="px-2 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all"
                                                                onClick={async () => {
                                                                    const updated = posts.filter(p => p.id !== post.id);
                                                                    setPosts(updated);
                                                                    localStorage.setItem("scheduledPosts", JSON.stringify(updated));
                                                                    if (post.mediaId) await deleteMedia(post.mediaId);
                                                                    setConfirmDeleteId(null);
                                                                }}
                                                                type="button"
                                                            >Yes, delete</button>
                                                            <button
                                                                className="px-2 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs transition-all"
                                                                onClick={() => setConfirmDeleteId(null)}
                                                                type="button"
                                                            >Cancel</button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            className="px-3 py-1.5 rounded-lg bg-transparent text-red-400 font-medium flex items-center gap-1 text-sm border border-red-400 hover:bg-red-900/20 shadow-sm transition-all"
                                                            style={{ minWidth: 0 }}
                                                            onClick={() => setConfirmDeleteId(post.id)}
                                                            type="button"
                                                        >
                                                            <Trash2 size={14} /> Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                </div>
            </div>
        </div>
    );
}