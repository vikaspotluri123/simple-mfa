
export interface SerializedAuthStrategy<TTypes extends string, TContext = any> {
	id: string;
	owner_id: string;
	type: TTypes;
	status: 'pending' | 'active' | 'disabled';
	context: TContext;
}
