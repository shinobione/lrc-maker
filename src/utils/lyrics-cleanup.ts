const bracketTagPattern = /\[([^\r\n]*?)\]/g;
const lrcTimestampPattern = /^\d{1,3}:\d{2}(?:[.:]\d{1,3})?$/;

export interface LyricsCleanupResult {
    value: string;
    removed: number;
}

export const removeEmptyLyricLines = (text: string): LyricsCleanupResult => {
    const lines = text.split(/\r?\n/);
    const cleaned = lines.filter((line) => line.trim().length > 0);
    return {
        value: cleaned.join("\n"),
        removed: lines.length - cleaned.length,
    };
};

export const removeNonTimestampBracketTags = (text: string): LyricsCleanupResult => {
    const lines = text.split(/\r?\n/);
    const cleaned: string[] = [];
    let removed = 0;

    for (const line of lines) {
        let lineChanged = false;
        const withoutTags = line.replace(bracketTagPattern, (match, content: string) => {
            if (lrcTimestampPattern.test(content.trim())) {
                return match;
            }

            lineChanged = true;
            removed += 1;
            return "";
        });

        if (!lineChanged) {
            cleaned.push(line);
            continue;
        }

        const normalized = withoutTags.replace(/[ \t]{2,}/g, " ").trim();
        if (normalized.length > 0) {
            cleaned.push(normalized);
        }
    }

    return { value: cleaned.join("\n"), removed };
};
