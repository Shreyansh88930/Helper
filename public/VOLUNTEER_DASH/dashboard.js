let map;
let userMarker;

function initMap() {
    // Initialize the map
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -34.397, lng: 150.644 }, // Default location
        zoom: 8
    });

    // Attempt to get the user's current location
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            function(position) {
                const userLatLng = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                // Update the map's center and the user's marker
                map.setCenter(userLatLng);

                if (userMarker) {
                    userMarker.setPosition(userLatLng);
                } else {
                    userMarker = new google.maps.Marker({
                        position: userLatLng,
                        map: map,
                        title: "You are here"
                    });
                }
            },
            function() {
                handleLocationError(true, map.getCenter());
            }
        );
    } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, map.getCenter());
    }
}

// Listen for authentication state changes
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Display user details
        await displayUserDetails(user);
        // Load additional data (e.g., help requests) if necessary
    } else {
        // Redirect to login if user is not authenticated
        window.location.href = 'login.html';
    }
});
