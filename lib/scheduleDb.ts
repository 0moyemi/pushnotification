// lib/scheduleDb.ts
// IndexedDB helpers for media storage

export async function saveMedia(id: string, file: Blob) {
    return new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("scheduleMediaDB", 1);
        request.onupgradeneeded = function (event) {
            const db = request.result;
            if (!db.objectStoreNames.contains("media")) {
                db.createObjectStore("media");
            }
        };
        request.onsuccess = function () {
            const db = request.result;
            const tx = db.transaction("media", "readwrite");
            const store = tx.objectStore("media");
            store.put(file, id);
            tx.oncomplete = function () {
                db.close();
                resolve();
            };
            tx.onerror = function (e) {
                db.close();
                reject(e);
            };
        };
        request.onerror = function (e) {
            reject(e);
        };
    });
}

export async function getMedia(id: string): Promise<Blob | undefined> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("scheduleMediaDB", 1);
        request.onsuccess = function () {
            const db = request.result;
            const tx = db.transaction("media", "readonly");
            const store = tx.objectStore("media");
            const getReq = store.get(id);
            getReq.onsuccess = function () {
                db.close();
                resolve(getReq.result);
            };
            getReq.onerror = function (e) {
                db.close();
                reject(e);
            };
        };
        request.onerror = function (e) {
            reject(e);
        };
    });
}

export async function deleteMedia(id: string) {
    return new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("scheduleMediaDB", 1);
        request.onsuccess = function () {
            const db = request.result;
            const tx = db.transaction("media", "readwrite");
            const store = tx.objectStore("media");
            store.delete(id);
            tx.oncomplete = function () {
                db.close();
                resolve();
            };
            tx.onerror = function (e) {
                db.close();
                reject(e);
            };
        };
        request.onerror = function (e) {
            reject(e);
        };
    });
}
