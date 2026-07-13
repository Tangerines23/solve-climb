import { google } from 'googleapis';
import { execSync } from 'child_process';

// 1. Get current local Git commit count (will be used as the new versionCode)
function getGitVersionCode() {
  try {
    const output = execSync('git rev-list --count HEAD', { encoding: 'utf8' });
    const count = parseInt(output.trim(), 10);
    if (isNaN(count)) throw new Error('Parsed git count is NaN');
    return count;
  } catch (error) {
    console.warn('⚠️ Failed to get Git commit count. Falling back to default (10).', error.message);
    return 10;
  }
}

// 2. Fetch playstore release track version code using Google Play Developer API
async function verifyVersionCode() {
  // Service account credential check
  const playStoreKey = process.env.PLAY_STORE_JSON_KEY;
  if (!playStoreKey) {
    console.log('ℹ️ PLAY_STORE_JSON_KEY environment variable is not defined. Skipping remote Play Store version verification.');
    process.exit(0);
  }

  let credentials;
  try {
    credentials = JSON.parse(playStoreKey);
  } catch (_err) {
    console.error('❌ PLAY_STORE_JSON_KEY is not a valid JSON string.');
    process.exit(1);
  }

  const packageName = 'com.solveclimb.app';
  const localVersionCode = getGitVersionCode();
  console.log(`🤖 Local Version Code (from Git Commits): ${localVersionCode}`);

  try {
    // Authenticate with Google Play API
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    });

    const play = google.androidpublisher({
      version: 'v3',
      auth,
    });

    // Start a new edit session
    console.log('🔗 Connecting to Google Play Console API...');
    const editSession = await play.edits.insert({
      packageName,
    });
    const editId = editSession.data.id;

    // Get all releases on alpha/internal tracks
    const tracksList = ['internal', 'alpha'];
    let maxRemoteVersionCode = 0;

    for (const trackName of tracksList) {
      try {
        const trackInfo = await play.edits.tracks.get({
          editId,
          packageName,
          track: trackName,
        });

        if (trackInfo.data.releases) {
          for (const release of trackInfo.data.releases) {
            if (release.versionCodes) {
              for (const code of release.versionCodes) {
                const parsedCode = parseInt(code, 10);
                if (parsedCode > maxRemoteVersionCode) {
                  maxRemoteVersionCode = parsedCode;
                }
              }
            }
          }
        }
      } catch (trackError) {
        console.warn(`⚠️ Warning: Could not fetch track info for "${trackName}":`, trackError.message);
      }
    }

    console.log(`📡 Play Store Current Max Version Code: ${maxRemoteVersionCode}`);

    if (localVersionCode <= maxRemoteVersionCode) {
      console.error(`\n❌ [Validation Failed] Version Code Conflict!`);
      console.error(`Local Version Code (${localVersionCode}) must be higher than current Play Store Version Code (${maxRemoteVersionCode}).`);
      console.error(`Please make a new commit to increment the local Version Code.\n`);
      process.exit(1);
    } else {
      console.log(`✅ [Validation Passed] Local Version Code (${localVersionCode}) is valid for Play Store release.`);
    }

    // Clean up the edit session
    await play.edits.delete({
      editId,
      packageName,
    });

  } catch (apiError) {
    console.error('❌ Failed to verify version code with Google Play Developer API:', apiError.message);
    // Do not fail the build if the API key has insufficient permissions but logs it
    if (apiError.message.includes('permission') || apiError.message.includes('auth')) {
      console.warn('⚠️ Warning: Authorization or permission error occurred. Bypassing check block.');
      process.exit(0);
    }
    process.exit(1);
  }
}

verifyVersionCode();
