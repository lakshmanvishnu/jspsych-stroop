// notification-manager.js
// Manages push notifications for the jsPsych app

export class NotificationManager {
    constructor() {
        this.isReady = false;
        this.notifications = [];
        this.init();
    }

    init() {
        document.addEventListener('deviceready', () => {
            this.isReady = true;
            this.setupNotifications();
        }, false);
    }

    setupNotifications() {
        if (!window.cordova || !window.cordova.plugins || !window.cordova.plugins.notification) {
            console.warn('Local notifications plugin not available');
            return;
        }

        // Request permission for notifications
        cordova.plugins.notification.local.hasPermission((granted) => {
            if (!granted) {
                cordova.plugins.notification.local.requestPermission((granted) => {
                    if (granted) {
                        console.log('Notification permission granted');
                    }
                });
            }
        });

        // Handle notification clicks
        cordova.plugins.notification.local.on('click', (notification) => {
            console.log('Notification clicked:', notification);
            this.handleNotificationClick(notification);
        });
    }

    // Schedule a single notification
    scheduleNotification(options) {
        if (!this.isReady || !window.cordova.plugins.notification) {
            console.warn('Notifications not ready');
            return;
        }

        const notification = {
            id: options.id || Date.now(),
            title: options.title || 'jsPsych Experiment Reminder',
            text: options.text || 'Time to complete your experiment!',
            icon: 'res://icon',
            smallIcon: 'res://icon',
            ...options
        };

        cordova.plugins.notification.local.schedule(notification);
        this.notifications.push(notification);
        console.log('Scheduled notification:', notification);
    }

    // Schedule recurring notifications at regular intervals
    scheduleRecurringNotifications(options) {
        if (!this.isReady || !window.cordova.plugins.notification) {
            console.warn('Notifications not ready');
            return;
        }

        const {
            title = 'jsPsych Experiment Reminder',
            text = 'Time to complete your daily experiment!',
            interval = 'daily', // 'daily', 'weekly', 'monthly', or number of minutes
            startTime = new Date(Date.now() + 60000), // Default: 1 minute from now
            count = 0 // 0 = infinite
        } = options;

        // Convert interval to trigger object
        let trigger;
        if (typeof interval === 'number') {
            // Interval in minutes
            trigger = {
                every: {
                    minute: interval
                }
            };
        } else {
            switch (interval) {
                case 'daily':
                    trigger = {
                        every: {
                            hour: startTime.getHours(),
                            minute: startTime.getMinutes()
                        }
                    };
                    break;
                case 'weekly':
                    trigger = {
                        every: {
                            weekday: startTime.getDay(),
                            hour: startTime.getHours(),
                            minute: startTime.getMinutes()
                        }
                    };
                    break;
                case 'monthly':
                    trigger = {
                        every: {
                            day: startTime.getDate(),
                            hour: startTime.getHours(),
                            minute: startTime.getMinutes()
                        }
                    };
                    break;
                default:
                    trigger = { at: startTime };
            }
        }

        const notification = {
            id: Date.now(),
            title: title,
            text: text,
            trigger: trigger,
            icon: 'res://icon',
            smallIcon: 'res://icon',
            foreground: true,
            vibrate: true,
            data: { 
                type: 'experiment_reminder',
                userId: this.getUserId() 
            }
        };

        if (count > 0) {
            notification.count = count;
        }

        cordova.plugins.notification.local.schedule(notification);
        this.notifications.push(notification);
        console.log('Scheduled recurring notification:', notification);
        
        return notification.id;
    }

    // Schedule multiple notifications at specific times
    scheduleMultipleNotifications(schedules) {
        if (!this.isReady || !window.cordova.plugins.notification) {
            console.warn('Notifications not ready');
            return;
        }

        const notifications = schedules.map((schedule, index) => ({
            id: Date.now() + index,
            title: schedule.title || 'jsPsych Experiment',
            text: schedule.text || 'Time for your experiment!',
            trigger: { at: new Date(schedule.time) },
            icon: 'res://icon',
            smallIcon: 'res://icon',
            foreground: true,
            vibrate: true,
            data: { 
                type: 'experiment_reminder',
                experimentId: schedule.experimentId,
                userId: this.getUserId()
            }
        }));

        cordova.plugins.notification.local.schedule(notifications);
        this.notifications.push(...notifications);
        console.log('Scheduled multiple notifications:', notifications);
    }

    // Cancel a specific notification
    cancelNotification(id) {
        if (!this.isReady || !window.cordova.plugins.notification) {
            return;
        }

        cordova.plugins.notification.local.cancel(id);
        this.notifications = this.notifications.filter(n => n.id !== id);
        console.log('Cancelled notification:', id);
    }

    // Cancel all notifications
    cancelAllNotifications() {
        if (!this.isReady || !window.cordova.plugins.notification) {
            return;
        }

        cordova.plugins.notification.local.cancelAll();
        this.notifications = [];
        console.log('Cancelled all notifications');
    }

    // Get all scheduled notifications
    getScheduledNotifications() {
        return new Promise((resolve) => {
            if (!this.isReady || !window.cordova.plugins.notification) {
                resolve([]);
                return;
            }

            cordova.plugins.notification.local.getScheduled((notifications) => {
                resolve(notifications);
            });
        });
    }

    // Handle notification click
    handleNotificationClick(notification) {
        console.log('Handling notification click:', notification);
        
        // You can navigate to a specific experiment or screen here
        if (notification.data && notification.data.experimentId) {
            // Navigate to specific experiment
            window.location.hash = `#experiment/${notification.data.experimentId}`;
        } else {
            // Just open the app
            console.log('App opened from notification');
        }
    }

    // Get user ID from localStorage
    getUserId() {
        try {
            return localStorage.getItem('userId') || 'unknown';
        } catch (e) {
            return 'unknown';
        }
    }

    // Example: Set up daily reminders
    setupDailyReminders(times = ['09:00', '14:00', '19:00']) {
        const today = new Date();
        
        times.forEach((time, index) => {
            const [hours, minutes] = time.split(':').map(Number);
            const notificationTime = new Date(today);
            notificationTime.setHours(hours, minutes, 0, 0);
            
            // If time has passed today, schedule for tomorrow
            if (notificationTime <= new Date()) {
                notificationTime.setDate(notificationTime.getDate() + 1);
            }

            this.scheduleRecurringNotifications({
                title: 'Time for your jsPsych experiment!',
                text: `Complete your ${this.getTimeOfDay(hours)} session`,
                interval: 'daily',
                startTime: notificationTime
            });
        });
    }

    getTimeOfDay(hour) {
        if (hour < 12) return 'morning';
        if (hour < 17) return 'afternoon';
        return 'evening';
    }

    // Example: Set up experience sampling (random notifications)
    setupExperienceSampling(options = {}) {
        const {
            startHour = 9,
            endHour = 21,
            minInterval = 90, // minutes
            maxInterval = 180, // minutes
            dailyCount = 6
        } = options;

        const scheduleNextNotification = () => {
            const now = new Date();
            const currentHour = now.getHours();
            
            // Only schedule during active hours
            if (currentHour >= startHour && currentHour < endHour) {
                const randomDelay = Math.floor(
                    Math.random() * (maxInterval - minInterval) + minInterval
                ) * 60000; // Convert to milliseconds
                
                const nextTime = new Date(now.getTime() + randomDelay);
                
                // Make sure it's still within active hours
                if (nextTime.getHours() < endHour) {
                    this.scheduleNotification({
                        title: 'Quick Survey',
                        text: 'Please complete a brief experience sampling survey',
                        trigger: { at: nextTime },
                        data: { type: 'experience_sampling' }
                    });
                    
                    // Schedule the next one
                    setTimeout(scheduleNextNotification, randomDelay);
                }
            }
            
            // Schedule for next day if outside active hours
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(startHour, 0, 0, 0);
            const msUntilTomorrow = tomorrow.getTime() - now.getTime();
            setTimeout(scheduleNextNotification, msUntilTomorrow);
        };

        // Start the scheduling
        scheduleNextNotification();
    }
}

// Export a singleton instance
export const notificationManager = new NotificationManager();