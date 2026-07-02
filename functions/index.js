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
    // Format to local HH:MM (e.g. '08:30')
    // Note: Cloud Functions run in UTC by default. Adjust to your local timezone (e.g. Asia/Kolkata +5:30)
    const localTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)); 
    const currentHour = String(localTime.getHours()).padStart(2, '0');
    const currentMin = String(localTime.getMinutes()).padStart(2, '0');
    const timeString24 = `${currentHour}:${currentMin}`;
    const todayStr = localTime.toISOString().split('T')[0];

    console.log(`[Scheduler] Checking reminders scheduled at: ${timeString24} UTC+5:30`);

    try {
      // 1. Query Firestore for active reminders scheduled for this minute
      // Schema model: reminders/{reminderId} -> { userId, title, body, time24, type, active }
      const remindersSnapshot = await db.collection('reminders')
        .where('time24', '==', timeString24)
        .where('active', '==', true)
        .get();

      if (remindersSnapshot.empty) {
        console.log('[Scheduler] No reminders due at this minute.');
        return null;
      }

      console.log(`[Scheduler] Found ${remindersSnapshot.size} due reminders.`);

      // 2. Process each due reminder in parallel
      const sendPromises = remindersSnapshot.docs.map(async (reminderDoc) => {
        const reminder = reminderDoc.data();
        const { userId, title, body, type, url } = reminder;

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
          console.warn(`[Scheduler] No registered FCM token found for user ${userId}.`);
          return;
        }

        // 3. Assemble and Send the FCM Push Notification payload
        const message = {
          token: fcmToken,
          notification: {
            title: title || 'MediVault Health Alert',
            body: body || 'Time for your scheduled health check!'
          },
          data: {
            url: url || '/dashboard',
            type: type || 'general',
            click_action: 'FLUTTER_NOTIFICATION_CLICK' // standard fallback
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
          // If the token is invalid (unregistered), optionally remove it to save database reads
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
