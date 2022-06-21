export function floorNearest(num: number, nearest: number): number {
    return Math.floor(num / nearest) * nearest
}

export function roundNearest(num: number, nearest: number): number {
    return Math.round(num / nearest) * nearest
}