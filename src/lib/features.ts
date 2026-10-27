// Phase gates. The build goes one aspect at a time: patient and specialist first,
// made solid, then laboratories, then pharmacies. Flip a flag to switch a module on.
export const FEATURES: { lab: boolean; pharmacy: boolean; capture: boolean } = {
  lab: false,
  pharmacy: false,
  // Saves every action to the database (see lib/capture.ts). Set to false to stop sending anything.
  capture: true,
};

export const PRODUCT = "AfyaConnect";
