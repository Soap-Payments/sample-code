This app shows how to create checkouts and handle webhooks.

Your client calls your backend which calls the Soap API to create a checkout and you return the `url` field to the client which does a redirect (or opens a Webview in mobile)

For webhook implementation, see webhooks.js.

To get your API key and webhooks signing secret go to your Soap Dashboard and click the "Developers" tab.

Check out .env.example for the environment variables you need to set.