export function formatBytes(bytes) {
    if (bytes <= 0 || !isFinite(bytes))
        return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}
export function formatEta(seconds) {
    if (!seconds || seconds <= 0 || !isFinite(seconds))
        return "--:--";
    if (seconds < 60)
        return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    if (mins < 60)
        return `${mins}m ${secs.toString().padStart(2, "0")}s`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours}h ${remMins.toString().padStart(2, "0")}m`;
}
export class TerminalProgressBar {
    title;
    totalBytes;
    downloadedBytes = 0;
    lastTime = Date.now();
    lastBytes = 0;
    smoothSpeed = 0;
    activeMirror = "CDN";
    isTTY;
    lastLogTime = 0;
    alpha = 0.25; // EMA factor
    constructor(title, totalBytes) {
        this.title = title;
        this.totalBytes = totalBytes;
        this.isTTY = Boolean(process.stdout.isTTY && process.stderr.isTTY);
    }
    setMirror(mirror) {
        this.activeMirror = mirror;
    }
    setTotal(total) {
        if (total > 0)
            this.totalBytes = total;
    }
    update(downloaded) {
        this.downloadedBytes = downloaded;
        const now = Date.now();
        const elapsed = (now - this.lastTime) / 1000;
        if (elapsed >= 0.2) {
            const currentSpeed = Math.max(0, (downloaded - this.lastBytes) / elapsed);
            this.smoothSpeed = this.smoothSpeed === 0
                ? currentSpeed
                : (this.alpha * currentSpeed + (1 - this.alpha) * this.smoothSpeed);
            this.lastTime = now;
            this.lastBytes = downloaded;
            this.render();
        }
    }
    renderMessage(msg) {
        if (this.isTTY) {
            process.stdout.write(`\r\x1b[2K⚠️ ${msg}\n`);
        }
        else {
            console.log(`⚠️ ${msg}`);
        }
    }
    render() {
        const percent = this.totalBytes > 0
            ? Math.min(100, (this.downloadedBytes / this.totalBytes) * 100)
            : 0;
        const remainingBytes = Math.max(0, this.totalBytes - this.downloadedBytes);
        const etaSec = this.smoothSpeed > 0 ? remainingBytes / this.smoothSpeed : 0;
        if (this.isTTY) {
            const barWidth = 26;
            const filledWidth = Math.round((percent / 100) * barWidth);
            const emptyWidth = Math.max(0, barWidth - filledWidth);
            const bar = `\x1b[32m${"█".repeat(filledWidth)}\x1b[90m${"░".repeat(emptyWidth)}\x1b[0m`;
            const line = `\r\x1b[2K${this.title} [${this.activeMirror}] ` +
                `[${bar}] \x1b[1m${percent.toFixed(1)}%\x1b[0m | ` +
                `${formatBytes(this.downloadedBytes)} / ${formatBytes(this.totalBytes)} | ` +
                `\x1b[36m${formatBytes(this.smoothSpeed)}/s\x1b[0m | ` +
                `ETA: \x1b[33m${formatEta(etaSec)}\x1b[0m`;
            process.stdout.write(line);
        }
        else {
            const now = Date.now();
            if (now - this.lastLogTime > 5000) {
                this.lastLogTime = now;
                console.log(`${this.title}: ${percent.toFixed(1)}% (${formatBytes(this.downloadedBytes)} / ${formatBytes(this.totalBytes)}) @ ${formatBytes(this.smoothSpeed)}/s ETA: ${formatEta(etaSec)}`);
            }
        }
    }
    stop() {
        if (this.isTTY) {
            process.stdout.write("\r\x1b[2K\n");
        }
    }
}
