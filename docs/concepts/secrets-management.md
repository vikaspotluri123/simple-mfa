---
layout: default
title: Secrets Management
nav_order: 0
parent: Concepts
---

# Secrets Management

SimpleMfa depends on secrets to securely store strategy-specific data. It's up to you to ensure these secrets are stored
in a secure manner.

The SimpleMfa singleton can create/migrate/update secrets based on the requirements of each strategy. This is done
via `SimpleMfa#syncSecrets`.

 - If no changes were made relative to the current state, it will return `null`.
 - Otherwise, it will return a <abbr title="Plain Old Javascript Object">POJO</abbr> with all the secrets that can be
   sent to your secrets store for persistence.
 - You should not be calling `SimpleMfa#syncSecrets` multiple times - this operation is idempotent, so subsequent calls
   will be a noop, resulting in a `null` response
