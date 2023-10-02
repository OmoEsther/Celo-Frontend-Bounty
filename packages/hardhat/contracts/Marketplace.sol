// SPDX-License-Identifier: MIT

// Version of Solidity compiler this program was written for
pragma solidity >=0.7.0 <0.9.0;

// Interface for the ERC20 token, in our case cUSD
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
}

// Contract for the marketplace
contract Marketplace {
    // Keeps track of the number of rooms in the marketplace
    uint256 internal roomsLength = 0;
    // Address of the cEURToken
    address internal cEURTokenAddress = 0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F;
    // Reservation Fee
    uint256 reservationFee = 1 ether;
    // Structure for a room
    struct Room {
        // Address of the product owner
        address payable owner;
        // Name of the product
        string name;
        // Link to an image of the product
        string image;
        // Description of the product
        string description;
        // Location of the product
        string location;
        // Price of the product in tokens
        uint256 pricePerNight;
        // Hotel reservation status
        bool isReserved;
        // Address room is reserved to
        address currentReservedTo;
        // Time current reservation ends
        uint256 currentReservationEnds;
        // Fee payed to book room
        uint256 currentBookingFee;
    }

    // Mapping of rooms to their index
    mapping(uint256 => Room) internal rooms;

    // Writes a new room to the marketplace
    function writeroom(
        string memory _name,
        string memory _image,
        string memory _description,
        string memory _location,
        uint256 _pricePerNight
    ) public {
        // Add check to ensure that price of room per night is greater than 0
        require(_pricePerNight > 0, "Price must be greater than 0");
        // Room reservation end time is initially 0 because it has not been reserved yet
        uint256 _reservationEnds = 0;
        // Adds a new room struct to the rooms mapping
        rooms[roomsLength] = Room(
            // Sender's address is set as the owner
            payable(msg.sender),
            _name,
            _image,
            _description,
            _location,
            _pricePerNight,
            false,
            address(this),
            _reservationEnds,
            0
        );
        // Increases the number of rooms in the marketplace by 1
        roomsLength++;
    }

    // Reads a room from the marketplace
    function readRoom(
        // Index of the room
        uint256 _index
    )
        public
        view
        returns (Room memory)
    {
        // Returns the details of the room
        return (rooms[_index]);
    }

    // Make reservation for a room
    function makeReservation(uint256 _index, uint256 _noOfNights) public payable {
        // check that room is not reserved
        require(!rooms[_index].isReserved, "room is reserved");
        // calculate the no of nights in seconds, for setting we set it to minutes
        uint256 noOfNightsInSeconds = _noOfNights * 1 minutes;
        // calculate booking fee for room
        uint256 bookingFee = (rooms[_index].pricePerNight * _noOfNights) + reservationFee;
        // transfer the money 
        require(
            IERC20Token(cEURTokenAddress).transferFrom(
                // Sender's address is the buyer
                msg.sender,
                // Receiver's address is the room owner
                address(this),
                // Amount of tokens to transfer is the total amount of order
                bookingFee
            ),
            // If transfer fails, throw an error message
            "Transfer failed."
        );
        // set reservation time
        rooms[_index].currentReservationEnds = block.timestamp + noOfNightsInSeconds;
        // set reserved to
        rooms[_index].currentReservedTo  = msg.sender;
        // set room as reserved
        rooms[_index].isReserved = true;
        // add the booking fee 
        rooms[_index].currentBookingFee = bookingFee;
    }

    // End reservation to a room
    function endReservation(uint256 _index) public payable {
        // check that room is reserved
        require(rooms[_index].isReserved, "room not reserved");
        // check that reservation end time has ended
        require(block.timestamp > rooms[_index].currentReservationEnds, "reservation not yet ended");
        // check that room is reserved to caller or that caller is owner
        require(
            rooms[_index].currentReservedTo == msg.sender || 
            rooms[_index].owner == msg.sender, "no access"
        );
        // calculate the money to send to the owner
        uint256 amountToSendToOwner = rooms[_index].currentBookingFee - reservationFee;
        // transfer booking fee to the room owner
        require(IERC20Token(cEURTokenAddress).transfer(rooms[_index].owner, amountToSendToOwner), "Transfer failed");
        // transfer reservation fee back to user
        require( IERC20Token(cEURTokenAddress).transfer(rooms[_index].currentReservedTo, reservationFee), "Transfer failed");
        // reset room params to default
        rooms[_index].currentReservedTo  = address(this);
        rooms[_index].currentBookingFee = 0;
        rooms[_index].isReserved = false;
    }

    // Returns the number of rooms in the marketplace
    function getRoomsLength() public view returns (uint256) {
        return (roomsLength);
    }

    // Returns the reservation fee
    function getReservationFee() public view returns (uint256) {
        return reservationFee;
    }
}
