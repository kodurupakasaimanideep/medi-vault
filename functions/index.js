const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

/**
 * ── Scheduled Reminder Checker Cloud Function ──
 * 
 * Frequency: Runs every minute
 * Behavior: 
 *   1. Computes the current time in HH:MM format
 *   2. Queries the 'reminders' collection in Firestore for active alarms matching this time
 *   3. Fetches the user's registration FCM token from 'userData/{uid}'
 *   4. Sends a highly-interactive background FCM push notification via firebase-admin
 */
exports.checkAndSendReminders = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    const now = new Date();
    // Default local time calculation (UTC+5:30 IST default)
    const defaultLocalTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)); 
    const currentHour = String(defaultLocalTime.getHours()).padStart(2, '0');
    const currentMin = String(defaultLocalTime.getMinutes()).padStart(2, '0');
    const timeString24 = `${currentHour}:${currentMin}`;
    const todayStr = defaultLocalTime.toISOString().split('T')[0];

    console.log(`[Scheduler] Checking reminders scheduled at: ${timeString24} (UTC: ${now.toISOString()})`);

    try {
      // 1. Query Firestore for active reminders matching this minute
      const remindersSnapshot = await db.collection('reminders')
        .where('active', '==', true)
        .where('time24', '==', timeString24)
        .get();

      if (remindersSnapshot.empty) {
        console.log(`[Scheduler] No active reminders found for time ${timeString24}.`);
        return null;
      }

      console.log(`[Scheduler] Found ${remindersSnapshot.size} due reminders.`);

      // 2. Process each due reminder in parallel
      const sendPromises = remindersSnapshot.docs.map(async (reminderDoc) => {
        const reminder = reminderDoc.data();
        const { userId, title, body, type, url, platform } = reminder;

        console.log(`[Scheduler] Processing reminder ${reminderDoc.id} for user ${userId} (type: ${type})`);

        // Fetch user's registered FCM token from userData/{userId}
        const userRef = db.collection('userData').doc(userId);
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
          console.warn(`[Scheduler] User document 'userData/${userId}' not found.`);
          return;
        }

        const userData = userSnap.data();
        const fcmToken = userData.fcmToken;

        if (!fcmToken) {
          console.warn(`[Scheduler] No registered FCM token found for user ${userId}. Reminders on native devices are handled by local hardware alarms.`);
          return;
        }

        const isWater = type === 'water';
        const notifTitle = title || (isWater ? '💧 Hydration Reminder — MediVault' : '💊 Medicine Reminder — MediVault');
        const notifBody = body || (isWater ? `It's time to drink water! Keep your body hydrated. 🌊` : 'Time for your scheduled medicine dose!');
        const targetUrl = url || (isWater ? '/drinking-water' : '/tablet-alarm');

        // 3. Assemble and Send the FCM Push Notification payload with high-priority webpush configuration
        const message = {
          token: fcmToken,
          notification: {
            title: notifTitle,
            body: notifBody
          },
          data: {
            url: targetUrl,
            type: type || 'water',
            click_action: 'FLUTTER_NOTIFICATION_CLICK'
          },
          webpush: {
            headers: {
              Urgency: 'high'
            },
            notification: {
              title: notifTitle,
              body: notifBody,
              icon: '/favicon.svg',
              badge: '/favicon.svg',
              requireInteraction: true,
              vibrate: isWater ? [400, 200, 400] : [500, 250, 500, 250, 800],
              tag: `medivault-${type || 'remind'}-${todayStr}_${timeString24}`,
              actions: isWater ? [
                { action: 'logged', title: '✓ Log 250ml' },
                { action: 'open', title: '💧 Open App' },
                { action: 'dismiss', title: 'Dismiss' }
              ] : [
                { action: 'taken', title: '✓ Taken' },
                { action: 'open', title: 'Open App' },
                { action: 'dismiss', title: 'Dismiss' }
              ]
            },
            fcm_options: {
              link: targetUrl
            }
          },
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              clickAction: 'FLUTTER_NOTIFICATION_CLICK'
            }
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1
              }
            }
          }
        };

        try {
          const response = await admin.messaging().send(message);
          console.log(`[Scheduler] Push notification sent successfully to ${userId}. FCM ID: ${response}`);
        } catch (sendError) {
          console.error(`[Scheduler] Error sending FCM push to ${userId}:`, sendError);
          // If the token is invalid (unregistered), remove it
          if (sendError.code === 'messaging/registration-token-not-registered') {
            console.log(`[Scheduler] Removing expired token for user ${userId}`);
            await userRef.update({
              fcmToken: admin.firestore.FieldValue.delete()
            });
          }
        }
      });

      await Promise.all(sendPromises);
      console.log('[Scheduler] Successfully completed scheduled execution.');
    } catch (queryError) {
      console.error('[Scheduler] Error executing scheduled query: ', queryError);
    }

    return null;
  });
