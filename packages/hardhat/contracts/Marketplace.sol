// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

// Interface for the ERC20 token, in our case cEUR
interface IERC20Token {
    // Transfers tokens from one address to another
    function transfer(address, uint256) external returns (bool);

    // Approves a transfer of tokens from one address to another
    function approve(address, uint256) external returns (bool);

    // Transfers tokens from one address to another, with the permission of the first address
    function transferFrom(address, address, uint256) external returns (bool);

    // Returns the total supply of tokens
    function totalSupply() external view returns (uint256);

    // Returns the balance of tokens for a given address
    function balanceOf(address) external view returns (uint256);

    // Returns the amount of tokens that an address is allowed to transfer from another address
    function allowance(address, address) external view returns (uint256);

    // Event for token transfers
    event Transfer(address indexed from, address indexed to, uint256 value);
    // Event for approvals of token transfers
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
    // ... (other ERC20 functions)
}

contract Marketplace {
    // set room length to 0
    uint256 internal roomsLength = 0;
    // used ceur as faucet does not have cEUR
    address internal cEURTokenAddress =
        0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F;
    // set reservationFEE to 1 CELO token
    uint256 public reservationFee = 1 ether;

    // struct containing room parameters
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

    // mapping of room index to room struct
    mapping(uint256 => Room) internal rooms;

    // function to add room to the marketplace
    function writeroom(
        string memory _name,
        string memory _image,
        string memory _description,
        string memory _location,
        uint256 _pricePerNight
    ) public {
        // validation to inputs for room parameters
        require(bytes(_name).length > 0, "input data cannot be empty");
        require(bytes(_image).length > 0, "input data cannot be empty");
        require(bytes(_description).length > 0, "input data cannot be empty");
        require(bytes(_location).length > 0, "input data cannot be empty");
        require(_pricePerNight > 0, "Price must be greater than 0");

        // set reservationEnd time to zero
        uint256 _reservationEnds = 0;

        // add room data to the contract storage
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
        // increment no of rooms in marketplace
        roomsLength++;
    }

    // function to read rooom information from contract
    function readRoom(uint256 _index) public view returns (Room memory) {
        return rooms[_index];
    }

    // function to reserve a room
    function makeReservation(
        uint256 _index,
        uint256 _noOfNights
    ) public payable {
        // check that room is not reserved
        require(!rooms[_index].isReserved, "Room is reserved");

        // used minutes because this is a test environment
        uint256 noOfNightsInSeconds = _noOfNights * 1 minutes;

        // calculate the booking fee for the room
        uint256 bookingFee = (rooms[_index].pricePerNight * _noOfNights);

        // add the reservationFee to get the total fee
        uint256 totalFee = bookingFee + reservationFee;

        // make the transfer to the contract
        require(
            IERC20Token(cEURTokenAddress).transferFrom(
                msg.sender,
                address(this),
                totalFee
            ),
            "Token transfer failed."
        );

        // update room information to show that room is booked and set the reservation end time
        rooms[_index].currentReservationEnds =
            block.timestamp +
            noOfNightsInSeconds;
        rooms[_index].currentReservedTo = msg.sender;
        rooms[_index].isReserved = true;
        rooms[_index].currentBookingFee = bookingFee;
    }

    // function to end reservation
    function endReservation(uint256 _index) public {
        // check that room is reserved
        require(rooms[_index].isReserved, "Room not reserved");

        // check that time for room booking has elapsed
        require(
            block.timestamp > rooms[_index].currentReservationEnds,
            "Reservation not yet ended"
        );

        // check that who is calling the function is either the room owner or who reserved the room.
        require(
            rooms[_index].owner == msg.sender ||
                rooms[_index].currentReservedTo == msg.sender,
            "No access"
        );

        // calculate the amount to send to room owner
        uint256 amountToSendToOwner = rooms[_index].currentBookingFee -
            reservationFee;

        // transfer the room owner profit
        require(
            IERC20Token(cEURTokenAddress).transfer(
                rooms[_index].owner,
                amountToSendToOwner
            ),
            "Transfer to owner failed."
        );

        // refund the reservationFee to the address that made the reservation
        require(
            IERC20Token(cEURTokenAddress).transfer(
                rooms[_index].currentReservedTo,
                reservationFee
            ),
            "Transfer of reservation fee to user failed."
        );

        // update room information to unbooked
        rooms[_index].currentReservedTo = address(0);
        rooms[_index].currentBookingFee = 0;
        rooms[_index].isReserved = false;
    }

    // function to get number of rooms in the marketplace
    function getRoomsLength() public view returns (uint256) {
        return roomsLength;
    }

    // function to get reservation fee
    function getReservationFee() public view returns (uint256) {
        return reservationFee;
    }
}
