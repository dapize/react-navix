const isPlainObject = (value: object): boolean => {
	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
};

const deepEqualInner = (first: unknown, second: unknown, seen: WeakMap<object, WeakSet<object>>): boolean => {
	if (Object.is(first, second)) return true;

	if (first === null || second === null) return false;

	if (typeof first !== "object" || typeof second !== "object") return false;

	const firstObject = first as object;
	const secondObject = second as object;

	const seenSecond = seen.get(firstObject);
	if (seenSecond?.has(secondObject)) return true;
	const secondSet = seenSecond ?? new WeakSet<object>();
	secondSet.add(secondObject);
	seen.set(firstObject, secondSet);

	if (first instanceof Date && second instanceof Date) {
		return first.getTime() === second.getTime();
	}

	const firstIsArray = Array.isArray(first);
	const secondIsArray = Array.isArray(second);
	if (firstIsArray !== secondIsArray) return false;

	if (firstIsArray && secondIsArray) {
		const firstArray = first as unknown[];
		const secondArray = second as unknown[];
		if (firstArray.length !== secondArray.length) return false;
		return firstArray.every((item, index) => deepEqualInner(item, secondArray[index], seen));
	}

	if (!isPlainObject(firstObject) || !isPlainObject(secondObject)) return false;

	const firstKeys = Object.keys(firstObject);
	const secondKeys = Object.keys(secondObject);
	if (firstKeys.length !== secondKeys.length) return false;

	return firstKeys.every((key) =>
		deepEqualInner((firstObject as Record<string, unknown>)[key], (secondObject as Record<string, unknown>)[key], seen),
	);
};

export const deepEqual = (first: unknown, second: unknown): boolean => deepEqualInner(first, second, new WeakMap());
