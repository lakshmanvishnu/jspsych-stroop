// notification-manager.js - Non-module version for iOS compatibility
(function() {
    
    // NotificationManager class
    function NotificationManager() {
        this.isReady = false;
        this.notifications = [];
        this.init();
    }
    
    NotificationManager.prototype.init = function() {
        const self = this;
        document.addEventListener('deviceready', function() {
            self.isReady = true;
            self.setupNotifications();
        }, false);
    };
    
    NotificationManager.prototype.setupNotifications = function() {
        if (!window.cordova || !window.cordova.plugins || !window.cordova.plugins.notification) {
            console.warn('Local notifications plugin not available');
            return;
        }

        // Request permission for notifications
        cordova.plugins.notification.local.hasPermission(function(granted) {
            if (!granted) {
                cordova.plugins.notification.local.requestPermission(function(granted) {
                    if (granted) {
                        console.log('Notification permission granted');
                    }
                });
            }
        });

        // Handle notification clicks
        const self = this;
        cordova.plugins.notification.local.on('click', function(notification) {
            console.log('Notification clicked:', notification);
            self.handleNotificationClick(notification);
        });
    };
    
    // Schedule a single notification
    NotificationManager.prototype.scheduleNotification = function(options) {
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
    };
    
    // Schedule recurring notifications at regular intervals
    NotificationManager.prototype.scheduleRecurringNotifications = function(options) {
        if (!this.isReady || !window.cordova.plugins.notification) {
            console.warn('Notifications not ready');
            return;
        }

        const {
            title = 'jsPsych Experiment Reminder',
            text = 'Time to complete your daily experiment!',
            interval = 'daily',
            startTime = new Date(Date.now() + 60000),
            count = 0
        } = options;

        // Convert interval to trigger object
        let trigger;
        if (typeof interval === 'number') {
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
    };
    
    // Schedule multiple notifications at specific times
    NotificationManager.prototype.scheduleMultipleNotifications = function(schedules) {
        if (!this.isReady || !window.cordova.plugins.notification) {
            console.warn('Notifications not ready');
            return;
        }

        const self = this;
        const notifications = schedules.map(function(schedule, index) {
            return {
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
                    userId: self.getUserId()
                }
            };
        });

        cordova.plugins.notification.local.schedule(notifications);
        this.notifications.push(...notifications);
        console.log('Scheduled multiple notifications:', notifications);
    };
    
    // Cancel a specific notification
    NotificationManager.prototype.cancelNotification = function(id) {
        if (!this.isReady || !window.cordova.plugins.notification) {
            return;
        }

        cordova.plugins.notification.local.cancel(id);
        this.notifications = this.notifications.filter(function(n) { return n.id !== id; });
        console.log('Cancelled notification:', id);
    };
    
    // Cancel all notifications
    NotificationManager.prototype.cancelAllNotifications = function() {
        if (!this.isReady || !window.cordova.plugins.notification) {
            return;
        }

        cordova.plugins.notification.local.cancelAll();
        this.notifications = [];
        console.log('Cancelled all notifications');
    };
    
    // Get all scheduled notifications
    NotificationManager.prototype.getScheduledNotifications = function() {
        return new Promise(function(resolve) {
            if (!this.isReady || !window.cordova.plugins.notification) {
                resolve([]);
                return;
            }

            cordova.plugins.notification.local.getScheduled(function(notifications) {
                resolve(notifications);
            });
        }.bind(this));
    };
    
    // Handle notification click
    NotificationManager.prototype.handleNotificationClick = function(notification) {
        console.log('Handling notification click:', notification);
        
        if (notification.data && notification.data.experimentId) {
            window.location.hash = `#experiment/${notification.data.experimentId}`;
        } else {
            console.log('App opened from notification');
        }
    };
    
    // Get user ID from localStorage
    NotificationManager.prototype.getUserId = function() {
        try {
            return localStorage.getItem('jspsych_userId') || 'unknown';
        } catch (e) {
            return 'unknown';
        }
    };
    
    // Set up daily reminders
    NotificationManager.prototype.setupDailyReminders = function(times) {
        times = times || ['09:00', '14:00', '19:00'];
        const today = new Date();
        const self = this;
        
        times.forEach(function(time, index) {
            const parts = time.split(':').map(Number);
            const hours = parts[0];
            const minutes = parts[1];
            const notificationTime = new Date(today);
            notificationTime.setHours(hours, minutes, 0, 0);
            
            if (notificationTime <= new Date()) {
                notificationTime.setDate(notificationTime.getDate() + 1);
            }

            self.scheduleRecurringNotifications({
                title: 'Time for your jsPsych experiment!',
                text: `Complete your ${self.getTimeOfDay(hours)} session`,
                interval: 'daily',
                startTime: notificationTime
            });
        });
    };
    
    NotificationManager.prototype.getTimeOfDay = function(hour) {
        if (hour < 12) return 'morning';
        if (hour < 17) return 'afternoon';
        return 'evening';
    };
    
    // Set up experience sampling (random notifications)
    NotificationManager.prototype.setupExperienceSampling = function(options) {
        options = options || {};
        const {
            startHour = 9,
            endHour = 21,
            minInterval = 90,
            maxInterval = 180,
            dailyCount = 6
        } = options;

        const self = this;
        const scheduleNextNotification = function() {
            const now = new Date();
            const currentHour = now.getHours();
            
            if (currentHour >= startHour && currentHour < endHour) {
                const randomDelay = Math.floor(
                    Math.random() * (maxInterval - minInterval) + minInterval
                ) * 60000;
                
                const nextTime = new Date(now.getTime() + randomDelay);
                
                if (nextTime.getHours() < endHour) {
                    self.scheduleNotification({
                        title: 'Quick Survey',
                        text: 'Please complete a brief experience sampling survey',
                        trigger: { at: nextTime },
                        data: { type: 'experience_sampling' }
                    });
                    
                    setTimeout(scheduleNextNotification, randomDelay);
                }
            }
            
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(startHour, 0, 0, 0);
            const msUntilTomorrow = tomorrow.getTime() - now.getTime();
            setTimeout(scheduleNextNotification, msUntilTomorrow);
        };

        scheduleNextNotification();
    };
    
    // Create a singleton instance
    window.notificationManager = new NotificationManager();
    
})();