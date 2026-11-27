// Stand-in for an analytics library: sets a cookie like GA does, exposes a global the inline init needs.
document.cookie = "_ga=GA1.1.demo; Path=/";
document.cookie = "_ga_ABC123=GS1.1.demo; Path=/";
window.FakeAnalytics = { init: function (id) { window.analyticsInit = id; } };
window.analyticsLoaded = (window.analyticsLoaded || 0) + 1;
