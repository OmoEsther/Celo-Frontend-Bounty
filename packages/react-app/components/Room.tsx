/* eslint-disable @next/next/no-img-element */
// This component displays and enables the purchase of a Room

// Importing the dependencies
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
// Import ethers to format the price of the Room correctly
import { ethers, BigNumber } from "ethers";
// Import the useAccount hook to get the user's address
import { useAccount } from "wagmi";
// Import the useConnectModal hook to trigger the wallet connect modal
import { useConnectModal } from "@rainbow-me/rainbowkit";
// Import the toast library to display notifications
import { toast } from "react-toastify";
// Import our custom identicon template to display the owner of the Room
import { formatTime, identiconTemplate, truncateAddress } from "@/helpers";
// Import our custom hooks to interact with the smart contract
import { useContractCall } from "@/hooks/contract/useContractRead";
import { useContractSend } from "@/hooks/contract/useContractWrite";
import { useContractApprove } from "@/hooks/contract/useApprove";
// Import icons
import { CurrencyEuroIcon, BookmarkIcon, ClockIcon } from "@heroicons/react/24/outline";
// Import helpers
import { Room } from "@/helpers";


// Define the Room component which takes in the id of the room and some functions to display notifications
const Room = ({ id, setError, setLoading, clear }: any) => {
  // Use the useAccount hook to store the user's address
  const { address } = useAccount();
  const [noOfNights, setNoOfNights] = useState(1);
  // Use the useConnectModal hook to trigger the wallet connect modal
  const { openConnectModal } = useConnectModal();
  // Use the useContractCall hook to read the data of the room with the id passed in, from the marketplace contract
  const { data: rawRoom }: any = useContractCall("readRoom", [id], true);
  const {data: reservationFee}: any = useContractCall("getReservationFee", [], true);
  const [room, setRoom] = useState<Room | null>(null);

  // Format the room data that we read from the smart contract
  const getFormatRoom = useCallback(() => {
    // Room Component return null if can not get the room
    if (!rawRoom) return null;

    // Set room that was not deleted
    if (rawRoom[0] != "0x0000000000000000000000000000000000000000") {
      setRoom({
        id: id,
        owner: rawRoom[0],
        name: rawRoom[1],
        image: rawRoom[2],
        description: rawRoom[3],
        location: rawRoom[4],
        pricePerNight: rawRoom[5],
        isReserved: rawRoom[6],
        currentReservedTo: rawRoom[7],
        currentReservedEnds: rawRoom[8]
      });
    }
  }, [rawRoom, id]);

  // Call the getFormatRoom function when the rawRoom state changes
  useEffect(() => {
    getFormatRoom();
  }, [getFormatRoom]);

  // Use the useContractSend hook to make reservation for the room with the id passed in, via the marketplace contract
  const { writeAsync: makeReservation, isSuccess: isSuccessMakeReservation } = useContractSend(
    "makeReservation",
    [Number(id), Number(noOfNights)]
  );

  const { writeAsync: endReservation, isSuccess: isSuccessEndReservation } = useContractSend(
    "endReservation",
    [Number(id)]
  );

  const amount = room?.pricePerNight?.add(BigNumber.from(reservationFee.toString())).toString();

  // Use the useContractApprove hook to approve the spending of the product's price, for the ERC20 cUSD contract
  const { writeAsync: approve } = useContractApprove(
    amount || "0"
  );

  // Define the handlePurchase function which handles the purchase interaction with the smart contract
  const handleReservation = async () => {
    if (!approve || !makeReservation) {
      throw "Failed to make reservation for this room";
    }
    // Approve the spending of the product's price, for the ERC20 cUSD contract
    const approveTx = await approve();
    // Wait for the transaction to be mined, (1) is the number of confirmations we want to wait for
    await approveTx.wait(1);
    setLoading("Purchasing...");
    // Once the transaction is mined, purchase the product via our marketplace contract buyProduct function
    const res = await makeReservation();
    // Wait for the transaction to be mined
    await res.wait();
  };

  // Define the handlePurchase function which handles the purchase interaction with the smart contract
  const handleEndReservation = async () => {
    if (!endReservation) {
      throw "Failed to end reservation this room";
    }
    setLoading("Purchasing...");
    // Once the transaction is mined, purchase the product via our marketplace contract buyProduct function
    const res = await endReservation();
    // Wait for the transaction to be mined
    await res.wait();
  };

  // Define the purchaseProduct function that is called when the user clicks the purchase button
  const reserveRoom = async () => {
    setLoading();
    clear();

    try {
      // If the user is not connected, trigger the wallet connect modal
      if (!address && openConnectModal) {
        openConnectModal();
        return;
      }
      // If the user is connected, call the handlePurchase function and display a notification
      await toast.promise(handleReservation(), {
        pending: "Reserving room...",
        success: "Room reserved successfully",
        error: "Failed to reserve room",
      });

      // If there is an error, display the error message
    } catch (e: any) {
      console.log({ e });
      // setError(e?.reason || e?.message || "Something went wrong. Try again.");
      // Once the purchase is complete, clear the loading state
    } finally {
      setLoading(null);
      clear();
    }
  };

  // Define the purchaseProduct function that is called when the user clicks the purchase button
  const endRoomReservation = async () => {
    setLoading();
    clear();

    try {
      // If the user is not connected, trigger the wallet connect modal
      if (!address && openConnectModal) {
        openConnectModal();
        return;
      }
      // If the user is connected, call the handlePurchase function and display a notification
      await toast.promise(handleEndReservation(), {
        pending: "Ending room reservation...",
        success: "Reservation ended successfully",
        error: "Failed to end reservation",
      });

      // If there is an error, display the error message
    } catch (e: any) {
      console.log({ e });
      // setError(e?.reason || e?.message || "Something went wrong. Try again.");
      // Once the purchase is complete, clear the loading state
    } finally {
      setLoading(null);
      clear();
    }
  };

  // If the room cannot be loaded, return null
  if (!room) return null;    

  // Format the price of the room from wei to cUSD otherwise the price will be way too high
  const roomPriceFromWei = ethers.utils.formatEther(
    room.pricePerNight.toString()
  );
  
  const reservationPriceFromWei = ethers.utils.formatEther(
    reservationFee.toString()
  );
  
  const reservationEnded = () => Date.now() >= new Date(Number(room.currentReservedEnds.toString()) * 1000).getTime();

  const handleActions = (e: any) => {
    e.preventDefault();
    if (room.isReserved && reservationEnded()) {
      if (room.currentReservedTo == address){
        endRoomReservation();
      }
    }else{
      reserveRoom();
    }
  }

  // Return the JSX for the room component
  return (
    <div className={"shadow-lg relative rounded-b-lg"}>
      <div className="group">
        <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-white xl:aspect-w-7 xl:aspect-h-8 ">
          {/* Show the number of rooms sold */}
          <span
            className={
              "absolute z-10 left-0 mt-4 bg-amber-400 text-black p-1 rounded-r-lg px-4"
            }
          >
            {room.isReserved? "RESERVED" : "AVAILABLE"}
          </span>
          {/* Show the room image */}
          <img
            src={room.image}
            alt={"image"}
            className="w-full h-80 rounded-t-md  object-cover object-center "
          />
          {/* Show the address of the room owner as an identicon and link to the address on the Celo Explorer */}
          <Link
            href={`https://explorer.celo.org/alfajores/address/${room.owner}`}
            className={"absolute -mt-7 ml-6 h-16 w-16 rounded-full"}
          >
            {identiconTemplate(room.owner)}
          </Link>
        </div>

        <div className={"m-5"}>
          <div className={"pt-1"}>
            {/* Show the room name */}
            <p className="mt-4 pt-4 text-2xl font-bold">{room.name}</p>
            <div className={"h-24 overflow-y-hidden scrollbar-hide"}>
              {/* Show the room description */}
              <h3 className="mt-4 text-sm text-gray-700">
                {room.description}
              </h3>
            </div>
          </div>

          <div>
            <div className={"flex flex-row justify-between"}>
              {/* Show the room location and price*/}
              <div className={"flex flex-row"}>
                <img src={"/location.svg"} alt="Location" className={"w-6"} />
                <h3 className="pt-1 text-sm text-gray-700">{room.location}</h3>
              </div>
              <div className={"flex flex-row "}>
                <CurrencyEuroIcon className="block h-6 w-6" aria-hidden="true" />
                <h3 className="pt-1 text-sm text-gray-700">{roomPriceFromWei} cEUR</h3>
              </div>
            </div>

             {/* Show Reservation Data */}
            <div className="pt-1 text-sm text-gray-700">
              <span className="mt-4 flex flex-row">
                <BookmarkIcon className="block h-6 w-6" aria-hidden="true" /> Reserved To:&nbsp;{          
                <Link
                  href={`https://explorer.celo.org/alfajores/address/${room.currentReservedTo}`}
                >
                  {room.currentReservedTo == "0x5ea1BB2149129E599Ae6a7C1849Fe044135b04d2"? "Market"  : truncateAddress(room.currentReservedTo)}
                </Link>}
              </span>
              <span className="mt-4 flex flex-row">
                <ClockIcon className="block h-6 w-6" aria-hidden="true" /> Reservation ends:&nbsp;
                {room.isReserved ? ` ${formatTime(Number(room.currentReservedEnds.toString()))}` : "--:--"}
              </span>
            </div>
            <form onSubmit={handleActions}>
                <div
                  className="inline-block align-center text-left transform transition-all sm:align-middle sm:max-w-lg sm:w-full">
                  {/* Input fields for the room */}
                  <div className="px-4 pb-4 sm:p-6 sm:pb-4">
                    { !room.isReserved && <input
                      onChange={(e) => {
                        setNoOfNights(Number(e.target.value));
                      }}
                      required
                      type="number"
                      step="any"
                      className="w-full bg-gray-100 p-2 mt-2 mb-3"
                      placeholder="no of nights"
                      min={1}
                    /> }
                    <button
                      type="submit"
                      disabled={(address == room.owner && reservationEnded()) || !reservationEnded()}
                      className="mt-4 h-14 w-full border-[1px] border-gray-500 text-black p-2 rounded-lg hover:bg-black hover:text-white disabled:bg-gray-300 disabled:text-gray-700 disabled:cursor-not-allowed"
                      >
                      {/* Show the room price in cEUR */}
                      {address !== room.owner
                        ? room.isReserved? room.currentReservedTo == address ? "End Reservation" : "Room Reserved" : `Book Room for ${(Number(roomPriceFromWei) * noOfNights) + Number(reservationPriceFromWei)} cEUR`
                        : "You can't book your room"}
                    </button>
                  </div>
                </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;
