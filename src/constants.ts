/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
// We need to explicitly const assert these since typescript sometimes treats them as a string.
// The specific example was `MAGIC_LINK_SERVER_TO_SEND_EMAIL` when used in MagicLinkStrategy#prepare

export const MAGIC_LINK_REQUESTING_EMAIL = 'magic_link_request_send' as const;
export const MAGIC_LINK_SERVER_TO_SEND_EMAIL = 'magic_link_send_email' as const;
export const BACKUP_CODE_PENDING_TO_ACTIVE_PROOF = 'acknowledged' as const;
