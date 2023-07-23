export function cleanProof<TProofType = unknown>(proof: TProofType): TProofType {
	if (typeof proof !== 'string') {
		return proof;
	}

	return proof.trim().replace(/-/g, '') as TProofType;
}
