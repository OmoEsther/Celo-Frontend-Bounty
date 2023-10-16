// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

// Interface for the ERC20 token, in our case cEUR
interface IERC20Token {
    // Transfers tokens from one address to another
    function transfer(address, uint256) external returns (bool);

    // ... (other ERC20 functions)
}

contract Marketplace {
    uint256 internal roomsLength = 0;
    address internal cEURTokenAddress = 0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F;
    uint256 public reservationFee = 1 ether;

    struct Room {
        address payable owner;
        string name;
        string image;
        string description;
        string location;
        uint256 pricePerNight;
        bool isReserved;
        address currentReservedTo;
        uint256 currentReservationEnds;
        uint256 currentBookingFee;
    }

    mapping(uint256 => Room) internal rooms;

    function writeroom(
        string memory _name,
        string memory _image,
        string memory _description,
        string memory _location,
        uint256 _pricePerNight
    ) public {
        require(_pricePerNight > 0, "Price must be greater than 0");

        uint256 _reservationEnds = 0;

        rooms[roomsLength] = Room(
            payable(msg.sender),
            _name,
            _image,
            _description,
            _location,
            _pricePerNight,
            false,
            address(0),
            _reservationEnds,
            0
        );

        roomsLength++;
    }

    function readRoom(uint256 _index) public view returns (Room memory) {
        return rooms[_index];
    }

    function makeReservation(uint256 _index, uint256 _noOfNights) public payable {
        require(!rooms[_index].isReserved, "Room is reserved");

        uint256 noOfNightsInSeconds = _noOfNights * 1 minutes;
        uint256 bookingFee = (rooms[_index].pricePerNight * _noOfNights);
        uint256 totalFee = bookingFee + reservationFee;

        require(
            IERC20Token(cEURTokenAddress).transferFrom(msg.sender, address(this), totalFee),
            "Token transfer failed."
        );

        rooms[_index].currentReservationEnds = block.timestamp + noOfNightsInSeconds;
        rooms[_index].currentReservedTo = msg.sender;
        rooms[_index].isReserved = true;
        rooms[_index].currentBookingFee = bookingFee;
    }

    function endReservation(uint256 _index) public {
        require(rooms[_index].isReserved, "Room not reserved");
        require(block.timestamp > rooms[_index].currentReservationEnds, "Reservation not yet ended");
        require(
            rooms[_index].owner == msg.sender || rooms[_index].currentReservedTo == msg.sender,
            "No access"
        );

        uint256 amountToSendToOwner = rooms[_index].currentBookingFee - reservationFee;

        require(
            IERC20Token(cEURTokenAddress).transfer(rooms[_index].owner, amountToSendToOwner),
            "Transfer to owner failed."
        );

        require(
            IERC20Token(cEURTokenAddress).transfer(rooms[_index].currentReservedTo, reservationFee),
            "Transfer of reservation fee to user failed."
        );

        rooms[_index].currentReservedTo = address(0);
        rooms[_index].currentBookingFee = 0;
        rooms[_index].isReserved = false;
    }

    function getRoomsLength() public view returns (uint256) {
        return roomsLength;
    }

    function getReservationFee() public view returns (uint256) {
        return reservationFee;
    }
}
