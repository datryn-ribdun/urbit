export const clearPushNotifications = (to?: string) => {
  if (to && false) {
    // TODO: break this out into a util
    fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        host: 'exp.host',
        'accept': 'application/json',
        'accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ to, title: '', body: '', 'content-available': 1, data: { clearNotifications: true } })
    });
  }
};
