export const generateKey = (counterRef: { current: number }): string => `${Date.now().toString(36)}${(counterRef.current++).toString(36)}`;
