// scripts.js

// Example JavaScript code for future enhancements

document.addEventListener('DOMContentLoaded', function () {
    // Code to execute when the DOM is fully loaded
    console.log('Document loaded and ready');
});

// Example for handling toggle button click
const sidebarToggle = document.getElementById('sidebarToggle');
if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function () {
        document.getElementById('wrapper').classList.toggle('toggled');
    });
}
