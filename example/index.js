// @ts-check
/*
 Welcome to the demo application!
 This is not a production-grade application, but one that's designed to show you
 how to integrate SimpleMfa into your own application.

 Refer to the README for launch instructions.

 The first part of SimpleMfa is creating an instance and syncing secrets.
   ./0-instance.js shows how you can create an instance
	 ./1-secrets-sync.js shows how secrets syncing works as well as a common pitfall.
*/
const {simpleMfa, strategies} = await import('./0-instance.js');
const {demoSecretsSync} = await import('./1-secrets-sync.js');
demoSecretsSync(simpleMfa);

/*
 The next step is to seed strategies for the example users.
 In a production context, the user would normally creating their strategies based on their requirements.
  ./2-deo-second-factors.js has a lot of fluff; you'll want to focus on how a factor is created.
*/
const {createDemoStrategies} = await import('./2-demo-second-factors.js');
const userStrategies = await createDemoStrategies(strategies);

/*
 For demonstration purposes, the app is created next.
  ./3-app.js shows a very simple application set up with express-session.
	./4-simple-mfa-controllers.js show how you can use SimpleMfa for factor activation, listing, verification, etc.
	./5-routing.js contains an application revolving around a simple authentication flow
*/
const {app} = await import('./3-app.js');
const {
	createBrowseController, createReadController, createActivateController, createValidateController,
} = await import('./4-simple-mfa-controllers.js');
const {addRoutesTo} = await import('./5-routing.js');
addRoutesTo(app, {
	browse: createBrowseController(userStrategies),
	read: createReadController(userStrategies),
	validate: createValidateController(userStrategies),
	activate: createActivateController(userStrategies),
});

const {server} = await import('./6-serve.js');
server;
