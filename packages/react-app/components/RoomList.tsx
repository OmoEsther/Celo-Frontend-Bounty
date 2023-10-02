// This component is used to display all the rooms in the marketplace

// Importing the dependencies
import { useState } from "react";
// Import the useContractCall hook to read how many rooms are in the marketplace via the contract
import { useContractCall } from "@/hooks/contract/useContractRead";
// Import the Room and Alert components
import Room from "@/components/Room";
import ErrorAlert from "@/components/alerts/ErrorAlert";
import LoadingAlert from "@/components/alerts/LoadingAlert";
import SuccessAlert from "@/components/alerts/SuccessAlert";
import { useAccount } from "wagmi";

// Define the RoomList component
const RoomList = () => {
  // Use the useContractCall hook to read how many rooms are in the marketplace contract
  const { data } = useContractCall("getRoomsLength", [], true);
  // Convert the data to a number
  const roomLength = data ? Number(data.toString()) : 0;

  // Define the states to store the error, success and loading messages
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState("");

  // Define a function to clear the error, success and loading states
  const clear = () => {
    setError("");
    setSuccess("");
    setLoading("");
  };

  // Define a function to return the rooms
  const getRooms = () => {
    // If there are no rooms, return null
    if (!roomLength) return null;

    // define room components is an empty array
    const roomComponents: JSX.Element[] | null = [];

    for (let i = 0; i < roomLength; i++) {
      roomComponents.push(
        <Room
          key={i}
          id={i}
          setSuccess={setSuccess}
          setError={setError}
          setLoading={setLoading}
          loading={loading}
          clear={clear}

        />
      );
    }
    return roomComponents;
  };

  // Return the JSX for the component
  return (
    <div className="flex-col">
      {/* If there is an alert, display it */}
      {error && <ErrorAlert message={error} clear={clear} />}
      {success && <SuccessAlert message={success} />}
      {loading && <LoadingAlert message={loading} />}
      {/* Display the rooms */}
      <div className="mx-auto my-5 max-w-2xl px-4 sm:px-6 lg:max-w-7xl lg:px-8 ">
        <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
          {/* Loop through the rooms and return the room component */}
          {getRooms()}
        </div>
      </div>
    </div>
  );
};

export default RoomList;
