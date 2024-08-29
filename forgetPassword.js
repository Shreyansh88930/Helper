// Import necessary Firebase modules
import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// Initialize Firebase Authentication
const auth = getAuth();

// Function to send a password reset email
function resetPassword(email) {
  sendPasswordResetEmail(auth, email)
    .then(() => {
      console.log("Password reset email sent!");
      alert("Password reset email has been sent. Please check your inbox.");
      // You can add additional actions here, like redirecting to a different page
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error(`Error [${errorCode}]: ${errorMessage}`);
      alert(`Failed to send password reset email: ${errorMessage}`);
      // Handle errors here
    });
}

// Example usage:
// You can call the function when the user submits the reset password form
document.getElementById("resetPasswordForm").addEventListener("submit", function (e) {
  e.preventDefault(); // Prevent the form from submitting normally
  const email = document.getElementById("email").value;
  resetPassword(email);
});

$("btn-resetPassword").click(function()
{
    var auth = firebase.auth();
    var email= $("email").val();

    if(email != "")
    {
        auth.sendPasswordResetEmail(email).then(function()
        {
            window.alert("Email has been sent to you, Please check and verify.");
        })
        .catch(function(error)
        {
            var errorCode=error.code;
            var errorMessage= error.message;

            console.log(errorCode);
            console.log(errorMessage);

            window.alert("Message:" + errorMessage);
        });
    }
    else{
        window.alert("Please write your email first.");
    }
});
