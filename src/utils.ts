// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = () => {};

export class RingMap<TValue> {
	private readonly _lookupStore = new Map<string, TValue>();
	private readonly _keyStore: string[];
	private _currentIndex = 0;

	constructor(private readonly size = 100) {
		this._keyStore = Array.from({length: size});
	}

	set(element: string, value: TValue) {
		const currentResident = this._keyStore[this._currentIndex];
		if (currentResident !== undefined) {
			this._lookupStore.delete(currentResident);
		}

		this._lookupStore.set(element, value);
		this._keyStore[this._currentIndex] = element;
		this._currentIndex = (this._currentIndex + 1) % this.size;
	}

	has(element: string) {
		return this._lookupStore.has(element);
	}

	get(element: string) {
		return this._lookupStore.get(element);
	}
}
