# Google Drive backups

The planner supports manual Save to Drive and Load from Drive using the same compact JSON as downloaded backups. Google controls access to a private `appDataFolder`; the planner does not request access to other Drive files. The backup is hidden from the normal Drive file browser. Download backup remains available independently.

## Configure Google

1. Create or select a project in Google Cloud Console and enable the **Google Drive API**.
2. Configure **Google Auth Platform** branding, audience, and contact details. For initial testing, keep the audience in testing and add the Google accounts you will use as test users.
3. Add the scope `https://www.googleapis.com/auth/drive.appdata` under Data Access. No email, profile, or full Drive scope is needed.
4. Create an OAuth client of type **Web application**. Add authorized JavaScript origins:
   - `http://localhost:5173` (or your actual local Vite port)
   - `https://watchfuls.github.io`
   Origins contain no repository path. This uses Google's popup token flow, so there is no application redirect callback route.
5. Copy the **client ID**, ending in `.apps.googleusercontent.com`. Do not copy or publish a client secret.

## Local development

Create `.env.local` (ignored by Git) with:

```dotenv
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

Restart Vite. Open **Saves & backups** to find the Google Drive controls. Without a configured client ID, those controls stay hidden.

## GitHub Pages

Set the GitHub Actions repository variable **VITE_GOOGLE_CLIENT_ID** to the same public client ID. The Pages workflow passes it to the Vite build. Rebuild/deploy after changing it; Vite substitutes the value at build time.

Before offering the feature generally, finish the Google consent app's required configuration and publish its audience as appropriate. Test real authorization, denied permission, popup closure, saving from one device and loading on another, and switching Google accounts. Automated tests use mocked Google responses and cannot verify this setup.

## Behavior

- Connecting never uploads or loads a save automatically.
- Save creates `imaginarium-planner.json` or updates the newest matching backup. Replacing an existing cloud backup requires confirmation showing its last modification time.
- Load validates the file before asking to replace local settings. Unavailable seasons use the existing historical-plan handling.
- Transfers are manual, with no merge or simultaneous-edit guarantee. The last successful confirmed save wins. Load the cloud backup before editing on another device.
- Access tokens live only in component memory, not local storage, backup files, or URLs. After expiry or a page reload, reconnect. Disconnect forgets the local token; it does not delete the cloud backup or revoke the grant. Google Account permissions can revoke access.
- Keep using the same Google Cloud project/client setup across deployments to retain access to the app's existing private storage.

References: [Google's browser token flow](https://developers.google.com/identity/oauth2/web/guides/use-token-model), [Drive application data](https://developers.google.com/workspace/drive/api/guides/appdata).
