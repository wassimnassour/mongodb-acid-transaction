const { connectToDatabase } = require("./helpers")

async function main() {
  const client = connectToDatabase()
  await createReservation(
    client,
    "leslie@example.com",
    "Infinite Views",
    [new Date("2019-12-31"), new Date("2020-01-01")],
    {
      pricePerNight: 180,
      specialRequests: "Late checkout",
      breakfastIncluded: true,
    }
  )
}

main().catch((err) => console.log(err))

/**
 * The reservation document that will be added to the users collection document for this user
 */
async function createReservation(
  client,
  userEmail,
  nameOfListing,
  reservationDates,
  reservationDetails
) {
  const usersCollection = client.db("sample_airbnb").collection("users")
  const listingsAndReviewsCollection = client
    .db("sample_airbnb")
    .collection("listingsAndReviews")

  const transactionOptions = {
    readPreference: "primary",
    readConcern: { level: "local" },
    writeConcern: { w: "majority" },
  }

  const reservation = createReservationDocument(
    nameOfListing,
    reservationDates,
    reservationDetails
  )

  const session = client.startSession()

  try {
    const transactionResults = await session.withTransaction(async () => {
      /**
       * - add reservation to reservations array
       * - $addToSet ,{used to add to array and check if element is already there}
       */
      const usersUpdateResults = await usersCollection.updateOne(
        { email: userEmail },
        { $addToSet: { reservations: reservation } },
        { session }
      )
      console.log(
        `${usersUpdateResults.matchedCount} document(s) found in the users collection with the email address ${userEmail}.`
      )
      console.log(
        `${usersUpdateResults.modifiedCount} document(s) was/were updated to include the reservation.`
      )

      /// check if reservation already reserved
      const isListingReservedResults =
        await listingsAndReviewsCollection.findOne(
          { name: nameOfListing, datesReserved: { $in: reservationDates } },
          { session }
        )
      if (isListingReservedResults) {
        await session.abortTransaction()
        console.error(
          "This listing is already reserved for at least one of the given dates. The reservation could not be created."
        )
        console.error(
          "Any operations that already occurred as part of this transaction will be rolled back."
        )
        return
      }

      // add reservation
      const listingsAndReviewsUpdateResults =
        await listingsAndReviewsCollection.updateOne(
          { name: nameOfListing },
          { $addToSet: { datesReserved: { $each: reservationDates } } },
          { session }
        )
      console.log(
        `${listingsAndReviewsUpdateResults.matchedCount} document(s) found in the listingsAndReviews collection with the name ${nameOfListing}.`
      )
      console.log(
        `${listingsAndReviewsUpdateResults.modifiedCount} document(s) was/were updated to include the reservation dates.`
      )
    }, transactionOptions)

    if (transactionResults) {
      console.log("The reservation was successfully created.")
    } else {
      console.log("The transaction was intentionally aborted.")
    }
  } catch (error) {
    console.log("The transaction was aborted due to an unexpected error: " + e)
  } finally {
    await session.endSession()
  }
}

function createReservationDocument(
  nameOfListing,
  reservationDates,
  reservationDetails
) {
  // Create the reservation
  let reservation = {
    name: nameOfListing,
    dates: reservationDates,
  }

  // Add additional properties from reservationDetails to the reservation
  for (let detail in reservationDetails) {
    reservation[detail] = reservationDetails[detail]
  }

  return reservation
}
