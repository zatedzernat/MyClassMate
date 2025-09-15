import Button from '@mui/material/Button';
import { useState } from "react";

export default function LogoutPopup() {
  const [showPopup, setShowPopup] = useState(false);

  const handleLogout = () => {
    // Replace this with your logout logic
    console.log("Logged out!");
    setShowPopup(false);
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      {/* Logout Button */}
      <Button
        onClick={() => setShowPopup(true)}
        className="px-4 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-600"
      >
        Logout
      </Button>

      {/* Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl shadow-lg text-center w-80">
            <h2 className="text-lg font-semibold mb-4">Confirm Logout</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to log out?</p>

            <div className="flex justify-between">
              <Button
                onClick={() => setShowPopup(false)}
                className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </Button>
              <Button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}