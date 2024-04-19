let selectedSeats = [];
let selectedTrainId = null;
let selectedDate = null;
let selectedNIC = null;

function toggleSeatSelection(seatButton) {
  const isSelected = seatButton.classList.contains("selected");

  if (!isSelected && !seatButton.disabled && selectedSeats.length < 5) {
    seatButton.classList.add("selected");
    seatButton.style.backgroundColor = "green";
    selectedSeats.push(seatButton.dataset.seatId);
  } else if (isSelected) {
    seatButton.classList.remove("selected");
    seatButton.style.backgroundColor = seatButton.disabled ? "red" : "white";
    const index = selectedSeats.indexOf(seatButton.dataset.seatId);
    if (index > -1) {
      selectedSeats.splice(index, 1);
    }
  }

  if (selectedSeats.length >= 5) {
    const allSeats = document.querySelectorAll(
      ".seat-button:not(.selected):not(.booked)"
    );
    allSeats.forEach((seat) => {
      seat.disabled = true;
    });
    alert("You can't select more than 5 seats.");
  } else {
    const allSeats = document.querySelectorAll(".seat-button:not(.booked)");
    allSeats.forEach((seat) => {
      seat.disabled = false;
    });
  }
}

function createBookingRequest() {
  if (
    selectedTrainId === null ||
    selectedDate === null ||
    selectedSeats.length === 0
  ) {
    alert("Please select a train, date, seats, and provide your NIC.");
    return null;
  }

  return {
    TrainId: selectedTrainId,
    Date: selectedDate,
    Seats: selectedSeats,
  };
}

async function addBookingAsync(trainId, date, nic, seats) {
  try {
    const booking = {
      TrainId: trainId,
      Date: date,
      Nic: nic,
      Seats: seats,
    };

    const response = await fetch(
      "https://localhost:7125/api/BookedUser/AddBooking",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(booking),
      }
    );

    if (response.ok) {
      alert("Booking data added successfully.");
    } else {
      const errorContent = await response.text();
      console.error(
        "Failed to add booking data. Status code:",
        response.status,
        "Error content:",
        errorContent
      );
      alert(
        `Failed to add booking data. Status code: ${response.status}. Error content: ${errorContent}`
      );
    }
  } catch (error) {
    console.error(
      "An error occurred while adding booking data:",
      error.message
    );
    alert(`An error occurred while adding booking data: ${error.message}`);
  }
}

async function bookSeatsAsync(request) {
  try {
    const response = await fetch("https://localhost:7125/api/Booking/book", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (response.ok) {
      const bookingResult = await response.json();
      alert("Booking successful!");
    } else {
      const errorContent = await response.text();
      console.error(
        "Failed to book seats. Status code:",
        response.status,
        "Error content:",
        errorContent
      );
      alert(
        `Failed to book seats. Status code: ${response.status}. Error content: ${errorContent}`
      );
    }
  } catch (error) {
    console.error("Failed to book seats:", error.message);
    alert(`Failed to book seats: ${error.message}`);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const resetBtn = document.getElementById("reset-btn");
  const confirmBtn = document.getElementById("confirm-btn");
  const nicInput = document.getElementById("nic");
  const findBtn = document.getElementById("find-btn");

  loadTrain();

  findBtn.addEventListener("click", onFindBtnClick);
  confirmBtn.addEventListener("click", onConfirmBtnClick);

  async function loadTrain() {
    const trainUrl = "https://localhost:7125/api/Train";
    const stationUrl = "https://localhost:7125/api/Train/Stations";

    try {
      const [trainResponse, stationResponse] = await Promise.all([
        fetch(trainUrl),
        fetch(stationUrl),
      ]);

      if (!trainResponse.ok || !stationResponse.ok) {
        throw new Error("Failed to fetch data.");
      }

      const [trainJsonArray, stationJson] = await Promise.all([
        trainResponse.json(),
        stationResponse.json(),
      ]);

      const comStartStation = document.getElementById("start-station");
      const comDestinationStation = document.getElementById(
        "destination-station"
      );

      comStartStation.innerHTML = "";
      comDestinationStation.innerHTML = "";

      stationJson.startStations.forEach((station) => {
        comStartStation.innerHTML += `<option value="${station}">${station}</option>`;
      });

      stationJson.destinationStations.forEach((station) => {
        comDestinationStation.innerHTML += `<option value="${station}">${station}</option>`;
      });

      const tbody = document.querySelector("#train-data tbody");
      tbody.innerHTML = "";

      trainJsonArray.forEach((train) => {
        const row = `
                    <tr>
                        <td>${train.trainId}</td>
                        <td>${train.name}</td>
                        <td>${train.startStation}</td>
                        <td>${train.destinationStation}</td>
                        <td>${train.capacity}</td>
                        <td>${train.departureTime}</td>
                        <td>${train.arrivalTime}</td>
                        <td>${train.date}</td>
                        <td><button class="book-btn" data-train="${train.trainId}">Book</button></td>
                    </tr>`;
        tbody.innerHTML += row;
      });
    } catch (error) {
      console.error("Error loading train data:", error.message);
      alert("Failed to load train data. Please try again later.");
    }
  }

  async function onFindBtnClick() {
    const date = document.getElementById("date").value;
    const startStation = document.getElementById("start-station").value;
    const destinationStation = document.getElementById(
      "destination-station"
    ).value;

    if (date && startStation && destinationStation) {
      try {
        const trains = await findTrains(date, startStation, destinationStation);
        updateTrainTable(trains);
      } catch (error) {
        alert("No Train Available.");
      }
    } else {
      alert("Please select a date and stations.");
    }
  }

  async function onConfirmBtnClick() {
    const bookingRequest = createBookingRequest();

    if (bookingRequest !== null) {
      const userAlreadyBooked = await CheckIfUserAlreadyBooked(
        selectedTrainId,
        selectedDate,
        selectedNIC,
        selectedSeats
      );

      if (!userAlreadyBooked) {
        await addBookingAsync(
          selectedTrainId,
          selectedDate,
          selectedNIC,
          bookingRequest.Seats
        );
        await bookSeatsAsync(bookingRequest);
      } else {
        alert("You are already booked for this train.");
      }
    }
  }

  async function CheckIfUserAlreadyBooked(trainId, date, nic, seats) {
    try {
      const queryString = `?trainId=${trainId}&date=${date}&nic=${nic}`;

      const response = await fetch(
        `https://localhost:7125/api/BookedUser/CheckIfExists${queryString}`
      );

      if (response.ok) {
        const resultJson = await response.json();
        return resultJson;
      } else {
        console.error(
          `Failed to check if user can book. Status code: ${response.status}`
        );
        alert(
          `Failed to check if user can book. Status code: ${response.status}`
        );
        return false;
      }
    } catch (error) {
      console.error("Failed to check if user can book:", error.message);
      alert(`Failed to check if user can book: ${error.message}`);
      return false;
    }
  }

  async function findTrains(date, startStation, destinationStation) {
    const formattedDate = new Date(date).toISOString().split("T")[0];
    const trainUrl = `https://localhost:7125/api/Train/Search?date=${formattedDate}&startStation=${startStation}&destinationStation=${destinationStation}`;

    const trainResponse = await fetch(trainUrl);
    if (!trainResponse.ok) {
      throw new Error("Failed to fetch train data.");
    }

    return await trainResponse.json();
  }

  function updateTrainTable(trains) {
    console.log("Updating train table with data:", trains);
    const tbody = document.querySelector("#train-data tbody");
    tbody.innerHTML = "";

    trains.forEach((train) => {
      const row = `<tr>
                    <td>${train.trainId}</td>
                    <td>${train.name}</td>
                    <td>${train.startStation}</td>
                    <td>${train.destinationStation}</td>
                    <td>${train.capacity}</td>
                    <td>${train.departureTime}</td>
                    <td>${train.arrivalTime}</td>
                    <td>${train.date}</td>
                    <td><button class="book-btn" data-train="${train.trainId}">Book</button></td>
                </tr>`;
      tbody.innerHTML += row;
    });
  }

  document
    .querySelector("#train-data")
    .addEventListener("click", async function (event) {
      if (event.target.classList.contains("book-btn")) {
        const trainId = event.target.getAttribute("data-train");
        const date = event.target
          .closest("tr")
          .querySelector("td:nth-child(8)").textContent;

        selectedTrainId = trainId;
        selectedDate = date;

        try {
          const seatInfo = await fetchSeatInformation(trainId, date);
          displaySeatInformation(seatInfo);
        } catch (error) {
          console.error("Error fetching seat information:", error.message);
          alert("Failed to fetch seat information. Please try again later.");
        }
      }
    });

  async function fetchSeatInformation(trainId, date) {
    const seatUrl = `https://localhost:7125/api/Booking/BookedSeats?TrainId=${trainId}&Date=${date}`;
    const seatResponse = await fetch(seatUrl);
    if (!seatResponse.ok) {
      throw new Error("Failed to fetch seat data.");
    }

    return await seatResponse.json();
  }

  function displaySeatInformation(seatInfo) {
    const seatPanel = document.getElementById("seat-panel");
    seatPanel.innerHTML = "";

    const capacities = {
      First: 20,
      Second: 40,
      Third: 50,
    };

    Object.keys(capacities).forEach((className) => {
      const classSeats = document.createElement("div");
      classSeats.className = "class-seats";

      for (let i = 1; i <= capacities[className]; i++) {
        const seatButton = document.createElement("button");
        const seatId = `${className} Class${String.fromCharCode(
          65 + Math.floor((i - 1) / 4)
        )}${i % 4 === 0 ? 4 : i % 4}`;
        seatButton.textContent = `${seatId}`;
        seatButton.className = `seat-button ${className.toLowerCase()}`;
        seatButton.dataset.seatId = seatId;
        seatButton.dataset.class = className;
        seatButton.style.color = "black";

        let isBooked = false;
        seatInfo.forEach((seatObj) => {
          if (seatObj.seatNumbers.includes(seatId)) {
            isBooked = true;
          }
        });

        if (isBooked) {
          seatButton.disabled = true;
          seatButton.classList.add("booked");
          seatButton.style.backgroundColor = "red";
        } else {
          seatButton.style.backgroundColor = "white";
          seatButton.addEventListener("click", function () {
            toggleSeatSelection(seatButton);
          });
        }

        classSeats.appendChild(seatButton);
      }

      seatPanel.appendChild(classSeats);
    });

    document.getElementById("confirm-btn").style.display = "block";
    document.getElementById("nic-section").style.display = "block";
  }

  resetBtn.addEventListener("click", function () {
    loadTrain();
    document.getElementById("date").value = "";
    document.getElementById("start-station").selectedIndex = 0;
    document.getElementById("destination-station").selectedIndex = 0;
  });

  nicInput.addEventListener("input", function () {
    selectedNIC = nicInput.value;
  });
});
