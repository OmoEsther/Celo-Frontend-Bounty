// This component is used to display information about the room reservation Fee

// Importing the dependencies
import { ethers, constants } from "ethers";
// Import the useContractCall hook to read how many rooms are in the marketplace via the contract
import { useContractCall } from "@/hooks/contract/useContractRead";
import { BellIcon } from "@heroicons/react/24/solid";

const NoticeBoard = () => {
  // Use the useContractCall hook to read the reservationfee in the marketplace contract
  const { data: reservationFee }: any = useContractCall(
    "getReservationFee",
    [],
    true
  );

  // Format the price of the room from wei to cEUR otherwise the price will be way too high
  const reservationPriceFromWei = ethers.utils.formatEther(
    reservationFee
      ? reservationFee.toString()
      : constants.WeiPerEther.toString()
  );

  return (
    <div className="flex gap-3 content-center m-auto p-6">
      <BellIcon className="h-6 w-6 text-black-500" />
      <span>
        Reservation FEE (*R Fee) is set at {reservationPriceFromWei} cEUR and is
        refunded after reservation ends
      </span>
    </div>
  );
};

export default NoticeBoard;
