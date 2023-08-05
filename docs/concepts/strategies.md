---
layout: default
title: Strategies
nav_order: 0
parent: Concepts
---

# Strategies

SimpleMfa supports multiple second factor mechanisms, internally named strategies. Each strategy has a unique name/slug,
which is stored in the `type` field of a stored strategy.

SimpleMfa has some built-in strategies, but you can also bring your own. API Docs for these strategies are not available at this time.

 - One Time Password (Authenticator App)
 - Magic Link
 - Recovery Codes

Each built-in strategy can be manually imported from `@potluri/simple-mfa/strategy/{strategy}.js`.

As mentioned in the [integration](../../get-started/integrate) guide, if you want to use the default strategies,
you can call `defaultStrategies()` from `@potluri/simple-mfa/default-strategies.js`.

You can also override a specific default strategy by passing it to the function
(for example, to override default options, or to use your own implementation):

<!-- simple-mfa:lint -->
```javascript
import {MagicLinkStrategy} from '@potluri/simple-mfa/strategy/magic-link.js';
import {defaultStrategies} from '@potluri/simple-mfa/default-strategies.js';

export const strategies = defaultStrategies({
	[MagicLinkStrategy.type]: new MagicLinkStrategy({
		create: () => '', // Implementation omitted for brevity
		validate: () => false, // Implementation omitted for brevity
	});
})
```
