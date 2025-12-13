import { useState, useRef, useCallback, useMemo } from 'react';

export type TUploadStatus = 'idle' | 'uploading' | 'paused' | 'completed' | 'cancelled' | 'error';

type TUploadState = {
    status: TUploadStatus,
    progress: number,
    speed: number,
    bytes: number,
    remainingTimeMs: number | null,
    error: string | null,
}

type TUploadControls = {
    start: (file: File, from?: number) => void,
    pause: () => void,
    resume: (file: File) => void,
    cancel: () => void,
}

const DEFAULT_STATE: TUploadState = {
    status: 'idle',
    progress: 0,
    speed: 0,
    bytes: 0,
    remainingTimeMs: null,
    error: null,
}

function uploadRequest(
    params: { start: number, url: string, file: File },
    handle: (event: 'progress' | 'error' | 'load' | 'abort' | 'pause', ev: ProgressEvent, from: number) => void
): XMLHttpRequest {
    const xhr = new XMLHttpRequest();

    xhr.onload = (ev) => {
        if (xhr.status >= 200 && xhr.status < 300) {
            handle('load', ev, params.start);
        } else {
            handle('error', ev, params.start);
        }
    }
    xhr.onerror = (ev) => handle('error', ev, params.start);

    xhr.onabort = (ev) => handle('abort', ev, params.start);

    xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
            handle('progress', event, params.start);
        }
    }

    xhr.open('POST', params.url);
    xhr.setRequestHeader('X-File-Name', params.file.name);

    xhr.send(params.file.slice(params.start));
    return xhr;
}

export function useFileUpload(): [TUploadState, TUploadControls] {
    const [state, setState] = useState<TUploadState>(
        DEFAULT_STATE
    );

    const speedRef = useRef<{ lastLoaded: number; lastTime: number }>({ lastLoaded: 0, lastTime: 0 });
    const xhrRef = useRef<XMLHttpRequest | null>(null);
    const fileSizeRef = useRef<number>(0);
    const uploadedOffsetRef = useRef<number>(0);

    const handle = useCallback((event: 'progress' | 'error' | 'load' | 'abort' | 'pause', ev: ProgressEvent, from: number) => {
        if (event === 'progress') {
            const totalLoaded = from + ev.loaded;
            uploadedOffsetRef.current = totalLoaded;

            const now = Date.now();
            const timeDiff = now - speedRef.current.lastTime;
            let speedKBps: number | undefined = undefined;
            if (timeDiff >= 500) {
                const loadedDiff = totalLoaded - speedRef.current.lastLoaded;
                speedKBps = (loadedDiff / 1024) / (timeDiff / 1000); // KB/s
                speedRef.current = { lastLoaded: totalLoaded, lastTime: now };
            }

            const totalSize = fileSizeRef.current > 0 ? fileSizeRef.current : (from + ev.total);
            const progress = totalSize > 0 ? (totalLoaded / totalSize) * 100 : 0;

            const currentSpeed = speedKBps ?? state.speed;

            let remainingTimeMs: number | null = null;
            if (currentSpeed > 0) {
                const remainingBytes = totalSize - totalLoaded;
                const remainingKB = remainingBytes / 1024;
                const remainingSeconds = remainingKB / currentSpeed;
                remainingTimeMs = remainingSeconds * 1000;
            }

            setState(prev => ({
                ...prev,
                status: 'uploading',
                progress: Math.min(100, progress),
                speed: currentSpeed,
                bytes: totalLoaded,
                remainingTimeMs: remainingTimeMs
            }));
        } else if (event === 'error') {
            setState(prev => ({
                ...prev,
                status: 'error',
                error: 'Upload failed',
                remainingTimeMs: null
            }));
        } else if (event === 'load') {
            uploadedOffsetRef.current = fileSizeRef.current; // Done
            setState(prev => ({
                ...prev,
                status: 'completed',
                progress: 100,
                speed: 0,
                bytes: fileSizeRef.current,
                remainingTimeMs: 0
            }));
        } else if (event === 'abort') {
            // Abort handled by manual actions or pause
        } else if (event === 'pause') {
            setState(prev => ({
                ...prev,
                status: 'paused',
                speed: 0,
                remainingTimeMs: null
            }));
        }
    }, [state.speed]);

    const controls = useMemo<TUploadControls>(() => ({
        start: (file: File, from: number = 0) => {
            fileSizeRef.current = file.size;
            uploadedOffsetRef.current = from;

            setState(prev => ({
                ...prev,
                status: 'uploading',
                progress: file.size > 0 ? (from / file.size) * 100 : 0,
                speed: 0,
                error: null,
                bytes: from,
                remainingTimeMs: null
            }));

            speedRef.current = { lastLoaded: from, lastTime: Date.now() };

            if (xhrRef.current) {
                xhrRef.current.abort();
            }

            xhrRef.current = uploadRequest({
                start: from,
                url: 'http://localhost:3000/api/upload',
                file,
            }, handle);
        },
        pause: () => {
            if (xhrRef.current) {
                xhrRef.current.abort();
            }
            setState(prev => ({
                ...prev,
                status: 'paused',
                speed: 0,
                remainingTimeMs: null
            }));
        },
        resume: function (file: File) {
            const offset = uploadedOffsetRef.current;
            this.start(file, offset);
        },
        cancel: () => {
            if (xhrRef.current) {
                xhrRef.current.abort();
                xhrRef.current = null;
            }
            uploadedOffsetRef.current = 0;
            setState(() => ({
                ...DEFAULT_STATE
            }));
        },
    }), [handle]);


    return [state, controls];
}