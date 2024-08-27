document.addEventListener('DOMContentLoaded', () => {
    const editProfileForm = document.getElementById('editProfileForm');
    const message = document.getElementById('message');

    // Fetch user data from the server
    fetch('/getUserData')
        .then(response => response.json())
        .then(data => {
            // Pre-fill the form with the user's data
            editProfileForm.firstName.value = data.firstName;
            editProfileForm.lastName.value = data.lastName;
            editProfileForm.email.value = data.email;
            editProfileForm.address.value = data.address;
            editProfileForm.address2.value = data.address2;
            editProfileForm.city.value = data.city;
            editProfileForm.state.value = data.state;
            editProfileForm.zip.value = data.zip;
        })
        .catch(error => console.error('Error fetching user data:', error));

    // Handle form submission
    editProfileForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const updatedData = {
            firstName: editProfileForm.firstName.value,
            lastName: editProfileForm.lastName.value,
            email: editProfileForm.email.value,
            password: editProfileForm.password.value, // Handle password hashing or updates accordingly
            address: editProfileForm.address.value,
            address2: editProfileForm.address2.value,
            city: editProfileForm.city.value,
            state: editProfileForm.state.value,
            zip: editProfileForm.zip.value
        };

        // Send the updated data to the server
        fetch('/updateUserProfile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedData)
        })
        .then(response => response.json())
        .then(result => {
            message.textContent = result.message;
        })
        .catch(error => {
            console.error('Error updating profile:', error);
            message.textContent = 'Error updating profile. Please try again.';
        });
    });
});
