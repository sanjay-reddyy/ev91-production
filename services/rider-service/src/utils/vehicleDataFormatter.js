// Helper function to sanitize vehicle data before storing
function sanitizeVehicleData(vehicleDetails) {
  let sanitizedVehicleMake = vehicleDetails.vehicleMake;
  let sanitizedVehicleModel = vehicleDetails.vehicleModel;

  // Check if vehicleModel is a JSON string
  if (
    typeof vehicleDetails.vehicleModel === "string" &&
    vehicleDetails.vehicleModel.startsWith("{")
  ) {
    try {
      const vehicleData = JSON.parse(vehicleDetails.vehicleModel);
      sanitizedVehicleMake =
        vehicleData.oem?.name ||
        vehicleData.oem?.displayName ||
        sanitizedVehicleMake ||
        "Unknown";
      sanitizedVehicleModel =
        vehicleData.name ||
        vehicleData.modelCode ||
        sanitizedVehicleModel ||
        "Unknown";
      console.log(
        `Parsed vehicle JSON to make=${sanitizedVehicleMake}, model=${sanitizedVehicleModel}`
      );
    } catch (e) {
      console.error("Error parsing vehicleModel JSON:", e);
    }
  }

  return {
    ...vehicleDetails,
    vehicleMake: sanitizedVehicleMake,
    vehicleModel: sanitizedVehicleModel,
  };
}

// Export the function for use in other files
module.exports = { sanitizeVehicleData };
