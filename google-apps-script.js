// Google Apps Script for RSVP to Google Sheets
// Deploy this as a web app to handle RSVP submissions

function doPost(e) {
  try {
    let requestData;

    // Try to parse as form data first
    if (e.parameter && e.parameter.data) {
      requestData = JSON.parse(e.parameter.data);
    } else if (e.postData && e.postData.contents) {
      requestData = JSON.parse(e.postData.contents);
    } else {
      throw new Error(
        "No data found in request. Parameter: " +
          JSON.stringify(e.parameter) +
          ", PostData: " +
          JSON.stringify(e.postData)
      );
    }

    return handleRSVPSubmission(requestData);
  } catch (error) {
    console.error("Error in doPost:", error);
    // Return error response with CORS headers
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleRSVPSubmission(data) {
  try {
    console.log("Handling RSVP submission:", data);

    // Get the active spreadsheet (you'll need to create this)
    const spreadsheet = SpreadsheetApp.openById(
      "1UuwhhJeyvbaOIzRCXYVmzlre16dS8BwVukXyjaQQr6U"
    );
    const sheet = spreadsheet.getSheetByName("RSVP Responses");
    console.log("Sheet found:", sheet ? "Yes" : "No");

    // Prepare the row data
    const rowData = [
      data.guestId,
      data.guestName,
      data.partnerName || "",
      data.attendance,
      data.extraGuests,
      data.favoriteSongs[0] || "",
      data.favoriteSongs[1] || "",
      data.reaction || "",
      data.message || "",
      data.submissionTime,
      // Tracking data
      data.utmSource || "",
      data.utmMedium || "",
      data.utmCampaign || "",
      data.referrer || "",
      data.sentBy || "",
      data.userAgent || "",
    ];
    console.log("Row data to append:", rowData);

    // Append the data to the sheet
    sheet.appendRow(rowData);
    console.log("Data appended successfully");

    // Return success response with CORS headers
    return ContentService.createTextOutput(
      JSON.stringify({ success: true, message: "RSVP submitted successfully" })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error("Error handling RSVP submission:", error);
    throw error;
  }
}

function doGet(e) {
  try {
    console.log("Received GET request:", JSON.stringify(e));

    // Check if this is an RSVP status check request
    if (e && e.parameter && e.parameter.action === "checkRSVP") {
      const guestId = e.parameter.guestId;
      console.log("Checking RSVP status for guestId:", guestId);

      if (!guestId) {
        throw new Error("guestId parameter is missing for checkRSVP action.");
      }

      const spreadsheet = SpreadsheetApp.openById(
        "1UuwhhJeyvbaOIzRCXYVmzlre16dS8BwVukXyjaQQr6U"
      );
      const sheet = spreadsheet.getSheetByName("RSVP Responses");

      if (!sheet) {
        // If the sheet doesn't exist, no one has RSVP'd yet
        return ContentService.createTextOutput(
          JSON.stringify({ found: false })
        ).setMimeType(ContentService.MimeType.JSON);
      }

      const data = sheet.getDataRange().getValues();
      const guestIdColumnIndex = 0; // Assuming 'Guest ID' is the first column (A)

      // Search for the guestId in the specified column
      for (let i = 1; i < data.length; i++) {
        // Start from row 1 to skip header
        if (data[i][guestIdColumnIndex] == guestId) {
          console.log("Found matching guestId at row", i + 1);
          return ContentService.createTextOutput(
            JSON.stringify({ found: true })
          ).setMimeType(ContentService.MimeType.JSON);
        }
      }

      console.log("No matching guestId found.");
      return ContentService.createTextOutput(
        JSON.stringify({ found: false })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Default GET response
    return ContentService.createTextOutput(
      JSON.stringify({
        status: "RSVP Web App is running",
        timestamp: new Date().toISOString(),
        message: "Web app is accessible",
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error("Error in doGet:", error);
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doOptions(e) {
  return ContentService.createTextOutput("").setMimeType(
    ContentService.MimeType.TEXT
  );
}

// Setup function to create the sheet structure
function setupSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet =
    spreadsheet.getSheetByName("RSVP Responses") ||
    spreadsheet.insertSheet("RSVP Responses");

  // Set up headers
  const headers = [
    "Guest ID",
    "Guest Name",
    "Partner Name",
    "Attendance",
    "Extra Guests",
    "Song 1",
    "Song 2",
    "Reaction",
    "Message",
    "Submission Time",
    "UTM Source",
    "UTM Medium",
    "UTM Campaign",
    "Referrer",
    "Sent By",
    "User Agent",
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");

  // Auto-resize columns
  sheet.autoResizeColumns(1, headers.length);
}

// Test function to verify spreadsheet access
function testSpreadsheetAccess() {
  try {
    console.log("Testing spreadsheet access...");

    const spreadsheet = SpreadsheetApp.openById(
      "1UuwhhJeyvbaOIzRCXYVmzlre16dS8BwVukXyjaQQr6U"
    );
    console.log("Spreadsheet opened:", spreadsheet.getName());

    let sheet = spreadsheet.getSheetByName("RSVP Responses");
    if (!sheet) {
      console.log("RSVP Responses sheet not found, creating it...");
      sheet = spreadsheet.insertSheet("RSVP Responses");

      // Set up headers
      const headers = [
        "Guest ID",
        "Guest Name",
        "Partner Name",
        "Attendance",
        "Extra Guests",
        "Song 1",
        "Song 2",
        "Reaction",
        "Message",
        "Submission Time",
      ];

      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
      console.log("Headers set up successfully");
    }

    // Test appending a row
    const testRow = [
      "TEST",
      "Test Guest",
      "Test Partner",
      "yes",
      1,
      "Test Song 1",
      "Test Song 2",
      "😊",
      "Test message",
      new Date().toISOString(),
    ];

    sheet.appendRow(testRow);
    console.log("Test row appended successfully");

    return "Test completed successfully!";
  } catch (error) {
    console.error("Test failed:", error);
    return "Test failed: " + error.toString();
  }
}
