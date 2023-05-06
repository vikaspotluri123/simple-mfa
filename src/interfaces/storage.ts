
export interface SerializedAuthStrategy<TTypes extends string, TContext = any> {
	id: string;
	name: string;
	user_id: string;
	type: TTypes;
	status: 'pending' | 'active' | 'disabled';
	priority: number | null; // eslint-disable-line @typescript-eslint/ban-types
	context: TContext;
}
