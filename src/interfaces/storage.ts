
export interface SerializedAuthStrategy<TTypes extends string, TContext = any> {
	id: string;
	name: string;
	user_id: string;
	type: TTypes;
	status: 'pending' | 'active' | 'disabled';
	context: TContext;
}
