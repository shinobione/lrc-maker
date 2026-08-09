export interface TimestampLyricLine {
    readonly text: string;
    readonly time?: number;
}

export interface TimestampSelectionState {
    readonly lyric: readonly TimestampLyricLine[];
    readonly currentTime: number;
    readonly nextTime: number;
    readonly selectIndex: number;
}

export const guard = (value: number, min: number, max: number): number => {
    if (value < min) {
        return min;
    }
    if (value > max) {
        return max;
    }
    return value;
};

export const timestampSelectedLine = <T extends TimestampSelectionState>(state: T, time: number): T => {
    const index = state.selectIndex;

    let lyric = state.lyric;
    if (lyric[index].time !== time) {
        const newLyric = lyric.slice();
        newLyric[index] = { text: lyric[index].text, time };
        lyric = newLyric;
    }

    return { ...state, lyric, currentTime: time, nextTime: -Infinity } as T;
};

export const timestampSelectedLineAndAdvance = <T extends TimestampSelectionState>(state: T, time: number): T => {
    const selectIndex = guard(state.selectIndex + 1, 0, state.lyric.length - 1);
    return { ...timestampSelectedLine(state, time), selectIndex } as T;
};
